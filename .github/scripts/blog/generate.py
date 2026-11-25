import calendar
import html
import json
import os
import re
import sys
import time
import unicodedata
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

import anthropic
import feedparser

ROOT = Path(__file__).resolve().parents[3]
CONTENT = ROOT / "veilix-frontend" / "content" / "blog"
CONFIG = json.loads(Path(__file__).with_name("sources.json").read_text())
MODEL = os.environ.get("BLOG_MODEL", "claude-opus-5-5")
USER_AGENT = "VeilixBlog/1.0 (+https://veilix.fr/blog)"
SLUG = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+){2,11}$")
LINK = re.compile(r"\[([^\]]+)\]\(([^)\s]+)\)")

SCHEMA = {
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
    },
    "required": ["status", "skipReason", "slug", "title", "metaTitle", "description", "category", "tags", "lead", "takeaways", "sections", "faq", "sources"],
    "additionalProperties": False,
}

SYSTEM = """Tu es le rédacteur du blog de Veilix (veilix.fr), un service français d'alias e-mail open source, hébergé en Europe, qui protège l'adresse e-mail personnelle de ses utilisateurs. Le blog publie chaque jour un article d'actualité cybersécurité pour le grand public francophone : fuites de données, phishing et arnaques, failles importantes, rançongiciels, vie privée, réglementation.

Ta mission : choisir UN sujet parmi les actualités candidates, lire les articles d'origine avec l'outil web_fetch, puis rédiger un article original en français.

Choix du sujet
- Privilégie ce qui concerne directement le grand public francophone : fuites touchant des adresses e-mail ou des données personnelles, campagnes de phishing, failles de services très utilisés, décisions de la CNIL ou de l'ANSSI.
- Écarte les sujets déjà traités récemment (liste fournie) et les sujets trop techniques ou sans enjeu concret pour un particulier.
- Si aucun sujet ne convient ou si aucune source ne peut être lue, réponds avec status "skip" et explique pourquoi dans skipReason, en laissant les autres champs vides.

Exactitude, règle absolue
- Lis au moins une source avec web_fetch avant d'écrire, idéalement deux sources indépendantes. N'écris jamais à partir du seul résumé RSS.
- Chaque fait, chiffre, date, nom d'entreprise ou de groupe criminel doit provenir des pages lues. N'invente rien. Si une information est incertaine, dis-le ou ne la mentionne pas.
- Attribue les informations (« selon BleepingComputer », « d'après le CERT-FR »). Emploie le conditionnel pour les revendications de pirates et les attributions non confirmées.
- N'accuse jamais une personne ou une entreprise au-delà de ce qu'affirment les sources.
- Ne donne aucun détail permettant de reproduire une attaque : l'angle est toujours défensif et pédagogique.

Rédaction
- Écris avec tes propres mots, sans recopier de phrases des sources. Apporte du contexte et des conseils concrets et actionnables.
- Ton clair, précis, sans sensationnalisme ni jargon inutile ; explique les termes techniques.
- Longueur totale : 800 à 1 200 mots. 4 à 6 sections, chacune avec 2 à 4 paragraphes ; bullets facultatives (liste vide sinon).
- title : 45 à 75 caractères, contient le mot-clé principal que chercherait un internaute.
- metaTitle : 60 caractères au maximum, sans le nom Veilix (il est ajouté automatiquement).
- description : 120 à 155 caractères, incitative, résume l'article.
- slug : minuscules sans accents, mots séparés par des tirets, 3 à 10 mots, sans date.
- lead : 2 ou 3 phrases qui donnent l'essentiel.
- takeaways : 3 ou 4 points clés courts.
- faq : 2 à 4 questions que se poserait un lecteur, réponses de 1 à 3 phrases.
- tags : 3 à 6 mots-clés en minuscules.
- sources : uniquement les pages réellement lues avec web_fetch, avec leur URL exacte.
- Mise en forme autorisée dans les textes : **gras** et liens [texte](url). Rien d'autre.
- Liens externes : uniquement vers les URL des sources.
- Liens internes : 1 à 3 liens maximum vers les pages Veilix listées ou vers d'anciens articles du blog, uniquement là où c'est naturel. Mentionne Veilix au plus deux fois dans le corps, honnêtement, sans exagérer ce que le service fait. Un encart Veilix est ajouté automatiquement en fin d'article : ne termine pas par un paragraphe commercial."""


def paris_now():
    return datetime.now(ZoneInfo("Europe/Paris"))


def clean(value, limit=600):
    text = html.unescape(re.sub(r"<[^>]+>", " ", value or ""))
    text = re.sub(r"\s+", " ", text).strip()
    return text[:limit]


def fetch_feed(feed, since):
    parsed = feedparser.parse(feed["url"], agent=USER_AGENT)
    items = []
    for entry in parsed.entries:
        stamp = entry.get("published_parsed") or entry.get("updated_parsed")
        if not stamp or not entry.get("link"):
            continue
        date = datetime.fromtimestamp(calendar.timegm(stamp), tz=timezone.utc)
        if date < since:
            continue
        items.append({
            "publisher": feed["name"],
            "title": clean(entry.get("title"), 200),
            "url": entry["link"],
            "date": date.isoformat(),
            "summary": clean(entry.get("summary")),
        })
    return items


def fetch_hibp(since):
    request = urllib.request.Request("https://haveibeenpwned.com/api/v3/breaches", headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=30) as response:
        breaches = json.load(response)
    items = []
    for breach in breaches:
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
    posts = [json.loads(p.read_text()) for p in CONTENT.glob("*.json")]
    return sorted(posts, key=lambda p: p["published"], reverse=True)


def candidates(posts):
    now = datetime.now(timezone.utc)
    used = {s["url"] for p in posts for s in p["sources"]}
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
        if key in used or key in seen:
            continue
        seen.add(key)
        unique.append(item)
    return unique[: CONFIG["max_candidates"]]


def brief(items, posts):
    recent = [{"slug": p["slug"], "title": p["title"], "date": p["published"]} for p in posts[:40]]
    return "\n\n".join([
        f"Date du jour : {paris_now().date().isoformat()}",
        "Actualités candidates (JSON) :\n" + json.dumps(items, ensure_ascii=False, indent=1),
        "Articles déjà publiés, à ne pas répéter, que tu peux lier avec /blog/<slug> (JSON) :\n" + json.dumps(recent, ensure_ascii=False, indent=1),
        "Pages Veilix que tu peux lier (JSON) :\n" + json.dumps(CONFIG["internal_links"], ensure_ascii=False, indent=1),
        "Choisis le sujet, lis les sources avec web_fetch, puis rends l'article au format demandé.",
    ])


def run(client, messages):
    for _ in range(6):
        with client.beta.messages.stream(
            model=MODEL,
            max_tokens=48000,
            betas=["server-side-fallback-2026-07-01"],
            fallbacks="default",
            thinking={"type": "adaptive"},
            output_config={"effort": "high", "format": {"type": "json_schema", "schema": SCHEMA}},
            system=SYSTEM,
            tools=[{"type": "web_fetch_20260209", "name": "web_fetch", "max_uses": 6, "max_content_tokens": 15000}],
            messages=messages,
        ) as stream:
            response = stream.get_final_message()
        messages.append({"role": "assistant", "content": response.content})
        if response.stop_reason != "pause_turn":
            return response
    raise RuntimeError("Trop de reprises de la génération")


def fetched_urls(messages):
    urls = set()
    for message in messages:
        if message["role"] != "assistant":
            continue
        calls = {}
        for block in message["content"]:
            if block.type == "server_tool_use" and block.name == "web_fetch":
                calls[block.id] = block.input.get("url")
            elif block.type == "web_fetch_tool_result" and getattr(block.content, "type", "") == "web_fetch_result":
                urls.add(block.content.url)
                if calls.get(block.tool_use_id):
                    urls.add(calls[block.tool_use_id])
    return {u.rstrip("/") for u in urls if u}


def texts(article):
    yield article["lead"]
    yield from article["takeaways"]
    for section in article["sections"]:
        yield from section["paragraphs"]
        yield from section["bullets"]
    for item in article["faq"]:
        yield item["a"]


def validate(article, read, slugs):
    errors = []
    if not SLUG.match(article["slug"]):
        errors.append("slug invalide : minuscules, chiffres et tirets, 3 à 12 mots")
    if not 30 <= len(article["title"]) <= 90:
        errors.append(f"title doit faire 30 à 90 caractères (actuellement {len(article['title'])})")
    if not 20 <= len(article["metaTitle"]) <= 60:
        errors.append(f"metaTitle doit faire 20 à 60 caractères (actuellement {len(article['metaTitle'])})")
    if not 110 <= len(article["description"]) <= 165:
        errors.append(f"description doit faire 110 à 165 caractères (actuellement {len(article['description'])})")
    if not 3 <= len(article["sections"]) <= 7 or any(not s["paragraphs"] for s in article["sections"]):
        errors.append("il faut 3 à 7 sections, chacune avec au moins un paragraphe")
    words = len(" ".join(texts(article)).split())
    if words < 600:
        errors.append(f"article trop court : {words} mots, il en faut au moins 800")
    if not article["sources"]:
        errors.append("au moins une source est obligatoire")
    sources = set()
    for source in article["sources"]:
        url = source["url"].rstrip("/")
        sources.add(url)
        if not url.startswith("https://"):
            errors.append(f"source non HTTPS : {url}")
        elif url not in read:
            errors.append(f"source non lue avec web_fetch : {url}")
    allowed = set(CONFIG["internal_links"]) | {f"/blog/{s}" for s in slugs}
    internal = 0
    for text in texts(article):
        for _, href in LINK.findall(text):
            if href.startswith("/"):
                internal += 1
                if href not in allowed:
                    errors.append(f"lien interne non autorisé : {href}")
            elif href.rstrip("/") not in sources:
                errors.append(f"lien externe hors sources : {href}")
    if internal > 4:
        errors.append(f"trop de liens internes : {internal}, 3 au maximum")
    return errors


def finalize(article, slugs):
    today = paris_now().date().isoformat()
    slug = article["slug"]
    n = 2
    while slug in slugs:
        slug = f"{article['slug']}-{n}"
        n += 1
    meta = article["metaTitle"].strip()
    return {
        "slug": slug,
        "title": article["title"].strip(),
        "metaTitle": f"{meta} | Veilix",
        "description": article["description"].strip(),
        "published": today,
        "modified": today,
        "category": article["category"],
        "tags": [t.strip().lower() for t in article["tags"] if t.strip()][:6],
        "lead": article["lead"].strip(),
        "sections": article["sections"],
        "takeaways": article["takeaways"],
        "faq": article["faq"],
        "sources": [{**s, "url": s["url"].strip()} for s in article["sources"]],
    }


def output(name, value):
    path = os.environ.get("GITHUB_OUTPUT")
    if path:
        with open(path, "a") as f:
            f.write(f"{name}={value}\n")


def parse(response):
    if response.stop_reason == "refusal":
        category = response.stop_details.category if response.stop_details else None
        raise LookupError(f"génération refusée par le modèle (catégorie : {category})")
    if response.stop_reason == "max_tokens":
        raise RuntimeError("réponse tronquée (max_tokens)")
    text = [b.text for b in response.content if b.type == "text"]
    if not text:
        raise RuntimeError("aucun texte dans la réponse")
    return json.loads(text[-1])


def main():
    posts = load_posts()
    today = paris_now().date().isoformat()
    if any(p["published"] == today for p in posts) and os.environ.get("BLOG_FORCE") != "1":
        print("Un article a déjà été publié aujourd'hui")
        output("slug", "")
        return
    items = candidates(posts)
    if not items:
        print("::warning::Aucune actualité candidate, pas d'article aujourd'hui")
        output("slug", "")
        return
    slugs = {p["slug"] for p in posts}
    client = anthropic.Anthropic()
    messages = [{"role": "user", "content": brief(items, posts)}]
    started = time.time()
    try:
        article = parse(run(client, messages))
        if article["status"] == "skip":
            print(f"::warning::Pas d'article aujourd'hui : {article['skipReason']}")
            output("slug", "")
            return
        errors = validate(article, fetched_urls(messages), slugs)
        if errors:
            print("Corrections demandées : " + " ; ".join(errors))
            messages.append({"role": "user", "content": "L'article ne respecte pas ces règles, corrige-le et renvoie-le en entier au même format :\n- " + "\n- ".join(errors)})
            article = parse(run(client, messages))
            errors = validate(article, fetched_urls(messages), slugs) if article["status"] == "ok" else ["sujet abandonné : " + article["skipReason"]]
        if errors:
            sys.exit("Article rejeté : " + " ; ".join(errors))
    except LookupError as error:
        print(f"::warning::Pas d'article aujourd'hui : {error}")
        output("slug", "")
        return
    final = finalize(article, slugs)
    CONTENT.mkdir(parents=True, exist_ok=True)
    (CONTENT / f"{final['slug']}.json").write_text(json.dumps(final, ensure_ascii=False, indent=2) + "\n")
    print(f"Article créé en {int(time.time() - started)} s : {final['title']} ({final['slug']})")
    output("slug", final["slug"])
    output("title", final["title"].replace("\n", " "))


main()
