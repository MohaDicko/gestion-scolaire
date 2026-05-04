import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 DÉBUT DE LA VÉRIFICATION FINALE DES MODULES...');

  // 1. Test Cartes Scolaires
  const studentsWithPhotos = await prisma.student.count({ where: { photoUrl: { not: null } } });
  const totalStudents = await prisma.student.count();
  console.log(`🪪 Cartes Scolaires : ${studentsWithPhotos}/${totalStudents} élèves ont une photo d'identité configurée.`);

  // 2. Test Emplois du Temps
  const timetableEntries = await prisma.timetable.count();
  const classesWithTimetable = await prisma.classroom.count({
    where: { Timetable: { some: {} } }
  });
  console.log(`📅 Emplois du Temps : ${timetableEntries} créneaux générés pour ${classesWithTimetable} classes.`);

  // 3. Test Comptabilité
  const invoices = await prisma.invoice.aggregate({
    _sum: { amount: true },
    _count: true
  });
  const expenses = await prisma.expense.aggregate({
    _sum: { amount: true },
    _count: true
  });
  console.log(`💰 Comptabilité :`);
  console.log(`   - Factures : ${invoices._count} documents pour un total de ${invoices._sum.amount?.toLocaleString() || 0} XOF`);
  console.log(`   - Dépenses : ${expenses._count} documents pour un total de ${expenses._sum.amount?.toLocaleString() || 0} XOF`);

  if (totalStudents > 0 && timetableEntries > 0 && invoices._count > 0) {
    console.log('\n✅ TOUT EST OK : Les modules sont peuplés et prêts pour les tests de production !');
  } else {
    console.log('\n⚠️ ATTENTION : Certaines données manquent. Vérifiez le seeder.');
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
