import { SignJWT } from 'jose';

// Configuration
const API_URL = 'http://localhost:3000/api';
const JWT_SECRET = 'SchoolERP_Prod_Secure_Key_Replace_This_Immediately_With_Long_Random_String!';
const TENANT_ID = 'b24ccc85-6423-4cde-97de-b91e2a5fec34';
const CAMPUS_ID = '08643ff1-2b92-4ee7-8047-c26b05a0551b';

async function runBenchmark() {
  console.log("📊 Lancement du Stress Test de Production (1000 inscriptions)...");
  
  const secret = new TextEncoder().encode(JWT_SECRET);
  const token = await new SignJWT({ id: 'bench-bot', role: 'admin', tenantId: TENANT_ID })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1h')
    .sign(secret);

  const start = Date.now();
  let success = 0;
  let errors = 0;
  let latencies = [];

  // Batch of 50 to avoid local port exhaustion or node limits if any
  for (let batch = 0; batch < 20; batch++) {
    const promises = Array.from({ length: 50 }).map(async (_, i) => {
      const idx = batch * 50 + i;
      const pStart = Date.now();
      try {
        const res = await fetch(`${API_URL}/students`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Cookie': `refreshToken=${token}`
          },
          body: JSON.stringify({
            firstName: 'Stress',
            lastName: `Student-${idx}`,
            dateOfBirth: '2015-05-15',
            gender: 'FEMALE',
            nationalId: `STRESS-ID-${Date.now()}-${idx}`,
            parentName: 'Automation Tool',
            parentPhone: '+223 99999999',
            parentRelationship: 'OTHER',
            campusId: CAMPUS_ID
          })
        });
        
        const latency = Date.now() - pStart;
        latencies.push(latency);
        
        if (res.status === 201) success++;
        else {
           // console.log(`Error ${res.status}:`, await res.text());
           errors++;
        }
      } catch (e) {
        errors++;
      }
    });

    await Promise.all(promises);
    process.stdout.write("█"); // 50 requests
  }

  const totalTime = (Date.now() - start) / 1000;
  const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  
  console.log(`\n\n🎯 RÉSULTATS DU BENCHMARK (Stress Test 1000) :`);
  console.log(`- Inscriptions réussies : ${success}`);
  console.log(`- Échecs/Errors         : ${errors}`);
  console.log(`- Temps total          : ${totalTime.toFixed(2)}s`);
  console.log(`- Latence moyenne      : ${avg.toFixed(0)}ms`);
  console.log(`- Taux de traitement    : ${(success / totalTime).toFixed(1)} inscriptions/sec`);
  
  if (errors > 0) {
    console.log("⚠️ Attention: Des erreurs ont été détectées. Vérifiez les limites du pool de connexion.");
  } else {
    console.log("✅ L'infrastructure a encaissé la charge sans aucune erreur !");
  }
}

runBenchmark();
