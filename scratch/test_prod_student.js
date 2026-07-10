async function run() {
  try {
    // 1. Login
    const loginRes = await fetch('https://gestion-scolaire-livid.vercel.app/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@schoolerp.com', password: 'admin123' })
    });
    
    if (!loginRes.ok) {
      console.error('Login failed', await loginRes.text());
      return;
    }
    
    // Extract cookies
    const cookieHeader = loginRes.headers.get('set-cookie');
    if (!cookieHeader) {
      console.error('No cookie returned');
      return;
    }
    
    // Extract the refreshToken
    const match = cookieHeader.match(/refreshToken=([^;]+)/);
    if (!match) {
      console.error('No refreshToken cookie found');
      return;
    }
    const token = match[1];
    const cookieString = `refreshToken=${token}`;

    // 2. Get Campuses
    const campRes = await fetch('https://gestion-scolaire-livid.vercel.app/api/campuses', {
      headers: { 'Cookie': cookieString }
    });
    if (!campRes.ok) {
      console.error('Failed to get campuses', await campRes.text());
      return;
    }
    const campuses = await campRes.json();
    if (campuses.length === 0) {
      console.error('No campuses found');
      return;
    }
    const campusId = campuses[0].id;

    // 3. Create Student
    const studentData = {
      firstName: 'Test',
      lastName: 'Student',
      dateOfBirth: '2010-01-01',
      gender: 'MALE',
      nationalId: '',
      parentName: 'Test Parent',
      parentPhone: '+223 70000000',
      parentEmail: '',
      parentRelationship: 'FATHER',
      campusId: campusId,
      createStudentAccount: true,
      studentEmail: '',
      studentPassword: '',
      createParentAccount: false,
      parentAccountPassword: ''
    };

    const studentRes = await fetch('https://gestion-scolaire-livid.vercel.app/api/students', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': cookieString
      },
      body: JSON.stringify(studentData)
    });

    const studentBody = await studentRes.text();
    console.log('Status:', studentRes.status);
    console.log('Response:', studentBody);

  } catch (error) {
    console.error('Error:', error);
  }
}

run();
