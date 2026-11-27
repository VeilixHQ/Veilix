import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const guard = JSON.parse(readFileSync(new URL('./guard.json', import.meta.url), 'utf8'))
const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
const errors = []

execFileSync('git', ['add', '--intent-to-add', '--all'])
const files = git('diff', '--name-only', 'HEAD').split('\n').filter(Boolean)
if (files.length === 0) {
  console.log('AUCUN CHANGEMENT')
  process.exit(0)
}
if (files.length > guard.max_files) errors.push(`${files.length} fichiers modifiés (maximum ${guard.max_files})`)

for (const file of files) {
  if (guard.denied_paths.some(p => file.startsWith(p))) errors.push(`fichier interdit : ${file}`)
  else if (!guard.allowed_paths.some(p => file.startsWith(p))) errors.push(`fichier hors périmètre : ${file}`)
}

let changed = 0
for (const line of git('diff', '--numstat', 'HEAD').split('\n').filter(Boolean)) {
  const [added, removed] = line.split('\t')
  changed += (Number(added) || 0) + (Number(removed) || 0)
}
if (changed > guard.max_changed_lines) errors.push(`${changed} lignes modifiées (maximum ${guard.max_changed_lines})`)

const added = git('diff', '--unified=0', 'HEAD').split('\n').filter(l => l.startsWith('+') && !l.startsWith('+++')).join('\n')
for (const rule of guard.forbidden) {
  const match = added.match(new RegExp(rule.pattern, 'iu'))
  if (match) errors.push(`affirmation interdite ajoutée (${rule.id}) : « ${match[0]} »`)
}
for (const pattern of guard.signatures) {
  const match = added.match(new RegExp(pattern, 'iu'))
  if (match) errors.push(`signature interdite ajoutée : « ${match[0]} »`)
}

console.log(`Fichiers modifiés : ${files.length}, lignes : ${changed}`)
files.forEach(f => console.log(`  ${f}`))
errors.forEach(e => console.log(`ERREUR ${e}`))
console.log(errors.length ? 'ÉCHEC DU CONTRÔLE DE PÉRIMÈTRE' : 'PÉRIMÈTRE CONFORME')
process.exit(errors.length ? 1 : 0)
