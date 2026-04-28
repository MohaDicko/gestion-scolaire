const http = require('http');

const BASE_URL = 'http://localhost:3000';

async function fetchApi(endpoint, method = 'GET', body = null, token = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (token) {
    options.headers['Cookie'] = `refreshToken=${token}`; // Assuming some auth relies on cookie or we pass Bearer
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await res.json().catch(() => null);
    return { status: res.status, data };
  } catch (err) {
    return { status: 500, error: err.message };
  }
}

async function runTests() {
  console.log('🚀 Début des tests API...');

  // 1. Login
  console.log('\n🔑 Test: /api/auth/login');
  const loginRes = await fetchApi('/api/auth/login', 'POST', { email: 'admin@schoolerp.com', password: 'admin123' });
  console.log(`Status: ${loginRes.status}`);
  if (loginRes.status !== 200) {
    console.error('Échec de connexion:', loginRes.data || loginRes.error);
    return;
  }
  const token = loginRes.data.accessToken;
  console.log('✅ Login réussi, Token récupéré.');

  const endpointsToTest = [
    '/api/dashboard/stats',
    '/api/students',
    '/api/employees',
    '/api/invoices',
    '/api/payslips',
    '/api/admin/schools'
  ];

  for (const endpoint of endpointsToTest) {
    console.log(`\n📡 Test: ${endpoint}`);
    const res = await fetchApi(endpoint, 'GET', null, token);
    console.log(`Status: ${res.status}`);
    
    if (res.status === 200) {
      if (Array.isArray(res.data)) {
        console.log(`✅ Succès: Tableau reçu avec ${res.data.length} éléments.`);
      } else if (res.data && typeof res.data === 'object') {
        console.log(`✅ Succès: Objet reçu avec les clés: ${Object.keys(res.data).join(', ')}`);
      } else {
        console.log(`✅ Succès: Données reçues.`);
      }
    } else {
      console.log(`❌ Échec:`, res.data || res.error);
    }
  }

  console.log('\n🎉 Tous les tests API sont terminés.');
}

runTests();
