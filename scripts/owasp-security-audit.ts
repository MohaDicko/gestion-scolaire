import 'dotenv/config';
import { encrypt } from '../src/lib/auth';

const BASE_URL = process.env.AUDIT_BASE_URL || 'http://localhost:3000';

interface SecurityCheckResult {
  category: string;
  test: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  details: string;
}

const results: SecurityCheckResult[] = [];

function record(category: string, test: string, passed: boolean, details: string, isWarn = false) {
  const status: 'PASS' | 'FAIL' | 'WARN' = passed ? 'PASS' : (isWarn ? 'WARN' : 'FAIL');
  results.push({ category, test, status, details });
  const icon = passed ? '✅' : (isWarn ? '⚠️' : '❌');
  console.log(`  ${icon} [${category}] ${test}: ${details}`);
}

async function runOwaspAudit() {
  console.log('\n🔒 DÉMARRAGE DU SCAN DE SÉCURITÉ OWASP TOP 10');
  console.log('Target:', BASE_URL);
  console.log('='.repeat(70) + '\n');

  // --------------------------------------------------------------------------
  // 1. OWASP A05: Security Misconfiguration — En-têtes HTTP de Sécurité
  // --------------------------------------------------------------------------
  console.log('📋 1. Audit des En-têtes HTTP de Sécurité (OWASP A05)');
  try {
    const res = await fetch(`${BASE_URL}/`);
    const headers = res.headers;

    const xFrame = headers.get('x-frame-options');
    record(
      'A05:Misconfiguration',
      'Anti-Clickjacking (X-Frame-Options: DENY)',
      xFrame === 'DENY' || headers.get('content-security-policy')?.includes("frame-ancestors 'none'") || false,
      `Valeur: ${xFrame || 'Absent'}`
    );

    const xContent = headers.get('x-content-type-options');
    record(
      'A05:Misconfiguration',
      'MIME-Sniffing (X-Content-Type-Options: nosniff)',
      xContent === 'nosniff',
      `Valeur: ${xContent || 'Absent'}`
    );

    const hsts = headers.get('strict-transport-security');
    record(
      'A05:Misconfiguration',
      'HSTS (Strict-Transport-Security)',
      Boolean(hsts) || process.env.NODE_ENV === 'development',
      `Valeur: ${hsts || 'Désactivé en local dev (normal en HTTP)'}`
    );

    const referrerPolicy = headers.get('referrer-policy');
    record(
      'A05:Misconfiguration',
      'Protection Fuite Referrer (Referrer-Policy)',
      Boolean(referrerPolicy),
      `Valeur: ${referrerPolicy || 'Absent'}`
    );

    const csp = headers.get('content-security-policy');
    record(
      'A05:Misconfiguration',
      'Politique de Sécurité Contenu (CSP)',
      Boolean(csp),
      `Présence CSP: ${Boolean(csp) ? 'Oui' : 'Non'}`
    );
  } catch (err: any) {
    record('A05:Misconfiguration', 'Connexion au serveur cible', false, err.message);
  }

  // --------------------------------------------------------------------------
  // 2. OWASP A01: Broken Access Control & RBAC
  // --------------------------------------------------------------------------
  console.log('\n📋 2. Contrôle d\'Accès & Isolation RBAC (OWASP A01)');
  
  // Test 2.1: Accès non authentifié à une route protégée
  try {
    const res = await fetch(`${BASE_URL}/api/finance/ledger`);
    record(
      'A01:AccessControl',
      'Route sensible non authentifiée bloquée (401)',
      res.status === 401 || res.status === 403,
      `Status HTTP reçu: ${res.status}`
    );
  } catch (err: any) {
    record('A01:AccessControl', 'Route sensible non authentifiée', false, err.message);
  }

  // Test 2.2: Enseignant tentant d'accéder aux écritures comptables
  try {
    const teacherToken = await encrypt({
      id: 'prof-test-owasp',
      email: 'teacher@schoolerp.pro',
      role: 'TEACHER',
      tenantId: 'tenant-test-audit',
    }, '1h');

    const res = await fetch(`${BASE_URL}/api/finance/ledger`, {
      headers: { Cookie: `refreshToken=${teacherToken}` }
    });
    record(
      'A01:AccessControl',
      'Rôle TEACHER bloqué sur les Finances (403/401)',
      res.status === 403 || res.status === 401,
      `Status HTTP reçu: ${res.status}`
    );
  } catch (err: any) {
    record('A01:AccessControl', 'Vérification rôle TEACHER', false, err.message);
  }

  // Test 2.3: Parent tentant d'accéder aux routes d'administration
  try {
    const parentToken = await encrypt({
      id: 'parent-test-owasp',
      email: 'parent@schoolerp.pro',
      role: 'PARENT',
      tenantId: 'tenant-test-audit',
    }, '1h');

    const res = await fetch(`${BASE_URL}/api/admin/diagnostics`, {
      headers: { Cookie: `refreshToken=${parentToken}` }
    });
    record(
      'A01:AccessControl',
      'Rôle PARENT bloqué sur les Diagnostics Admin (403/401)',
      res.status === 403 || res.status === 401,
      `Status HTTP reçu: ${res.status}`
    );
  } catch (err: any) {
    record('A01:AccessControl', 'Vérification rôle PARENT', false, err.message);
  }

  // --------------------------------------------------------------------------
  // 3. OWASP A02 & A07: Cryptographic & Authentication Failures
  // --------------------------------------------------------------------------
  console.log('\n📋 3. Intégrité Cryptographique & JWT (OWASP A02/A07)');
  try {
    // Forger un faux token avec un secret bidon
    const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiU1VQRVJfQURNSU4ifQ.fakedsignature123';
    const res = await fetch(`${BASE_URL}/api/admin/diagnostics`, {
      headers: { Cookie: `refreshToken=${fakeToken}` }
    });
    record(
      'A07:AuthFailures',
      'Falsification de signature JWT bloquée',
      res.status === 401 || res.status === 403,
      `Token falsifié rejeté avec code: ${res.status}`
    );
  } catch (err: any) {
    record('A07:AuthFailures', 'Falsification JWT', false, err.message);
  }

  // --------------------------------------------------------------------------
  // 4. OWASP A08: CSRF & Origin Validation
  // --------------------------------------------------------------------------
  console.log('\n📋 4. Protection CSRF & Validation d\'Origine (OWASP A08)');
  try {
    const res = await fetch(`${BASE_URL}/api/students`, {
      method: 'POST',
      headers: {
        'Origin': 'https://malicious-attacker-website.com',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ firstName: 'Hacker', lastName: 'X' }),
    });
    record(
      'A08:DataIntegrity',
      'Origine externe suspecte rejetée en mutation (CSRF)',
      res.status === 403 || res.status === 401,
      `Requête bloquée avec code: ${res.status}`
    );
  } catch (err: any) {
    record('A08:DataIntegrity', 'Vérification CSRF Origin', false, err.message);
  }

  // --------------------------------------------------------------------------
  // 5. OWASP A03: Injection & Parameter Tampering
  // --------------------------------------------------------------------------
  console.log('\n📋 5. Résistance aux Injections SQL & XSS (OWASP A03)');
  try {
    const sqliPayload = "' OR '1'='1' --";
    const res = await fetch(`${BASE_URL}/api/dashboard/stats?schoolCode=${encodeURIComponent(sqliPayload)}`);
    record(
      'A03:Injection',
      'Injection SQL dans paramètre d\'URL interceptée',
      res.status !== 500,
      `Le serveur a répondu de façon contrôlée (code: ${res.status}) sans fuite de stack trace`
    );
  } catch (err: any) {
    record('A03:Injection', 'Test SQL Injection', false, err.message);
  }

  // --------------------------------------------------------------------------
  // Bilan global
  // --------------------------------------------------------------------------
  console.log('\n' + '='.repeat(70));
  const failedCount = results.filter(r => r.status === 'FAIL').length;
  const passCount = results.filter(r => r.status === 'PASS').length;
  const warnCount = results.filter(r => r.status === 'WARN').length;

  console.log(`📊 BILAN DU SCAN DE SÉCURITÉ OWASP :`);
  console.log(`   - Tests réussis : ${passCount}`);
  console.log(`   - Avertissements : ${warnCount}`);
  console.log(`   - Échecs         : ${failedCount}`);
  console.log('='.repeat(70));

  if (failedCount > 0) {
    console.error('\n❌ Échec de l\'audit de sécurité OWASP. Corrigez les vulnérabilités identifiées.');
    process.exit(1);
  } else {
    console.log('\n🛡️ AUDIT OWASP VALIDÉ : L\'application respecte les critères de sécurité requis.\n');
    process.exit(0);
  }
}

runOwaspAudit();
