import calendar
import html
import json
import os
import re
import sys
import time
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

import anthropic
import feedparser

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
CONTENT = ROOT / "veilix-frontend" / "content" / "blog"
CONFIG = json.loads((HERE / "sources.json").read_text())
CHARTE = (HERE / "charte.md").read_text()
MODEL = os.environ.get("BLOG_MODEL", "claude-opus-5-5")
PRICE_INPUT = float(os.environ.get("BLOG_PRICE_INPUT", "4"))
PRICE_OUTPUT = float(os.environ.get("BLOG_PRICE_OUTPUT", "20"))
USER_AGENT = "VeilixBlog/1.0 (+https://veilix.fr/blog)"
SLUG = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+){2,11}$")
LINK = re.compile(r"\[([^\]]+)\]\(([^)\s]+)\)")
CVE = re.compile(r"CVE-\d{4}-\d{4,7}", re.I)
NUMBER = re.compile(r"\d{1,3}(?:[ ,.\u202f\u00a0]\d{3})+(?:[.,]\d+)?|\d+(?:[.,]\d+)?")
GENERIC_HEADINGS = {"contexte", "conclusion", "introduction", "résumé", "en résumé", "le contexte", "analyse", "pour conclure"}
SCORES = ["exactitude", "clarte", "utilite", "originalite", "referencement"]

ARTICLE_SCHEMA = {
    "type": "object",
    "properties": {
        "status": {"type": "string", "enum": ["ok", "skip"]},
        "skipReason": {"type": "string"},
        "slug": {"type": "string"},
        "title": {"type": "string"},
        "metaTitle": {"type": "string"},
        "description": {"type": "string"},
        "category": {"type": "string", "enum": CONFIG["categories"]},
        "tags": {"type": "array", "items": {"type": "string"}},
        "lead": {"type": "string"},
        "takeaways": {"type": "array", "items": {"type": "string"}},
        "sections": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "heading": {"type": "string"},
                    "paragraphs": {"type": "array", "items": {"type": "string"}},
                    "bullets": {"type": "array", "items": {"type": "string"}},
                },
                "required": ["heading", "paragraphs", "bullets"],
                "additionalProperties": False,
            },
        },
        "faq": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {"q": {"type": "string"}, "a": {"type": "string"}},
                "required": ["q", "a"],
                "additionalProperties": False,
            },
        },
        "sources": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {"title": {"type": "string"}, "url": {"type": "string"}, "publisher": {"type": "string"}},
                "required": ["title", "url", "publisher"],
                "additionalProperties": False,
            },
        },
        "cta": {
            "type": "object",
            "properties": {"accroche": {"type": "string"}, "texte": {"type": "string"}},
            "required": ["accroche", "texte"],
            "additionalProperties": False,
        },
    },
    "required": ["status", "skipReason", "slug", "title", "metaTitle", "description", "category", "tags", "lead", "takeaways", "sections", "faq", "sources", "cta"],
    "additionalProperties": False,
}

REVIEW_SCHEMA = {
    "type": "object",
    "properties": {
        "verdict": {"type": "string", "enum": ["publier", "corriger", "rejeter"]},
        "scores": {
            "type": "object",
            "properties": {name: {"type": "integer"} for name in SCORES},
            "required": SCORES,
            "additionalProperties": False,
        },
        "problemes": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "gravite": {"type": "string", "enum": ["bloquant", "important", "mineur"]},
                    "passage": {"type": "string"},
                    "probleme": {"type": "string"},
                    "correction": {"type": "string"},
                },
                "required": ["gravite", "passage", "probleme", "correction"],
                "additionalProperties": False,
            },
        },
        "resume": {"type": "string"},
    },
    "required": ["verdict", "scores", "problemes", "resume"],
    "additionalProperties": False,
}

WRITER = f"""Tu es le rédacteur du blog de Veilix (veilix.fr), un service français d'alias e-mail open source, hébergé en Europe, qui protège l'adresse e-mail personnelle de ses utilisateurs. La qualité de chaque article engage l'image de Veilix : un article approximatif, sensationnaliste ou trop commercial nuit davantage qu'une journée sans article.

Méthode
- Lis les sources avec web_fetch avant d'écrire. N'écris jamais à partir d'un simple résumé ou d'un extrait de recherche.
- Utilise web_search pour trouver une seconde source indépendante sur les faits importants, ou une source officielle (CNIL, ANSSI, CERT-FR, cybermalveillance.gouv.fr, communiqué de l'entreprise concernée), puis lis-la avec web_fetch.
- Si aucun sujet ne convient ou si les sources sont insuffisantes, réponds avec status "skip", explique pourquoi dans skipReason et laisse les autres champs vides.

Exactitude, règle absolue
- Chaque fait, chiffre, date, nom d'entreprise ou de groupe criminel provient des pages lues. N'invente rien.
- Recopie les chiffres exactement, avec leur unité. Si deux sources divergent, dis-le.
- Attribue les informations et emploie le conditionnel pour les revendications de pirates et les attributions non confirmées.
- N'accuse jamais une personne ou une entreprise au-delà de ce qu'affirment les sources.
- Aucun détail permettant de reproduire une attaque : l'angle est défensif et pédagogique.
- Les conseils pratiques doivent être exacts et à jour ; ne décris pas un menu ou un réglage d'application que tu n'as pas vu dans une source.

Format attendu
- title : 45 à 75 caractères, contient le mot-clé principal que taperait un internaute, sans point d'exclamation.
- metaTitle : 60 caractères au maximum, sans le nom Veilix (il est ajouté automatiquement).
- description : 120 à 155 caractères, dit au lecteur ce qu'il va apprendre.
- slug : minuscules sans accents, mots séparés par des tirets, 3 à 10 mots, sans date.
- lead : 2 ou 3 phrases qui donnent l'essentiel.
- takeaways : 3 ou 4 points clés courts et concrets.
- sections : 4 à 6 sections, 2 à 4 paragraphes chacune ; bullets facultatives (liste vide sinon). Longueur totale 900 à 1 300 mots.
- faq : 2 à 4 questions qu'un lecteur taperait dans un moteur de recherche, réponses de 1 à 3 phrases.
- tags : 3 à 6 mots-clés en minuscules.
- sources : uniquement les pages lues avec web_fetch, avec leur URL exacte.
- Mise en forme autorisée : **gras** et liens [texte](url). Rien d'autre.
- Liens externes : uniquement vers les URL des sources.
- Liens internes : vers les pages Veilix listées ou d'anciens articles du blog (/blog/<slug>), uniquement là où c'est naturel. Le corps de l'article reste informatif : ne termine pas par un paragraphe commercial.
- cta : l'encart Veilix affiché en fin d'article, avec un bouton vers les offres. C'est ici, et seulement ici, que tu fais la promotion de Veilix.
  - accroche : 35 à 70 caractères, sans point final, qui relie le sujet de l'article au bénéfice concret d'un alias e-mail (exemple : « La prochaine fuite ne touchera qu'un alias »).
  - texte : 1 ou 2 phrases, 120 à 260 caractères, qui expliquent comment un alias par site aurait limité le problème décrit ou aide à s'en protéger. Concret, au présent, sans lien.
  - Honnêteté obligatoire : un alias protège l'adresse e-mail personnelle, aide à repérer l'origine d'une fuite et à couper le spam ou le phishing qui arrive par un site. Il ne protège ni un mot de passe réutilisé, ni un numéro de téléphone, ni une carte bancaire, ni un appareil infecté. N'affirme jamais que Veilix aurait empêché une fuite. Si le lien avec l'e-mail est faible, reste sur un bénéfice général (moins de spam, adresse personnelle préservée).

{CHARTE}"""

REVIEWER = f"""Tu es rédacteur en chef et vérificateur des faits du blog de Veilix, un service français d'alias e-mail. Tu relis un article avant publication. Tu n'as aucune indulgence : un article publié avec une erreur factuelle ou un ton racoleur abîme la réputation de Veilix.

Tu reçois le texte intégral des sources lues par le rédacteur, l'article au format JSON, et une liste de chiffres et identifiants que le contrôle automatique n'a pas retrouvés tels quels dans les sources.

Vérifie, dans cet ordre :
1. Exactitude : chaque affirmation factuelle est-elle étayée par les sources ? Chiffres, dates, noms, attributions, conditionnel pour ce qui n'est pas confirmé. Toute affirmation non étayée est un problème bloquant.
2. Risque juridique : accusation non étayée contre une entreprise ou une personne.
3. Conseils : exacts, applicables, sans danger, sans promesse excessive sur Veilix.
4. Utilité : le lecteur sait-il s'il est concerné et quoi faire ?
5. Originalité : apporte-t-il plus que les sources (contexte, explication, conseils) ? Recopie-t-il des phrases ?
6. Clarté et style : respect de la charte, phrases courtes, pas de formules creuses ni de sensationnalisme.
7. Référencement : title, metaTitle, description, intertitres informatifs, mot-clé principal naturel.
8. Encart cta : accrocheur, en lien avec le sujet, mais honnête. Toute promesse excessive sur ce que fait un alias e-mail (empêcher une fuite, protéger un mot de passe, une carte bancaire ou un téléphone) est un problème bloquant.

Notes de 1 à 5 pour chaque critère. Verdict :
- "publier" uniquement s'il n'y a aucun problème bloquant ou important et que toutes les notes sont au moins à 4 ;
- "corriger" si les problèmes peuvent être corrigés à partir des sources disponibles ;
- "rejeter" si le sujet ne convient pas ou si les sources ne permettent pas un article fiable.
Pour chaque problème, cite le passage exact et donne une correction précise.

{CHARTE}"""


class Rejected(Exception):
    pass


class Tracker:
    def __init__(self):
        self.input = 0
        self.output = 0
        self.searches = 0
        self.fetches = 0
        self.calls = 0

    def add(self, usage):
        self.calls += 1
        self.input += usage.input_tokens + (usage.cache_creation_input_tokens or 0) + (usage.cache_read_input_tokens or 0)
        self.output += usage.output_tokens
        if usage.server_tool_use:
            self.searches += usage.server_tool_use.web_search_requests or 0
            self.fetches += usage.server_tool_use.web_fetch_requests or 0

    def cost(self):
        return self.input / 1e6 * PRICE_INPUT + self.output / 1e6 * PRICE_OUTPUT + self.searches * 0.01


def paris_now():
    return datetime.now(ZoneInfo("Europe/Paris"))


def clean(value, limit=600):
    text = html.unescape(re.sub(r"<[^>]+>", " ", value or ""))
    return re.sub(r"\s+", " ", text).strip()[:limit]


def download(url):
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=20) as response:
        return response.read()


def fetch_feed(feed, since):
    parsed = feedparser.parse(download(feed["url"]))
    items = []
    for entry in parsed.entries:
        stamp = entry.get("published_parsed") or entry.get("updated_parsed")
        if not stamp or not entry.get("link"):
            continue
        date = datetime.fromtimestamp(calendar.timegm(stamp), tz=timezone.utc)
        if date >= since:
            items.append({"publisher": feed["name"], "title": clean(entry.get("title"), 200), "url": entry["link"], "date": date.isoformat(), "summary": clean(entry.get("summary"))})
    return items


def fetch_hibp(since):
    items = []
    for breach in json.loads(download("https://haveibeenpwned.com/api/v3/breaches")):
        added = datetime.fromisoformat(breach["AddedDate"].replace("Z", "+00:00"))
        if added < since or not breach.get("IsVerified") or "Email addresses" not in breach.get("DataClasses", []):
            continue
        items.append({
            "publisher": "Have I Been Pwned",
            "title": f"Fuite de données {breach['Title']} : {breach['PwnCount']:,} comptes".replace(",", " "),
            "url": f"https://haveibeenpwned.com/Breach/{breach['Name']}",
            "date": added.isoformat(),
            "summary": clean(f"Date de la fuite : {breach.get('BreachDate')}. Données exposées : {', '.join(breach.get('DataClasses', []))}. {breach.get('Description', '')}"),
        })
    return items


def load_posts():
    if not CONTENT.exists():
        return []
    return sorted((json.loads(p.read_text()) for p in CONTENT.glob("*.json")), key=lambda p: p["published"], reverse=True)


def candidates(posts):
    now = datetime.now(timezone.utc)
    used = {s["url"].split("?")[0] for p in posts for s in p["sources"]}
    items = []
    for feed in CONFIG["feeds"]:
        try:
            found = fetch_feed(feed, now - timedelta(hours=CONFIG["window_hours"]))
            print(f"{feed['name']} : {len(found)} articles")
            items.extend(found)
        except Exception as error:
            print(f"::warning::Flux {feed['name']} indisponible : {error}")
    if CONFIG["hibp"]["enabled"]:
        try:
            found = fetch_hibp(now - timedelta(hours=CONFIG["hibp"]["window_hours"]))
            print(f"Have I Been Pwned : {len(found)} fuites")
            items.extend(found)
        except Exception as error:
            print(f"::warning::Have I Been Pwned indisponible : {error}")
    seen = set()
    unique = []
    for item in sorted(items, key=lambda i: i["date"], reverse=True):
        key = item["url"].split("?")[0]
        if key not in used and key not in seen:
            seen.add(key)
            unique.append(item)
    return unique[: CONFIG["max_candidates"]]


def week_posts(posts):
    since = (paris_now().date() - timedelta(days=6)).isoformat()
    return [p for p in posts if p["published"] >= since and p.get("format") != "recap"]


def next_guide(posts):
    done = {p.get("topicKey") for p in posts}
    return next((g for g in CONFIG["guides"] if g["key"] not in done), None)


def pick_format(posts):
    forced = os.environ.get("BLOG_FORMAT", "")
    if forced in ("actu", "guide", "recap"):
        return forced
    weekday = paris_now().weekday()
    if weekday == CONFIG["schedule"]["recap_weekday"] and len(week_posts(posts)) >= 3:
        return "recap"
    if weekday in CONFIG["schedule"]["guide_weekdays"] and next_guide(posts):
        return "guide"
    return "actu"


def as_json(value):
    return json.dumps(value, ensure_ascii=False, indent=1)


def brief(fmt, posts, items):
    recent = [{"slug": p["slug"], "title": p["title"], "date": p["published"]} for p in posts[:60]]
    parts = [f"Date du jour : {paris_now().date().isoformat()}"]
    if fmt == "actu":
        parts += [
            "Format : article d'actualité.",
            "Choisis UN sujet parmi les actualités candidates. Privilégie ce qui concerne directement le grand public francophone : fuite d'adresses e-mail ou de données personnelles, campagne de phishing, faille d'un service très utilisé, décision de la CNIL ou de l'ANSSI. Un sujet repris par plusieurs médias de la liste est généralement plus important. Écarte les sujets déjà traités et ceux sans enjeu concret pour un particulier.",
            "Actualités candidates :\n" + as_json(items),
        ]
    elif fmt == "guide":
        guide = next_guide(posts)
        parts += [
            "Format : guide pratique intemporel, catégorie « Conseils pratiques ».",
            f"Sujet : {guide['subject']}\nMot-clé principal à viser : {guide['keyword']} (dans le title, le lead et au moins un intertitre, naturellement).",
            "Trouve 2 ou 3 sources de référence avec web_search (cybermalveillance.gouv.fr, cnil.fr, ssi.gouv.fr, documentation officielle des services cités) et lis-les avec web_fetch. Si une actualité récente du blog illustre le sujet, cite-la avec un lien interne.",
        ]
    else:
        week = [{"slug": p["slug"], "title": p["title"], "lead": p["lead"], "sources": [s["url"] for s in p["sources"]]} for p in week_posts(posts)]
        parts += [
            "Format : récapitulatif de la semaine, catégorie « Récap de la semaine ». Titre du type « Cybersécurité : ce qu'il fallait retenir de la semaine du … ».",
            "Articles publiés cette semaine (fais un lien vers chacun avec /blog/<slug>, relis au moins une de leurs sources avec web_fetch) :\n" + as_json(week),
            "Autres actualités de la semaine que tu peux ajouter si elles sont importantes (lis-les avec web_fetch) :\n" + as_json(items[:20]),
        ]
    parts += [
        "Articles déjà publiés, à ne pas répéter, que tu peux lier avec /blog/<slug> :\n" + as_json(recent),
        "Pages Veilix que tu peux lier :\n" + as_json(CONFIG["internal_links"]),
        "Rends l'article au format demandé.",
    ]
    return "\n\n".join(parts)


def call(client, tracker, system, messages, schema, tools=None, max_tokens=48000):
    params = dict(
        model=MODEL,
        max_tokens=max_tokens,
        betas=["server-side-fallback-2026-07-01"],
        fallbacks="default",
        thinking={"type": "adaptive"},
        output_config={"effort": "high", "format": {"type": "json_schema", "schema": schema}},
        system=system,
        messages=messages,
    )
    if tools:
        params["tools"] = tools
    for _ in range(6):
        with client.beta.messages.stream(**params) as stream:
            response = stream.get_final_message()
        tracker.add(response.usage)
        messages.append({"role": "assistant", "content": response.content})
        if response.stop_reason != "pause_turn":
            return parse(response)
    raise RuntimeError("trop de reprises de la génération")


def parse(response):
    if response.stop_reason == "refusal":
        category = response.stop_details.category if response.stop_details else None
        raise Rejected(f"génération refusée par le modèle (catégorie : {category})")
    if response.stop_reason == "max_tokens":
        raise RuntimeError("réponse tronquée (max_tokens)")
    text = [b.text for b in response.content if b.type == "text"]
    if not text:
        raise RuntimeError("aucun texte dans la réponse")
    return json.loads(text[-1])


def write(client, tracker, messages):
    return call(client, tracker, WRITER, messages, ARTICLE_SCHEMA, tools=[
        {"type": "web_search_20260209", "name": "web_search", "max_uses": 5},
        {"type": "web_fetch_20260209", "name": "web_fetch", "max_uses": 8, "max_content_tokens": 15000},
    ])


def source_texts(messages):
    texts = {}
    for message in messages:
        if message["role"] != "assistant":
            continue
        calls = {}
        for block in message["content"]:
            if block.type == "server_tool_use" and block.name == "web_fetch":
                calls[block.id] = str(block.input.get("url", ""))
            elif block.type == "web_fetch_tool_result" and getattr(block.content, "type", "") == "web_fetch_result":
                source = block.content.content.source
                data = source.data if getattr(source, "type", "") == "text" else ""
                for url in (block.content.url, calls.get(block.tool_use_id)):
                    if url:
                        texts[url.rstrip("/")] = data
    return texts


def fields(article):
    yield article["title"]
    yield article["description"]
    yield article["lead"]
    yield from article["takeaways"]
    for section in article["sections"]:
        yield section["heading"]
        yield from section["paragraphs"]
        yield from section["bullets"]
    for item in article["faq"]:
        yield item["q"]
        yield item["a"]
    if article.get("cta"):
        yield article["cta"]["accroche"]
        yield article["cta"]["texte"]


def body(article):
    return " ".join(LINK.sub(r"\1", t) for t in fields(article))


def normalize(text):
    text = text.lower().replace("’", "'").replace("\u202f", " ").replace("\u00a0", " ")
    return re.sub(r"\s+", " ", text)


def number_key(value):
    return re.sub(r"\D", "", value)


def unverified_numbers(article, corpus):
    keys = {number_key(m) for m in NUMBER.findall(corpus)}
    missing = []
    for raw in NUMBER.findall(CVE.sub("", body(article))):
        key = number_key(raw)
        if len(key) >= 2 and key not in keys and raw.strip() not in missing:
            missing.append(raw.strip())
    return missing


def copied_passages(article, corpus, size=12):
    words = re.findall(r"\w+", normalize(corpus))
    shingles = {" ".join(words[i:i + size]) for i in range(len(words) - size + 1)}
    found = []
    for text in fields(article):
        tokens = re.findall(r"\w+", normalize(LINK.sub(r"\1", text)))
        for i in range(len(tokens) - size + 1):
            chunk = " ".join(tokens[i:i + size])
            if chunk in shingles:
                found.append(chunk)
                break
    return found


def validate(article, fmt, texts, slugs, week):
    errors = []
    if not SLUG.match(article["slug"]):
        errors.append("slug invalide : minuscules, chiffres et tirets, 3 à 12 mots")
    if not 30 <= len(article["title"]) <= 90:
        errors.append(f"title doit faire 30 à 90 caractères (actuellement {len(article['title'])})")
    if not 20 <= len(article["metaTitle"]) <= 60:
        errors.append(f"metaTitle doit faire 20 à 60 caractères (actuellement {len(article['metaTitle'])})")
    if not 110 <= len(article["description"]) <= 165:
        errors.append(f"description doit faire 110 à 165 caractères (actuellement {len(article['description'])})")
    if not 3 <= len(article["sections"]) <= 8 or any(not s["paragraphs"] for s in article["sections"]):
        errors.append("il faut 4 à 6 sections, chacune avec au moins un paragraphe")
    for section in article["sections"]:
        if section["heading"].strip().lower().rstrip(" :") in GENERIC_HEADINGS:
            errors.append(f"intertitre trop générique : « {section['heading']} », écris un intertitre informatif")
    words = len(body(article).split())
    if words < 750:
        errors.append(f"article trop court : {words} mots, il en faut au moins 900")
    text = normalize(body(article))
    for phrase in CONFIG["banned_phrases"]:
        if normalize(phrase) in text:
            errors.append(f"formule interdite par la charte : « {phrase} »")
    accroche, texte = article["cta"]["accroche"].strip(), article["cta"]["texte"].strip()
    if not 25 <= len(accroche) <= 80:
        errors.append(f"cta.accroche doit faire 35 à 70 caractères (actuellement {len(accroche)})")
    if not 80 <= len(texte) <= 300:
        errors.append(f"cta.texte doit faire 120 à 260 caractères (actuellement {len(texte)})")
    if LINK.search(texte):
        errors.append("cta.texte ne doit pas contenir de lien, le bouton vers les offres est ajouté automatiquement")
    if text.count("—") > 1:
        errors.append("remplace les tirets cadratins (—) par des virgules, deux-points ou parenthèses")
    if "!" in text:
        errors.append("supprime les points d'exclamation")
    if not article["sources"]:
        errors.append("au moins une source lue est obligatoire")
    sources = set()
    for source in article["sources"]:
        url = source["url"].rstrip("/")
        sources.add(url)
        if not url.startswith("https://"):
            errors.append(f"source non HTTPS : {url}")
        elif url not in texts:
            errors.append(f"source non lue avec web_fetch : {url}")
    corpus = "\n".join(texts.get(s, "") for s in sources)
    for cve in sorted({c.upper() for c in CVE.findall(body(article))}):
        if cve not in corpus.upper():
            errors.append(f"{cve} n'apparaît dans aucune source lue")
    for passage in copied_passages(article, corpus):
        errors.append(f"passage recopié d'une source, reformule : « {passage} »")
    allowed = set(CONFIG["internal_links"]) | {f"/blog/{s}" for s in slugs}
    internal = set()
    for item in fields(article):
        for _, href in LINK.findall(item):
            if href.startswith("/"):
                internal.add(href)
                if href not in allowed:
                    errors.append(f"lien interne non autorisé : {href}")
            elif href.rstrip("/") not in sources:
                errors.append(f"lien externe hors sources : {href}")
    if fmt == "recap":
        for post in week:
            if f"/blog/{post['slug']}" not in internal:
                errors.append(f"le récapitulatif doit faire un lien vers /blog/{post['slug']}")
    elif len(internal) > 4:
        errors.append(f"trop de liens internes : {len(internal)}, 3 au maximum")
    return errors, corpus


def review(client, tracker, article, texts, corpus):
    documents = "\n\n".join(f"<source url=\"{url}\">\n{data[:40000]}\n</source>" for url, data in texts.items() if url in {s["url"].rstrip("/") for s in article["sources"]})
    content = "\n\n".join([
        "Sources lues par le rédacteur :\n" + documents,
        "Chiffres non retrouvés tels quels dans les sources (vérifie-les un par un, ils peuvent être reformulés ou inventés) :\n" + as_json(unverified_numbers(article, corpus)),
        "Article à relire :\n" + as_json({k: article[k] for k in article if k not in ("status", "skipReason")}),
    ])
    return call(client, tracker, REVIEWER, [{"role": "user", "content": content}], REVIEW_SCHEMA, max_tokens=24000)


def accepted(verdict):
    blocking = any(p["gravite"] in ("bloquant", "important") for p in verdict["problemes"])
    return verdict["verdict"] == "publier" and not blocking and min(verdict["scores"].values()) >= 4


def produce(client, tracker, fmt, posts, items, log):
    slugs = {p["slug"] for p in posts}
    week = week_posts(posts)
    messages = [{"role": "user", "content": brief(fmt, posts, items)}]
    article = write(client, tracker, messages)
    for attempt in range(3):
        if article["status"] == "skip":
            raise Rejected(article["skipReason"])
        texts = source_texts(messages)
        errors, corpus = validate(article, fmt, texts, slugs, week)
        if errors:
            log.append(f"Contrôles automatiques, tour {attempt + 1} : " + " ; ".join(errors))
            feedback = "L'article ne respecte pas ces règles. Corrige-le et renvoie-le en entier au même format :\n- " + "\n- ".join(errors)
        else:
            verdict = review(client, tracker, article, texts, corpus)
            log.append(f"Relecture, tour {attempt + 1} : {verdict['verdict']} {verdict['scores']} {verdict['resume']}")
            if accepted(verdict):
                return article, verdict
            if verdict["verdict"] == "rejeter":
                raise Rejected("rejeté à la relecture : " + verdict["resume"])
            feedback = "Le rédacteur en chef demande ces corrections. Applique-les toutes, en t'appuyant uniquement sur les sources (relis-les ou cherches-en d'autres si besoin), et renvoie l'article en entier au même format :\n" + as_json(verdict["problemes"])
        if attempt == 2:
            break
        messages.append({"role": "user", "content": feedback})
        article = write(client, tracker, messages)
    raise Rejected("article toujours non conforme après trois tours de correction")


def typography(text):
    parts = re.split(r"(\]\([^)]*\))", text)
    for i in range(0, len(parts), 2):
        value = parts[i]
        value = re.sub(r"(?<=\w)'(?=\w)", "’", value)
        value = value.replace("...", "…")
        value = re.sub(r"(?<=\d)[ \u00a0](?=\d{3}\b)", "\u202f", value)
        value = re.sub(r"[ \u00a0]+([;:!?»%€])", "\u202f\\1", value)
        value = re.sub(r"«[ \u00a0]*", "«\u202f", value)
        value = re.sub(r"(?<=[^\s\u202f])»", "\u202f»", value)
        value = re.sub(r"(?<=[^\s\u202f(\[])([;!?])", "\u202f\\1", value)
        parts[i] = value
    return "".join(parts)


def finalize(article, fmt, verdict, posts):
    today = paris_now().date().isoformat()
    slugs = {p["slug"] for p in posts}
    slug = article["slug"]
    n = 2
    while slug in slugs:
        slug = f"{article['slug']}-{n}"
        n += 1
    category = {"guide": "Conseils pratiques", "recap": "Récap de la semaine"}.get(fmt, article["category"])
    guide = next_guide(posts) if fmt == "guide" else None
    return {
        "slug": slug,
        "format": fmt,
        "topicKey": guide["key"] if guide else None,
        "title": typography(article["title"].strip()),
        "metaTitle": typography(article["metaTitle"].strip()) + " | Veilix",
        "description": typography(article["description"].strip()),
        "published": today,
        "modified": today,
        "category": category,
        "tags": [t.strip().lower() for t in article["tags"] if t.strip()][:6],
        "lead": typography(article["lead"].strip()),
        "takeaways": [typography(t) for t in article["takeaways"]],
        "sections": [{"heading": typography(s["heading"]), "paragraphs": [typography(p) for p in s["paragraphs"]], "bullets": [typography(b) for b in s["bullets"]]} for s in article["sections"]],
        "faq": [{"q": typography(f["q"]), "a": typography(f["a"])} for f in article["faq"]],
        "sources": [{"title": s["title"].strip(), "url": s["url"].strip(), "publisher": s["publisher"].strip()} for s in article["sources"]],
        "cta": {"accroche": typography(article["cta"]["accroche"].strip().rstrip(".")), "texte": typography(article["cta"]["texte"].strip())},
        "quality": {"scores": verdict["scores"], "resume": verdict["resume"]},
    }


def output(name, value):
    path = os.environ.get("GITHUB_OUTPUT")
    if path:
        with open(path, "a") as f:
            f.write(f"{name}={value}\n")


def summary(lines):
    print("\n".join(lines))
    for path in (os.environ.get("GITHUB_STEP_SUMMARY"), os.environ.get("BLOG_RESUME")):
        if path:
            with open(path, "a") as f:
                f.write("\n\n".join(lines) + "\n")


def main():
    posts = load_posts()
    today = paris_now().date().isoformat()
    if any(p["published"] == today for p in posts) and os.environ.get("BLOG_FORCE") != "1":
        print("Un article a déjà été publié aujourd'hui")
        return
    items = candidates(posts)
    fmt = pick_format(posts)
    if fmt == "actu" and not items:
        fmt = "guide" if next_guide(posts) else ""
    if not fmt:
        print("::warning::Aucune actualité candidate et plus aucun guide à rédiger")
        return
    client = anthropic.Anthropic()
    tracker = Tracker()
    log = []
    started = time.time()
    attempts = [fmt] + (["guide"] if fmt == "actu" and next_guide(posts) else [])
    result = None
    for current in attempts:
        try:
            article, verdict = produce(client, tracker, current, posts, items, log)
            result = finalize(article, current, verdict, posts)
            break
        except Rejected as reason:
            log.append(f"Format {current} abandonné : {reason}")
    cost = f"Coût estimé : {tracker.cost():.2f} $ ({tracker.calls} appels, {tracker.input} jetons en entrée, {tracker.output} en sortie, {tracker.searches} recherches, {tracker.fetches} pages lues, {int(time.time() - started)} s)"
    if not result:
        summary(["## Aucun article publié", *log, cost])
        sys.exit(1)
    CONTENT.mkdir(parents=True, exist_ok=True)
    (CONTENT / f"{result['slug']}.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    scores = " · ".join(f"{k} {v}/5" for k, v in result["quality"]["scores"].items())
    summary([
        f"## {result['title']}",
        f"Format : {result['format']} · Catégorie : {result['category']} · https://veilix.fr/blog/{result['slug']}",
        f"Relecture : {scores}",
        result["quality"]["resume"],
        "Sources : " + ", ".join(s["url"] for s in result["sources"]),
        *log,
        cost,
    ])
    output("slug", result["slug"])
    output("title", result["title"].replace("\n", " "))


main()
