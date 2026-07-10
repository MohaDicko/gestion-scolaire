async function run() {
  try {
    // 1. Login
    const loginRes = await fetch('https://gestion-scolaire-livid.vercel.app/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'superadmin@schoolerp.com', password: 'admin123' })
    });
    
    // Extract cookies
    const cookieHeader = loginRes.headers.get('set-cookie');
    const match = cookieHeader.match(/refreshToken=([^;]+)/);
    const token = match[1];
    const cookieString = `refreshToken=${token}`;

    // 2. Get Campuses
    const campRes = await fetch('https://gestion-scolaire-livid.vercel.app/api/campuses', {
      headers: { 'Cookie': cookieString }
    });
    console.log('Campuses Status:', campRes.status);
    console.log('Campuses Response:', await campRes.text());

  } catch (error) {
    console.error('Error:', error);
  }
}

run();
