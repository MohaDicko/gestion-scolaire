#!/usr/bin/env pwsh
# ============================================================
# SchoolERP Pro — Script de vérification avant push GitHub
# Exécuté automatiquement via le hook Git pre-push
# ============================================================

$ErrorActionPreference = "Stop"
$rootDir = Split-Path -Parent $PSScriptRoot

# ── Couleurs console ────────────────────────────────────────
function Write-Step  { param($msg) Write-Host "`n▶  $msg" -ForegroundColor Cyan }
function Write-Ok    { param($msg) Write-Host "  ✓  $msg" -ForegroundColor Green }
function Write-Fail  { param($msg) Write-Host "  ✗  $msg" -ForegroundColor Red }
function Write-Warn  { param($msg) Write-Host "  ⚠  $msg" -ForegroundColor Yellow }
function Write-Banner { param($msg) Write-Host "`n$('─' * 60)`n  $msg`n$('─' * 60)" -ForegroundColor Magenta }

# ── Chrono ──────────────────────────────────────────────────
$globalStart = Get-Date
$failed      = @()
$passed      = @()

function Run-Check {
  param(
    [string]$Name,
    [scriptblock]$Block,
    [bool]$Required = $true
  )
  Write-Step $Name
  $start = Get-Date
  try {
    & $Block
    $elapsed = [math]::Round(((Get-Date) - $start).TotalSeconds, 1)
    Write-Ok "$Name — OK (${elapsed}s)"
    $script:passed += $Name
  } catch {
    $elapsed = [math]::Round(((Get-Date) - $start).TotalSeconds, 1)
    Write-Fail "$Name — ECHOUE (${elapsed}s)"
    Write-Host "  Detail : $_" -ForegroundColor DarkRed
    $script:failed += $Name
    if ($Required) {
      Write-Banner "PUSH BLOQUE — Corrigez les erreurs ci-dessus avant de pusher"
      exit 1
    }
  }
}

# ════════════════════════════════════════════════════════════
Write-Banner "SchoolERP Pro — Verifications pre-push"
Set-Location $rootDir

# ── 1. Vérification TypeScript ───────────────────────────────
Run-Check "TypeScript — Verification des types" {
  $out = npx tsc --noEmit 2>&1
  if ($LASTEXITCODE -ne 0) { throw $out }
} -Required $true

# ── 2. Linter ESLint ─────────────────────────────────────────
Run-Check "ESLint — Qualite du code" {
  $out = npm run lint 2>&1
  if ($LASTEXITCODE -ne 0) { throw $out }
} -Required $true

# ── 3. Tests unitaires Vitest ────────────────────────────────
Run-Check "Vitest — Tests unitaires et integration" {
  $out = npm run test 2>&1
  if ($LASTEXITCODE -ne 0) { throw $out }
} -Required $true

# ── 4. Prisma generate ───────────────────────────────────────
Run-Check "Prisma — Generation du client" {
  $out = npx prisma generate 2>&1
  if ($LASTEXITCODE -ne 0) { throw $out }
} -Required $true

# ── 5. Vérification des fichiers sensibles ───────────────────
Run-Check "Securite — Secrets exposes dans le code" {
  $patterns = @('sk_live_', 'PRIVATE_KEY\s*=\s*[^$]')
  $srcFiles = Get-ChildItem "$rootDir/src" -Recurse -Include "*.ts","*.tsx" | Where-Object { $_.Name -notmatch "\.test\." }
  foreach ($file in $srcFiles) {
    $content = Get-Content $file.FullName -Raw
    foreach ($pat in $patterns) {
      if ($content -match $pat) {
        Write-Warn "Possible secret dans : $($file.Name)"
      }
    }
  }
} -Required $false

# ── 6. Vérifier que .env n'est pas stagé ─────────────────────
Run-Check "Git — Fichiers .env non commites" {
  $staged = git diff --cached --name-only 2>&1
  if ($staged -match "\.env$|\.env\.local|\.env\.production") {
    throw "Un fichier .env est stage pour le commit ! Retirez-le avec : git reset HEAD <fichier>"
  }
} -Required $true

# ════════════════════════════════════════════════════════════
$totalTime = [math]::Round(((Get-Date) - $globalStart).TotalSeconds, 1)

Write-Host "`n$('=' * 60)" -ForegroundColor Magenta
Write-Host "  Resume des verifications (${totalTime}s total)" -ForegroundColor Magenta
Write-Host $('=' * 60) -ForegroundColor Magenta

foreach ($p in $passed) { Write-Host "  PASS  $p" -ForegroundColor Green }
foreach ($f in $failed) { Write-Host "  FAIL  $f" -ForegroundColor Red }

if ($failed.Count -eq 0) {
  Write-Host "`n  Toutes les verifications passees — Push autorise !" -ForegroundColor Green
} else {
  Write-Host "`n  $($failed.Count) verification(s) non bloquante(s) ont echoue" -ForegroundColor Yellow
}

Write-Host $('=' * 60) -ForegroundColor Magenta
exit 0
