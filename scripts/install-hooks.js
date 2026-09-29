#!/usr/bin/env node
/**
 * install-hooks.js
 * Installe les hooks Git pour le projet SchoolERP Pro.
 * Exécuter une fois après `git clone` : npm run install-hooks
 */

const fs   = require('fs');
const path = require('path');

const ROOT      = path.resolve(__dirname, '..');
const HOOKS_DIR = path.join(ROOT, '.git', 'hooks');
const HOOK_SRC  = path.join(ROOT, '.git', 'hooks', 'pre-push');

// Contenu du hook pre-push (écrase si déjà là)
const hookContent = `#!/bin/sh
# SchoolERP Pro — pre-push hook (généré par install-hooks.js)

ROOT_DIR=$(git rev-parse --show-toplevel)
SCRIPT="$ROOT_DIR/scripts/pre-push-check.ps1"

echo ""
echo "============================================================"
echo "  SchoolERP Pro — Verification avant push"
echo "============================================================"

if command -v pwsh > /dev/null 2>&1; then
  PWSH_CMD="pwsh"
elif command -v powershell > /dev/null 2>&1; then
  PWSH_CMD="powershell"
else
  echo "  ERREUR: PowerShell non trouve. Push annule."
  exit 1
fi

$PWSH_CMD -ExecutionPolicy Bypass -File "$SCRIPT"
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
  echo ""
  echo "  PUSH BLOQUE. Utilisez --no-verify pour ignorer (deconseille)."
  echo ""
  exit 1
fi
exit 0
`;

try {
  // Créer le dossier hooks si nécessaire
  if (!fs.existsSync(HOOKS_DIR)) {
    fs.mkdirSync(HOOKS_DIR, { recursive: true });
  }

  fs.writeFileSync(HOOK_SRC, hookContent, { mode: 0o755 });

  console.log('');
  console.log('  ✓  Hook pre-push installé avec succès !');
  console.log(`     Chemin : ${HOOK_SRC}`);
  console.log('');
  console.log('  Le hook s\'exécutera automatiquement avant chaque `git push`');
  console.log('  Pour tester manuellement : npm run pre-push');
  console.log('');
} catch (err) {
  console.error('  ✗  Erreur lors de l\'installation du hook :', err.message);
  process.exit(1);
}
