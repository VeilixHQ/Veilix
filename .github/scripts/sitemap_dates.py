import hashlib
import json
import re
import sys
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[2]
FRONT = ROOT / "veilix-frontend"
SITEMAP = FRONT / "app" / "sitemap.ts"
STATE = ROOT / ".github" / "sitemap-hashes.json"
PAGES_TEXT = FRONT / "lib" / "translations-pages.ts"

SECTIONS = {
    "/pricing": "pricing",
    "/securite": "securite",
    "/confidentialite": "confidentialite",
    "/conditions-utilisation": "cgu",
    "/contact": "contact",
    "/faq": "faq",
    "/a-propos": "apropos",
}

HOME_SOURCES = [
    FRONT / "app" / "page.tsx",
    FRONT / "app" / "layout.tsx",
    FRONT / "lib" / "translations.ts",
    FRONT / "components" / "landing",
]


def files_of(path):
    if path.is_file():
        return [path]
    if path.is_dir():
        return sorted(p for p in path.rglob("*") if p.is_file())
    return []


def sections(text, key):
    lines = text.splitlines()
    out = []
    inside = False
    for line in lines:
        if re.match(rf"^    {re.escape(key)}: \{{", line):
            inside = True
        elif inside and re.match(r"^ {2,4}[A-Za-z]+: \{", line):
            inside = False
        if inside:
            out.append(line)
    return "\n".join(out)


def page_hash(path):
    digest = hashlib.sha256()
    sources = HOME_SOURCES if path == "" else [FRONT / "app" / path.lstrip("/")]
    for source in sources:
        for f in files_of(source):
            digest.update(str(f.relative_to(ROOT)).encode())
            digest.update(f.read_bytes())
    if path in SECTIONS:
        digest.update(sections(PAGES_TEXT.read_text(), SECTIONS[path]).encode())
    return digest.hexdigest()


def main():
    content = SITEMAP.read_text()
    pattern = re.compile(r"\{ path: '([^']*)', lastModified: '(\d{4}-\d{2}-\d{2})'")
    state = json.loads(STATE.read_text()) if STATE.exists() else None
    today = datetime.now(ZoneInfo("Europe/Paris")).date().isoformat()
    hashes = {}
    changed = []

    def replace(match):
        path, date = match.group(1), match.group(2)
        current = page_hash(path)
        hashes[path or "/"] = current
        if state is not None and state.get(path or "/") != current and date != today:
            changed.append(path or "/")
            return f"{{ path: '{path}', lastModified: '{today}'"
        return match.group(0)

    updated = pattern.sub(replace, content)
    if not hashes:
        sys.exit("Aucune page trouvée dans sitemap.ts")
    SITEMAP.write_text(updated)
    STATE.write_text(json.dumps(hashes, indent=2, sort_keys=True) + "\n")
    print("Pages modifiées : " + (", ".join(changed) if changed else "aucune"))


main()
