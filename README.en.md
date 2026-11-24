<h1 align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="veilix-frontend/public/vlx-white.svg">
    <img src="veilix-frontend/public/vlx-black.svg" alt="Veilix" width="96">
  </picture>
  <br>
  Veilix
</h1>

<p align="center">
  <strong>Anonymous, secure email aliases that protect your personal email address.</strong><br>
  No activity logs, no password, open source and hosted in Europe.
</p>

<p align="center">
  <a href="https://veilix.fr">veilix.fr</a> ·
  <a href="https://veilix.fr/alias-email-anonyme">Anonymous email aliases</a> ·
  <a href="https://veilix.fr/transparence">Transparency</a> ·
  <a href="https://veilix.fr/securite">Security</a> ·
  <a href="LICENSE">AGPL-3.0 license</a>
</p>

<p align="center"><a href="README.md">Version française</a></p>

<p align="center">
  <a href="LICENSE"><img alt="License AGPL-3.0" src="https://img.shields.io/badge/license-AGPL--3.0-7c3aed"></a>
  <a href="https://github.com/VeilixHQ/Veilix/actions/workflows/tests.yml"><img alt="Tests" src="https://github.com/VeilixHQ/Veilix/actions/workflows/tests.yml/badge.svg"></a>
</p>

---

## Overview

Veilix gives you a different address for every site you sign up to, for example `x7k2m9pl4q@alias.veilix.fr`.
Emails sent to that alias are forwarded to your personal inbox, which is never shared with the site. If an alias starts receiving spam or leaks, you disable it: your personal email address stays untouched.

> Veilix is currently in **private beta**.

## Features

| | |
|---|---|
| **Aliases on demand** | A random address per site, with a label and custom tags |
| **Email forwarding** | Attachments included, to one or several destination inboxes |
| **Reply from the alias** | Reply without revealing your personal address |
| **Enable and disable** | A disabled alias stops forwarding |
| **Sender blocking** | By address or by whole domain, subdomains included |
| **Per-alias statistics** | Forwarded and blocked messages |
| **Leak alerts** | After a 7-day learning period, new unexpected sender domains are flagged |
| **PGP encryption** | Forwarded emails can be encrypted with your public key (PGP/MIME) |
| **API keys** | `vlx_…` tokens to create and manage aliases programmatically |
| **Weekly report** | Summary of your aliases' activity, can be turned off |
| **Data export** | GDPR export from the settings |
| **Custom domains** | Coming soon |

## Privacy and security

- **No password.** Your browser generates a key and a 12-word recovery phrase ([bip39](https://github.com/bitcoinjs/bip39)). Veilix never sees the phrase. During the beta, a contact email, stored encrypted, is required to send your access code; it is never used to log in.
- **Encrypted addresses.** Destination addresses are encrypted at rest (AES-256-GCM).
- **Content not stored.** Emails are forwarded, not stored. No activity logs.
- **No tracking cookies**, no trackers.
- **Hosted in Europe**: API and database on Railway (Amsterdam), website on Vercel (served from Paris), email through Mailgun (EU region).
- **Public code**: everything running in production lives in this repository.

Every piece of stored data, its protection and its retention is listed on the [Transparency page](https://veilix.fr/transparence).

### Reporting a vulnerability

Email **security@veilix.fr** with a description and steps to reproduce, and do not disclose it publicly before it is fixed. Every confirmed vulnerability is fixed within one week. Details at [veilix.fr/securite](https://veilix.fr/securite) and in [`security.txt`](veilix-frontend/public/.well-known/security.txt).

## Architecture

### How an email travels

<img src=".github/architecture/parcours-email-sombre.png" alt="Email flow: sender, Mailgun inbound, Veilix API, Mailgun outbound, your personal inbox" width="100%">

1. An email reaches `…@alias.veilix.fr`. Mailgun forwards it to the API (`POST /email/inbound`) with a verified signature.
2. The API finds the alias, applies blocks, quotas and leak detection, encrypts with PGP if enabled, then sends the email on to your inbox.
3. When you reply, the message goes back through the same path and the sender only sees the alias.
4. Failures and complaints come back through `POST /email/events`.

### Website and account

<img src=".github/architecture/site-et-compte-sombre.png" alt="Your browser loads pages from veilix.fr and calls api.veilix.fr directly" width="70%">

The website only renders the interface: your browser talks to the API directly, using the key it generated.

## Tech stack

| Part | Technologies |
|---|---|
| Website | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| API | Python 3.12, FastAPI, SQLAlchemy 2, Alembic |
| Database | PostgreSQL |
| Email | Mailgun (inbound routes, sending, webhooks) |
| Encryption | `cryptography` (AES-256-GCM), Sequoia PGP (`pysequoia`) |

## Running Veilix locally

### Requirements

- Python 3.12
- Node.js 22
- PostgreSQL 16 or later

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

Fill in `.env` (see [`Backend/.env.example`](Backend/.env.example)), then:

```bash
alembic upgrade head
```

```bash
uvicorn app.main:app --reload
```

The API listens on `http://127.0.0.1:8000`.

### Website

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

The website is available at `http://localhost:3000`.

## Tests

API tests use a dedicated PostgreSQL database whose name must contain `test`:

```bash
cd Backend && TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/veilix_test python -m pytest -q
```

Website checks:

```bash
cd veilix-frontend && npx tsc --noEmit && npm run lint && npm run build
```

API tests run automatically on GitHub Actions on every push to `main` and every pull request.

## Contributing

Bug reports and suggestions are welcome in the [issues](https://github.com/VeilixHQ/Veilix/issues). For a pull request:

1. API tests and the website build must pass.
2. User-facing text is written in French and English.
3. For a security issue, email security@veilix.fr instead of opening a public issue.

## Contact

| Topic | Address |
|---|---|
| General questions | contact@veilix.fr |
| Support | support@veilix.fr |
| Security | security@veilix.fr |
| Legal, GDPR | legal@veilix.fr |
| Partnerships | partnership@veilix.fr |

## License

Veilix is released under the **GNU Affero General Public License v3.0** ([full text](LICENSE)).

You may use, study, modify and redistribute this code. If you run a modified version of Veilix as a network service, you must publish its source code under the same license. The "Veilix" name and logo are not covered by this license.
