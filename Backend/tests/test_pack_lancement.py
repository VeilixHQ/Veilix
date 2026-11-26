from concurrent.futures import ThreadPoolExecutor

import pytest

from app.models.key import Key
from app.services import pack_service
from tests.conftest import code_d_acces, corps_d_inscription, entetes, nouvelle_cle


def inscription(client, phase="private", key_id=None):
    return client.post("/key/register", json=corps_d_inscription(key_id or nouvelle_cle(), code_d_acces(phase)))


def remplir(db, nombre):
    from app.core.keys import stored_key_id

    for numero in range(1, nombre + 1):
        db.add(Key(key_id=stored_key_id(nouvelle_cle()), plan="pack", status="active", founder_number=numero))
    db.commit()


def test_compteur_initial(client):
    assert client.get("/pack/availability").json() == {"total": 100, "taken": 0, "remaining": 100}


def test_beta_privee_numerote_les_packs_dans_l_ordre(client, db):
    premiere, seconde = nouvelle_cle(), nouvelle_cle()
    assert inscription(client, key_id=premiere).json()["plan"] == "pack"
    assert inscription(client, key_id=seconde).json()["plan"] == "pack"
    assert {"id": "fondateur", "number": 1} in client.get("/key/me", headers=entetes(premiere)).json()["badges"]
    assert {"id": "fondateur", "number": 2} in client.get("/key/me", headers=entetes(seconde)).json()["badges"]
    assert client.get("/pack/availability").json() == {"total": 100, "taken": 2, "remaining": 98}


def test_beta_publique_ne_consomme_pas_de_pack(client, db):
    assert inscription(client, phase="public").json()["plan"] == "pro"
    assert db.query(Key).one().founder_number is None
    assert client.get("/pack/availability").json()["remaining"] == 100


def test_plus_de_pack_apres_le_centieme(client, db):
    remplir(db, 100)
    assert client.get("/pack/availability").json() == {"total": 100, "taken": 100, "remaining": 0}
    cle = nouvelle_cle()
    reponse = inscription(client, key_id=cle)
    assert reponse.status_code == 200
    assert reponse.json()["plan"] == "pro"
    db.expire_all()
    assert db.query(Key).filter(Key.founder_number.is_(None)).count() == 1


def test_attribution_manuelle_refusee_quand_complet(db):
    remplir(db, 100)
    from app.core.keys import stored_key_id

    cle = Key(key_id=stored_key_id(nouvelle_cle()), plan="pro", status="active")
    db.add(cle)
    db.commit()
    with pytest.raises(pack_service.PackSoldOut):
        pack_service.grant_pack(db, cle)
    db.rollback()
    db.refresh(cle)
    assert cle.plan == "pro"
    assert cle.founder_number is None


def test_place_liberee_reattribuee(db):
    from app.core.keys import stored_key_id

    remplir(db, 3)
    db.query(Key).filter(Key.founder_number == 2).delete()
    db.commit()
    cle = Key(key_id=stored_key_id(nouvelle_cle()), plan="pro", status="active")
    db.add(cle)
    db.commit()
    assert pack_service.grant_pack(db, cle) == 2
    db.commit()
    assert cle.plan == "pack"
    assert pack_service.grant_pack(db, cle) == 2


def test_attributions_simultanees_sans_doublon(client, db):
    remplir(db, 95)
    with ThreadPoolExecutor(max_workers=8) as executeur:
        plans = list(executeur.map(lambda _: inscription(client).json()["plan"], range(8)))
    assert plans.count("pack") == 5
    assert plans.count("pro") == 3
    db.expire_all()
    numeros = [numero for (numero,) in db.query(Key.founder_number).filter(Key.founder_number.isnot(None)).all()]
    assert sorted(numeros) == list(range(1, 101))
