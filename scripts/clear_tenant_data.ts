import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

// Charger l'environnement de production spécifiquement
dotenv.config({ path: '.env.production' });

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@cfppas-gao.ml';

  console.log(`\n🔍 Recherche du tenant pour l'administrateur : ${adminEmail}`);

  // 1. Trouver le User pour avoir le tenantId
  const user = await prisma.user.findUnique({
    where: { email: adminEmail },
    select: { tenantId: true, role: true }
  });

  if (!user || !user.tenantId) {
    console.error(`❌ Administrateur non trouvé ou aucun tenantId associé.`);
    process.exit(1);
  }

  const tenantId = user.tenantId;

  // Trouver l'école
  const school = await prisma.school.findUnique({
    where: { id: tenantId }
  });

  console.log(`🏫 École trouvée : ${school?.name} (ID: ${tenantId})`);
  console.log(`⚠️ ATTENTION : Suppression des données opérationnelles en cours...`);

  try {
    // Ordre de suppression pour respecter les contraintes de clés étrangères (FK)

    // 1. Logs et Communications
    console.log('Suppression des AuditLogs...');
    await prisma.auditLog.deleteMany({ where: { tenantId } });

    console.log('Suppression des Conversations et Messages...');
    const conversations = await prisma.conversation.findMany({ where: { tenantId }, select: { id: true } });
    const conversationIds = conversations.map(c => c.id);
    if (conversationIds.length > 0) {
      await prisma.message.deleteMany({ where: { conversationId: { in: conversationIds } } });
      await prisma.conversation.deleteMany({ where: { tenantId } });
    }

    // 2. Bibliothèque et Stock
    console.log('Suppression des Emprunts (Loans) et Livres (Books)...');
    await prisma.loan.deleteMany({ where: { tenantId } });
    await prisma.book.deleteMany({ where: { tenantId } });

    console.log('Suppression des Stocks...');
    await prisma.stockTransaction.deleteMany({ where: { tenantId } });
    await prisma.stockItem.deleteMany({ where: { tenantId } });

    // 3. Finances
    console.log('Suppression des Dépenses (Expenses)...');
    await prisma.expense.deleteMany({ where: { tenantId } });

    console.log('Suppression des Paiements et Factures...');
    await prisma.payment.deleteMany({ where: { tenantId } });
    await prisma.invoice.deleteMany({ where: { tenantId } });

    console.log('Suppression des Fiches de paie (Payslips)...');
    await prisma.payslip.deleteMany({ where: { tenantId } });

    // 4. Académique : Cours, Notes, Absences
    console.log('Suppression des Leçons (LessonLogs)...');
    await prisma.lessonLog.deleteMany({ where: { tenantId } });
    
    console.log('Suppression des Emplois du temps (Timetables)...');
    await prisma.timetable.deleteMany({ where: { tenantId } });

    console.log('Suppression des Absences (Attendance et StaffAttendance)...');
    await prisma.attendance.deleteMany({ where: { tenantId } });
    await prisma.staffAttendance.deleteMany({ where: { tenantId } });

    console.log('Suppression des Demandes de congés (LeaveRequests)...');
    await prisma.leaveRequest.deleteMany({ where: { tenantId } });

    console.log('Suppression des Notes (Grades)...');
    // Grade n'a pas de tenantId directement, on utilise studentId
    const students = await prisma.student.findMany({ where: { tenantId }, select: { id: true } });
    const studentIds = students.map(s => s.id);
    if (studentIds.length > 0) {
      await prisma.grade.deleteMany({ where: { studentId: { in: studentIds } } });
      
      // Inscriptions (Enrollments) - n'a pas de tenantId
      console.log('Suppression des Inscriptions (Enrollments)...');
      await prisma.enrollment.deleteMany({ where: { studentId: { in: studentIds } } });
    }

    // 5. Entités principales de niveau 2
    console.log('Suppression des Élèves (Students)...');
    await prisma.student.deleteMany({ where: { tenantId } });

    console.log('Suppression des Contrats et Employés...');
    await prisma.contract.deleteMany({ where: { tenantId } });
    await prisma.employee.deleteMany({ where: { tenantId } });

    console.log('Suppression des Classes, Matières, Départements...');
    await prisma.classroom.deleteMany({ where: { tenantId } });
    await prisma.subject.deleteMany({ where: { tenantId } });
    await prisma.department.deleteMany({ where: { tenantId } });

    // 6. Entités principales de niveau 1 (Optionnelles : on les garde généralement pour pouvoir se reconnecter)
    // await prisma.academicYear.deleteMany({ where: { tenantId } });
    // await prisma.campus.deleteMany({ where: { tenantId } });

    console.log(`\n✅ Nettoyage terminé avec succès pour ${school?.name} !`);
    console.log(`💡 Les comptes utilisateurs (admins, parents) et la fiche de l'école ont été conservés.`);
    
  } catch (error) {
    console.error('\n❌ Erreur lors du nettoyage :', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
