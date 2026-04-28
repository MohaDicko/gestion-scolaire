const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['error'],
});

async function testConnection() {
  console.log('🔌 Test de connexion Supabase...');
  console.log('📍 URL:', process.env.DATABASE_URL?.replace(/:([^:@]+)@/, ':***@'));
  
  try {
    // Test 1: Ping simple
    const ping = await prisma.$queryRawUnsafe('SELECT 1 as ok');
    console.log('✅ Connexion DB: OK', ping);

    // Test 2: Utilisateurs
    const users = await prisma.user.findMany({
      select: { email: true, role: true, isActive: true }
    });
    console.log(`\n👥 Utilisateurs (${users.length}):`);
    users.forEach(u => console.log(`  - ${u.email} [${u.role}] actif=${u.isActive}`));

    // Test 3: Écoles
    const schools = await prisma.school.findMany({
      select: { name: true, code: true, isActive: true }
    });
    console.log(`\n🏫 Établissements (${schools.length}):`);
    schools.forEach(s => console.log(`  - ${s.name} (${s.code})`));

    // Test 4: Étudiants
    const studentCount = await prisma.student.count();
    console.log(`\n🎓 Élèves: ${studentCount}`);

    // Test 5: Employés
    const empCount = await prisma.employee.count();
    console.log(`👷 Employés: ${empCount}`);

    console.log('\n✅ TOUT EST OK — Base de données opérationnelle !');

  } catch (error) {
    console.error('\n❌ ERREUR DE CONNEXION:');
    console.error('  Message:', error.message);
    console.error('  Code:', error.code);
    
    if (error.message.includes("Can't reach database")) {
      console.error('\n💡 DIAGNOSTIC: Le serveur Supabase est inaccessible.');
      console.error('   → Vérifiez que le projet Supabase est actif (pas en pause)');
      console.error('   → URL actuelle:', process.env.DATABASE_URL?.split('@')[1]?.split('/')[0]);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
