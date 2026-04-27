const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function audit() {
  console.log('🔍 AUDIT SYSTÈME ET DONNÉES...');
  
  try {
    const schools = await prisma.school.count();
    console.log(`- Établissements : ${schools}`);

    const students = await prisma.student.count();
    console.log(`- Étudiants : ${students}`);

    const employees = await prisma.employee.count();
    console.log(`- Personnel : ${employees}`);

    // 1. Vérification des relations (Orphelins)
    const orphans = await prisma.student.count({
      where: { enrollments: { none: {} } }
    });
    console.log(`- Étudiants sans classe : ${orphans}`);

    // 2. Vérification des notes
    const grades = await prisma.grade.count();
    console.log(`- Total des notes saisies : ${grades}`);

    // 3. Vérification des factures
    const unpaid = await prisma.invoice.count({ where: { status: 'UNPAID' } });
    console.log(`- Factures impayées : ${unpaid}`);

    // 4. Vérification de la configuration Super Admin
    const superAdmin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
    console.log(`- Super Admin configuré : ${superAdmin ? 'OUI' : 'NON'}`);

    if (schools > 0 && students > 0 && superAdmin) {
      console.log('\n✅ ÉTAT : SYSTÈME PRÊT POUR LES TESTS UTILISATEUR.');
    } else {
      console.log('\n⚠️ ÉTAT : DES DONNÉES MANQUENT.');
    }
  } catch (e) {
    console.error('❌ Erreur lors de l\'audit:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

audit();
