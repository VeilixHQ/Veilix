from concurrent.futures import ThreadPoolExecutor

import pytest
from sqlalchemy.exc import IntegrityError

from app.core.encryption import encrypt, hash_email
from app.models.alias import Alias
from app.models.key import Key
from app.plans import check_alias_allowance
from tests.conftest import code_d_acces, corps_d_inscription, entetes, inscrire, nouvelle_cle


def definir(db, plan=None, credits=None):
    valeurs = {}
    if plan is not None:
        valeurs[Key.plan] = plan
    if credits is not None:
        valeurs[Key.credits] = credits
    db.query(Key).update(valeurs)
    db.commit()


def creer(client, cle, destination="alice@example.com"):
    return client.post("/alias", headers=entetes(cle), json={"destination_email": destination})


def compte(client, cle):
    reponse = client.get("/key/me", headers=entetes(cle))
    assert reponse.status_code == 200, reponse.text
    return reponse.json()


def remplir(db, nombre):
    proprietaire = db.query(Key).one()
    chiffre, version = encrypt("alice@example.com")
    db.add_all([
        Alias(key_id=proprietaire.id, alias_email=f"r{i}@alias.veilix-tests.fr", destination_email=chiffre,
              key_version=version, email_hmac=hash_email("alice@example.com"), status="active")
        for i in range(nombre)
    ])
    db.commit()


def test_compte_d_une_nouvelle_cle(client):
    cle = inscrire(client)
    donnees = compte(client, cle)
    assert donnees["plan"] == "pro"
    assert donnees["status"] == "active"
    assert donnees["credits"] == 0
    assert donnees["aliases_used"] == 0
    assert donnees["alias_quota"] == 100
    assert donnees["created_at"]
    assert "key_id" not in donnees


def test_compte_exige_une_cle_valide(client):
    assert client.get("/key/me").status_code == 422
    assert client.get("/key/me", headers=entetes("zz")).status_code == 401
    assert client.get("/key/me", headers=entetes(nouvelle_cle())).status_code == 401


def test_compte_refuse_une_cle_suspendue(client, db):
    cle = inscrire(client)
    db.query(Key).update({Key.status: "suspended"})
    db.commit()
    assert client.get("/key/me", headers=entetes(cle)).status_code == 403


def test_compte_compte_les_alias_de_la_cle_seulement(client):
    cle = inscrire(client)
    autre = inscrire(client)
    assert creer(client, cle).status_code == 200
    assert creer(client, cle).status_code == 200
    assert creer(client, autre).status_code == 200
    assert compte(client, cle)["aliases_used"] == 2
    assert compte(client, autre)["aliases_used"] == 1


def test_inscription_renvoie_la_date_de_creation(client):
    reponse = client.post("/key/register", json=corps_d_inscription(nouvelle_cle(), code_d_acces()))
    assert reponse.status_code == 200
    assert reponse.json()["created_at"]


def test_sans_abonnement_ni_credit_aucun_alias(client, db):
    cle = inscrire(client)
    definir(db, plan="credits")
    reponse = creer(client, cle)
    assert reponse.status_code == 403
    assert reponse.json()["detail"] == "NO_CREDITS"
    assert db.query(Alias).count() == 0
    assert compte(client, cle)["alias_quota"] == 0


def test_un_credit_par_alias_et_jamais_rendu(client, db):
    cle = inscrire(client)
    definir(db, plan="credits", credits=2)

    premier = creer(client, cle)
    assert premier.status_code == 200
    assert compte(client, cle)["credits"] == 1
    assert creer(client, cle).status_code == 200
    assert compte(client, cle)["credits"] == 0

    assert client.delete(f"/alias/{premier.json()['id']}", headers=entetes(cle)).status_code == 200
    donnees = compte(client, cle)
    assert donnees["credits"] == 0
    assert donnees["aliases_used"] == 1
    assert creer(client, cle).json()["detail"] == "NO_CREDITS"


def test_alias_refuse_ne_consomme_pas_de_credit(client, db):
    cle = inscrire(client)
    definir(db, plan="credits", credits=1)
    assert creer(client, cle, "x@alias.veilix-tests.fr").status_code == 400
    assert compte(client, cle)["credits"] == 1


def test_credits_prennent_le_relais_au_dela_du_quota_pro(client, db):
    cle = inscrire(client)
    remplir(db, 100)
    definir(db, credits=1)

    assert creer(client, cle).status_code == 200
    assert compte(client, cle)["credits"] == 0
    reponse = creer(client, cle)
    assert reponse.status_code == 403
    assert reponse.json()["detail"] == "LIMIT_REACHED_PRO"


def test_quota_pro_ne_consomme_pas_de_credit(client, db):
    cle = inscrire(client)
    definir(db, credits=3)
    assert creer(client, cle).status_code == 200
    assert compte(client, cle)["credits"] == 3


@pytest.mark.parametrize("plan", ["pack", "premium"])
def test_plans_illimites(client, db, plan):
    cle = inscrire(client)
    remplir(db, 150)
    definir(db, plan=plan)
    assert creer(client, cle).status_code == 200
    donnees = compte(client, cle)
    assert donnees["plan"] == plan
    assert donnees["alias_quota"] is None
    assert donnees["credits"] == 0


def test_cle_admin_illimitee(client, db):
    cle = inscrire(client)
    db.query(Key).update({Key.is_admin: True, Key.plan: "credits"})
    db.commit()
    assert creer(client, cle).status_code == 200
    donnees = compte(client, cle)
    assert donnees["plan"] == "admin"
    assert donnees["alias_quota"] is None


def test_creations_simultanees_ne_depassent_pas_les_credits(client, db):
    cle = inscrire(client)
    definir(db, plan="credits", credits=1)

    with ThreadPoolExecutor(max_workers=6) as executeur:
        statuts = list(executeur.map(lambda i: creer(client, cle, f"d{i}@example.com").status_code, range(6)))

    assert statuts.count(200) == 1
    assert statuts.count(403) == 5
    db.expire_all()
    assert db.query(Key).one().credits == 0
    assert db.query(Alias).count() == 1


def test_creations_simultanees_ne_depassent_pas_le_quota(client, db):
    cle = inscrire(client)
    remplir(db, 99)

    with ThreadPoolExecutor(max_workers=6) as executeur:
        statuts = list(executeur.map(lambda i: creer(client, cle, f"d{i}@example.com").status_code, range(6)))

    assert statuts.count(200) == 1
    db.expire_all()
    assert db.query(Alias).count() == 100


def test_credits_negatifs_refuses_par_la_base(client, db):
    inscrire(client)
    with pytest.raises(IntegrityError):
        db.query(Key).update({Key.credits: -1})
    db.rollback()


def test_regles_d_attribution():
    assert check_alias_allowance("pro", 99, 0).allowed
    assert not check_alias_allowance("pro", 100, 0).allowed
    assert check_alias_allowance("pro", 100, 1).uses_credit
    assert not check_alias_allowance("credits", 0, 0).allowed
    assert check_alias_allowance("credits", 5, 1).uses_credit
    assert not check_alias_allowance("pack", 0, 0).uses_credit
    assert not check_alias_allowance("inconnu", 0, 10).allowed
