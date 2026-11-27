#!/usr/bin/env bash
set -uo pipefail

ROOT=$(git rev-parse --show-toplevel)
WORK="$ROOT/.agent-seo"
MAX_ATTEMPTS=${AGENT_MAX_ATTEMPTS:-3}
PORT=3123
mkdir -p "$WORK"
cd "$ROOT"

start_site() {
  (cd veilix-frontend && npx next start -p "$PORT" > "$WORK/next.log" 2>&1 &)
  for _ in $(seq 1 60); do
    curl -fsS "http://127.0.0.1:$PORT/sitemap.xml" > /dev/null 2>&1 && return 0
    sleep 1
  done
  return 1
}

stop_site() {
  pkill -f "next start -p $PORT" > /dev/null 2>&1 || true
  sleep 1
}

build_site() {
  (cd veilix-frontend && npm run build > "$WORK/build.log" 2>&1) || { tail -n 80 "$WORK/build.log"; return 1; }
}

verify() {
  echo "== Contrôle du périmètre"
  node .github/agent-seo/scope-check.mjs || return 1
  echo "== Lint"
  (cd veilix-frontend && npm run lint) || return 1
  echo "== Types"
  (cd veilix-frontend && npx tsc --noEmit) || return 1
  echo "== Compilation"
  build_site || return 1
  echo "== Contrôle SEO"
  start_site || { echo "Le site ne démarre pas"; tail -n 40 "$WORK/next.log"; return 1; }
  node .github/agent-seo/seo-check.mjs "http://127.0.0.1:$PORT" https://veilix.fr --baseline "$WORK/baseline.json"
  local rc=$?
  stop_site
  return $rc
}

echo "== État de départ"
(cd veilix-frontend && npm ci --no-audit --no-fund > "$WORK/npm.log" 2>&1) || { tail -n 40 "$WORK/npm.log"; exit 1; }
build_site || exit 1
start_site || exit 1
node .github/agent-seo/seo-check.mjs "http://127.0.0.1:$PORT" https://veilix.fr --write-baseline "$WORK/baseline.json" > "$WORK/audit.txt"
stop_site
cat "$WORK/audit.txt"

FEEDBACK=""
PASSED=0
for attempt in $(seq 1 "$MAX_ATTEMPTS"); do
  echo "== Passage $attempt / $MAX_ATTEMPTS"
  PROMPT="$(cat .github/agent-seo/prompt.md)"
  if [ -n "$FEEDBACK" ]; then
    PROMPT="$PROMPT

## Correction demandée
La vérification automatique a échoué. Corrige précisément ces erreurs sans annuler le travail utile :
$FEEDBACK"
  fi
  MODEL_ARGS=()
  [ -n "${AGENT_MODEL:-}" ] && MODEL_ARGS=(--model "$AGENT_MODEL")
  claude -p "$PROMPT" "${MODEL_ARGS[@]}" \
    --permission-mode acceptEdits \
    --allowedTools "Read" "Edit" "Write" "Glob" "Grep" "Bash(npm run lint:*)" "Bash(npx tsc:*)" "Bash(npm run build:*)" "Bash(cd veilix-frontend:*)" \
    --disallowedTools "Bash(git:*)" "WebFetch" \
    --max-turns "${AGENT_MAX_TURNS:-80}" > "$WORK/agent-$attempt.log" 2>&1
  tail -n 30 "$WORK/agent-$attempt.log"

  if node .github/agent-seo/scope-check.mjs | grep -q "AUCUN CHANGEMENT"; then
    echo "Aucune modification proposée"
    echo "none" > "$WORK/result"
    exit 0
  fi

  if verify > "$WORK/verify-$attempt.log" 2>&1; then
    cat "$WORK/verify-$attempt.log"
    PASSED=1
    break
  fi
  cat "$WORK/verify-$attempt.log"
  FEEDBACK="$(grep -E "ERREUR|error|Error|ÉCHEC|Type error|Failed" "$WORK/verify-$attempt.log" | head -n 60)"
  [ -z "$FEEDBACK" ] && FEEDBACK="$(tail -n 60 "$WORK/verify-$attempt.log")"
done

if [ "$PASSED" != 1 ]; then
  echo "Échec après $MAX_ATTEMPTS passages : modifications abandonnées"
  git checkout -- . && git clean -fdq -- veilix-frontend
  echo "failed" > "$WORK/result"
  exit 1
fi

TITLE="$(head -n 1 "$WORK/summary.md" 2>/dev/null | tr -d '\r' | cut -c1-90)"
[ -z "$TITLE" ] && TITLE="SEO : améliorations du référencement"
BODY="$(tail -n +2 "$WORK/summary.md" 2>/dev/null | head -n 40)"
if printf '%s\n%s' "$TITLE" "$BODY" | grep -qiE 'claude|anthropic|co-authored-by|généré par'; then
  TITLE="SEO : améliorations du référencement"
  BODY=""
fi
git add -A -- veilix-frontend
git -c user.name="VeilixHQ" -c user.email="${VEILIX_GIT_EMAIL}" commit -q -m "$TITLE" -m "$BODY"
echo "committed" > "$WORK/result"
git log -1 --format='%H %an | %s'
