const fetch = require('node-fetch'); // Assuming it's available or I'll use native fetch in Node 18+

async function test() {
  const BASE_URL = 'http://localhost:3000';
  console.log('🧪 DÉMARRAGE DES TESTS FONCTIONNELS (API)...');

  try {
    // 1. LOGIN SUPER ADMIN
    console.log('\n🔐 Test Login Super Admin...');
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: 'super@schoolerp.com', password: 'superadmin123' }),
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!loginRes.ok) throw new Error('Login Super Admin échoué');
    const loginData = await loginRes.json();
    const token = loginData.accessToken;
    console.log('✅ Login Super Admin OK');

    // 2. FETCH SCHOOLS (Super Admin only)
    console.log('\n🏫 Test Récupération des Écoles...');
    const schoolsRes = await fetch(`${BASE_URL}/api/admin/schools`, {
      headers: { 'Cookie': `refreshToken=${loginRes.headers.get('set-cookie')?.split(';')[0].split('=')[1]}` }
    });
    // Wait, the API uses getSession() which looks for cookies.
    // My previous script might not have passed cookies correctly.
    // I'll use the refreshToken from set-cookie if available.
  } catch (e) {
    console.error('❌ Erreur:', e.message);
  }
}
// Actually, it's easier to use prisma directly to verify data consistency if the server isn't running.
// But the user asked for functional tests, which usually implies the app logic.
