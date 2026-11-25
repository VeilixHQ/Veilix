<h1 align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="veilix-frontend/public/vlx-white.svg">
    <img src="veilix-frontend/public/vlx-black.svg" alt="Veilix" width="96">
  </picture>
  <br>
  Veilix
</h1>

<p align="center">
  <strong>Des alias e-mail pour protéger votre adresse e-mail personnelle.</strong><br>
  Sans journal d'activité, sans e-mail ni mot de passe, Open source et hébergé en Europe.
</p>

<p align="center">
  <a href="https://veilix.fr">veilix.fr</a> ·
  <a href="https://veilix.fr/alias-email-anonyme">Alias email anonyme</a> ·
  <a href="https://veilix.fr/transparence">Transparence</a> ·
  <a href="https://veilix.fr/securite">Sécurité</a> ·
  <a href="LICENSE">Licence AGPL-3.0</a>
</p>

<p align="center"><a href="README.en.md">English version</a></p>

<p align="center">
  <a href="LICENSE"><img alt="Licence AGPL-3.0" src="https://img.shields.io/badge/licence-AGPL--3.0-7c3aed"></a>
  <a href="https://github.com/VeilixHQ/Veilix/actions/workflows/tests.yml"><img alt="Tests" src="https://github.com/VeilixHQ/Veilix/actions/workflows/tests.yml/badge.svg"></a>
</p>

---

## Présentation

Veilix vous donne une adresse différente pour chaque site où vous vous inscrivez, par exemple `x7k2m9pl4q@alias.veilix.fr`.
Les e-mails reçus sur cet alias sont relayés vers votre boîte e-mail personnelle, qui n'est jamais communiquée au site. Si un alias reçoit du spam ou fuite, vous le désactivez : votre adresse e-mail personnelle reste intacte.

> Veilix est actuellement en **bêta privée**.

## Fonctionnalités

| | |
|---|---|
| **Alias à la demande** | Une adresse aléatoire par site, avec libellé et tags personnalisés |
| **Relais des e-mails** | Pièces jointes incluses, vers une ou plusieurs boîtes de destination |
| **Réponse depuis l'alias** | Vous répondez aux mails sans dévoiler votre adresse personnelle |
| **Activation et désactivation** | Un alias désactivé ne relaie plus aucun mail |
| **Blocage d'expéditeurs** | Par adresse ou par domaine entier, sous-domaines inclus |
| **Statistiques par alias** | Messages transférés et messages bloqués |
| **Alertes de fuite** | Après 7 jours, une alerte de fuite est fournie à l'utilisateur s'il y en a eu. |
| **Chiffrement PGP** | Les e-mails relayés peuvent être chiffrés avec votre clé publique (PGP/MIME) |
| **Clés API** | Jetons `vlx_…` pour créer et gérer vos alias par programme |
| **Rapport hebdomadaire** | Résumé de l'activité de vos alias, option désactivable |
| **Export de vos données** | Export RGPD depuis les paramètres |
| **Domaines personnalisés** | Bientôt disponible |

## Confidentialité et sécurité

- **Aucun mot de passe.** Votre navigateur génère une clé et une phrase de récupération de 12 mots ([bip39](https://github.com/bitcoinjs/bip39)). Veilix ne connaît pas cette phrase, et il n'existe pas de récupération par e-mail : si vous la perdez, l'accès ne peut pas être restauré. Pendant la bêta, une adresse e-mail de contact, chiffrée, sert uniquement à communiquer avec vous.
- **Adresses chiffrées.** Les adresses de destination sont chiffrées en base (AES-256-GCM).
- **Contenu non conservé.** Les e-mails sont relayés, pas stockés.
- **Aucun cookie de suivi**, aucun tracking.
- **Hébergement en Europe** : API et base de données chez Railway (Amsterdam), site chez Vercel (servi depuis Paris), e-mails par Mailgun (région européenne).
- **Code public** : tout ce qui tourne en production est dans ce dépôt.

### Signaler une faille

Écrivez à **security@veilix.fr** en décrivant le problème et comment le reproduire, sans le rendre public avant sa correction. Toute faille confirmée est corrigée sous une semaine. Détails sur [veilix.fr/securite](https://veilix.fr/securite) et dans [`security.txt`](veilix-frontend/public/.well-known/security.txt).

## Architecture

### Parcours d'un e-mail

<img src=".github/architecture/parcours-email-sombre.png" alt="Parcours d'un e-mail : expéditeur, Mailgun réception, API Veilix, Mailgun envoi, votre boîte e-mail personnelle" width="100%">

1. Un e-mail arrive sur `…@alias.veilix.fr`. Mailgun le transmet à l'API (`POST /email/inbound`) avec une signature vérifiée.
2. L'API retrouve l'alias, applique les blocages, les quotas et la détection de fuite, chiffre en PGP si demandé, puis renvoie l'e-mail vers votre boîte.
3. Quand vous répondez, le message repart par le même chemin et l'expéditeur ne voit que l'alias.
4. Les échecs et les plaintes remontent par `POST /email/events`.

### Site et compte

<img src=".github/architecture/site-et-compte-sombre.png" alt="Votre navigateur charge les pages depuis veilix.fr et appelle directement api.veilix.fr" width="70%">

Le site ne fait qu'afficher l'interface : c'est votre navigateur qui parle directement à l'API, avec la clé qu'il a générée.

## Pile technique

| Partie | Technologies |
|---|---|
| Site | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| API | Python 3.12, FastAPI, SQLAlchemy 2, Alembic |
| Base de données | PostgreSQL |
| E-mail | Mailgun (routes entrantes, envoi, webhooks) |
| Chiffrement | `cryptography` (AES-256-GCM), Sequoia PGP (`pysequoia`) |

## Structure du dépôt

```
Veilix/
├── Backend/                API FastAPI
│   ├── app/
│   │   ├── core/           configuration, chiffrement, sécurité, limites
│   │   ├── models/         modèles SQLAlchemy
│   │   ├── routes/         points d'entrée HTTP
│   │   ├── schemas/        schémas Pydantic
│   │   └── services/       logique métier (alias, relais, PGP, domaines…)
│   ├── migrations/         migrations Alembic
│   ├── scripts/            outils d'administration
│   └── tests/              tests pytest
├── veilix-frontend/        site Next.js
│   ├── app/                pages
│   ├── components/         composants
│   ├── lib/                client API, cryptographie, traductions FR et EN
│   └── public/             images et security.txt
└── LICENSE                 GNU AGPL-3.0
```

## Lancer Veilix en local

### Prérequis

- Python 3.12
- Node.js 22
- PostgreSQL 16 ou plus récent

### API

```bash
cd Backend
```

```bash
python3.12 -m venv .venv && source .venv/bin/activate
```

```bash
pip install -r requirements-dev.txt
```

```bash
cp .env.example .env
```

Renseignez `.env` (voir [Configuration](#configuration)), puis :

```bash
alembic upgrade head
```

```bash
uvicorn app.main:app --reload
```

L'API écoute sur `http://127.0.0.1:8000`.

### Site

```bash
cd veilix-frontend
```

```bash
npm ci
```

```bash
cp .env.example .env.local
```

```bash
npm run dev
```

Le site est disponible sur `http://localhost:3000`.

## Tests et vérifications

Les tests de l'API utilisent une base PostgreSQL dédiée, dont le nom doit contenir `test` :

```bash
cd Backend && TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/veilix_test python -m pytest -q
```

Pour le site :

```bash
cd veilix-frontend && npx tsc --noEmit && npm run lint && npm run build
```

Les tests de l'API tournent automatiquement sur GitHub Actions à chaque push sur `main` et à chaque pull request.

## Configuration

Toutes les variables de l'API sont listées dans [`Backend/.env.example`](Backend/.env.example). 

Les principales :

| Variable | Rôle |
|---|---|
| `DATABASE_URL` | Connexion PostgreSQL |
| `APP_ENV` | `production` active les contrôles de configuration au démarrage |
| `DOMAIN` | Domaine des alias (`alias.veilix.fr`) |
| `REPLY_DOMAIN` | Domaine des adresses de réponse |
| `MAILGUN_API_KEY` | Clé API Mailgun |
| `MAILGUN_DOMAIN` | Domaine d'envoi Mailgun |
| `MAILGUN_SIGNING_KEY` | Clé de signature des webhooks Mailgun |
| `MAILGUN_API_URL` | `https://api.eu.mailgun.net` pour la région européenne |
| `ENCRYPTION_KEY` | 32 octets en base64 url-safe : chiffre les adresses en base |
| `HMAC_SECRET` | Secret de signature des jetons et des adresses de réponse |
| `FRONTEND_URL`, `CORS_ORIGINS` | Adresse publique du site |
| `CLIENT_IP_HEADER` | En-tête portant l'IP réelle derrière le proxy de l'hébergeur |
| `CUSTOM_DOMAINS_ENABLED` | Active les domaines personnalisés (désactivé par défaut) |

Le site n'a besoin que de `NEXT_PUBLIC_API_URL`, l'adresse de l'API.

Pour générer les deux secrets :

```bash
python -c "import base64, secrets; print(base64.urlsafe_b64encode(secrets.token_bytes(32)).decode())"
```

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

> Conservez `ENCRYPTION_KEY` en lieu sûr : sans elle, les adresses enregistrées deviennent illisibles.

## Blog automatique

Chaque matin, le workflow [`blog.yml`](.github/workflows/blog.yml) publie un article sur [veilix.fr/blog](https://veilix.fr/blog) :

| Jour | Format |
|---|---|
| Lundi, mardi, jeudi, vendredi, samedi | Actualité du jour |
| Mercredi | Guide pratique tiré de la liste `guides` de [`sources.json`](.github/scripts/blog/sources.json) |
| Dimanche | Récapitulatif de la semaine, avec un lien vers chaque article |

Sans actualité exploitable, un guide pratique est rédigé à la place.

1. [`generate.py`](.github/scripts/blog/generate.py) récupère les actualités des dernières 48 h dans les flux de [`sources.json`](.github/scripts/blog/sources.json) et les nouvelles fuites de Have I Been Pwned.
2. Un premier agent Claude choisit le sujet, lit les sources, en cherche une seconde, puis rédige l'article en suivant la [charte éditoriale](.github/scripts/blog/charte.md).
3. Des contrôles automatiques vérifient la longueur, les intertitres, les formules interdites, les liens, les sources réellement lues, les identifiants CVE et les phrases recopiées.
4. Un second agent, rédacteur en chef, relit l'article face au texte intégral des sources, note l'exactitude, la clarté, l'utilité, l'originalité et le référencement, puis demande des corrections. Rien n'est publié sous 4/5.
5. La typographie française est appliquée, le site est compilé, l'article est publié dans `veilix-frontend/content/blog/` et son URL est envoyée à IndexNow. Le résumé de la relecture et le coût s'affichent dans l'onglet Actions.

| Réglage GitHub | Rôle |
|---|---|
| Secret `ANTHROPIC_API_KEY` | Clé de l'API Claude, obligatoire |
| Variable `BLOG_REVUE` | `oui` pour recevoir chaque article en pull request, avec la relecture en description, au lieu de le publier directement |

Chaque article se termine par un encart Veilix rédigé pour le sujet traité et relu comme le reste, avec un bouton vers les offres (`/pricing`). Un rappel discret apparaît aussi au milieu des articles longs.

La page `/blog` présente l'article à la une, les deux suivants, les derniers guides pratiques, le dernier récapitulatif puis tous les autres articles, 12 par page. Une recherche, des filtres par catégorie et des pages de catégorie paginées permettent de retrouver les anciens articles.

Pour ajuster le ton, modifiez `charte.md`. Pour ajouter des sujets de guides, des flux ou des formules interdites, modifiez `sources.json`. Pour retirer un article, supprimez son fichier JSON.

## Contribuer

Les signalements de bugs et les propositions sont les bienvenus dans les [issues](https://github.com/VeilixHQ/Veilix/issues). 
Pour une pull request :

1. Les tests de l'API et la compilation du site doivent passer.
2. Les textes visibles sont rédigés en français et en anglais.
3. Pour une faille de sécurité, écrivez à security@veilix.fr plutôt que d'ouvrir une issue publique.

## Contact

| Sujet | Adresse |
|---|---|
| Questions générales | contact@veilix.fr |
| Assistance | support@veilix.fr |
| Sécurité | security@veilix.fr |
| Juridique, RGPD | legal@veilix.fr |
| Partenariats | partnership@veilix.fr |

## Licence

Veilix est distribué sous la licence **GNU Affero General Public License v3.0** ([texte complet](LICENSE)).

Vous pouvez utiliser, étudier, modifier et redistribuer ce code. Si vous faites tourner une version modifiée de Veilix comme service accessible en ligne, vous devez publier son code source sous la même licence. La marque « Veilix » et son logo ne sont pas couverts par cette licence.
