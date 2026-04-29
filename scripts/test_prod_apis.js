const http = require('http');

const BASE_URL = 'https://gestion-scolaire-livid.vercel.app';

async function fetchApi(endpoint, method = 'GET', body = null, token = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (token) {
    options.headers['Cookie'] = `refreshToken=${token}`;
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, options);
    let data = null;
    try {
      data = await res.json();
    } catch (e) {
      data = await res.text();
    }
    return { status: res.status, data };
  } catch (err) {
    return { status: 500, error: err.message };
  }
}

async function runTests() {
  console.log('🚀 Début des tests API en PRODUCTION...');
  console.log(`🌍 URL Cible: ${BASE_URL}`);

  // 1. Ping the frontend (landing page)
  console.log('\n🌐 Test: / (Landing Page)');
  const pingRes = await fetchApi('/', 'GET');
  console.log(`Status: ${pingRes.status}`);
  if (pingRes.status !== 200) {
     console.log('❌ L\'application semble indisponible ou en cours de déploiement.');
  } else {
     console.log('✅ Landing page chargée avec succès.');
  }

  // 2. Login
  console.log('\n🔑 Test: /api/auth/login');
  const loginRes = await fetchApi('/api/auth/login', 'POST', { email: 'admin@schoolerp.com', password: 'admin123' });
  console.log(`Status: ${loginRes.status}`);
  
  if (loginRes.status !== 200) {
    console.error('❌ Échec de connexion en production:', loginRes.data || loginRes.error);
    console.error('⚠️ Vérifiez que les variables d\'environnement (DATABASE_URL, DIRECT_URL, JWT_SECRET) sont bien configurées sur Vercel.');
    return;
  }
  
  const token = loginRes.data.accessToken || loginRes.data.token;
  console.log('✅ Login réussi en PROD, Token récupéré.');

  const endpointsToTest = [
    '/api/dashboard/stats',
    '/api/students',
    '/api/invoices',
    '/api/admin/schools'
  ];

  for (const endpoint of endpointsToTest) {
    console.log(`\n📡 Test PROD: ${endpoint}`);
    const res = await fetchApi(endpoint, 'GET', null, token);
    console.log(`Status: ${res.status}`);
    
    if (res.status === 200) {
      if (Array.isArray(res.data)) {
        console.log(`✅ Succès: Tableau reçu avec ${res.data.length} éléments.`);
      } else if (res.data && typeof res.data === 'object') {
        console.log(`✅ Succès: Objet reçu.`);
      } else {
        console.log(`✅ Succès: Données reçues.`);
      }
    } else {
      console.log(`❌ Échec:`, typeof res.data === 'string' ? res.data.substring(0, 100) + '...' : res.data || res.error);
    }
  }

  console.log('\n🎉 Tous les tests de PRODUCTION sont terminés.');
}

runTests();
