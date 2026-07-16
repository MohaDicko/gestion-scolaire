import { PrismaClient, Gender, EmployeeType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const code = 'CFPPAS';
    
    // 1. Get the school
    const school = await prisma.school.findUnique({ where: { code } });
    if (!school) {
      console.log("L'école CFPPAS est introuvable. Veuillez d'abord la créer.");
      return;
    }

    // 2. Get the Campus
    const campus = await prisma.campus.findFirst({ where: { tenantId: school.id } });
    if (!campus) {
      console.log("Le campus est introuvable.");
      return;
    }

    console.log("Génération des données HR et Finance pour le CFPPAS...");

    // 3. Departments
    const deptAdmin = await prisma.department.create({
      data: { tenantId: school.id, name: 'Administration', code: 'ADM' }
    });
    const deptPedago = await prisma.department.create({
      data: { tenantId: school.id, name: 'Pédagogie', code: 'PED' }
    });

    // 4. Employees
    const emp1 = await prisma.employee.create({
      data: {
        tenantId: school.id,
        campusId: campus.id,
        departmentId: deptAdmin.id,
        employeeNumber: `EMP-${new Date().getFullYear()}-001`,
        firstName: 'Salif',
        lastName: 'Maïga',
        email: 'salif.maiga@cfppas-gao.ml',
        phoneNumber: '70002001',
        dateOfBirth: new Date(1980, 2, 10),
        gender: Gender.MALE,
        hireDate: new Date(2023, 8, 1),
        employeeType: EmployeeType.DIRECTOR,
        isActive: true
      }
    });

    const emp2 = await prisma.employee.create({
      data: {
        tenantId: school.id,
        campusId: campus.id,
        departmentId: deptPedago.id,
        employeeNumber: `EMP-${new Date().getFullYear()}-002`,
        firstName: 'Fatim',
        lastName: 'Traoré',
        email: 'fatim.traore@cfppas-gao.ml',
        phoneNumber: '70002002',
        dateOfBirth: new Date(1985, 6, 15),
        gender: Gender.FEMALE,
        hireDate: new Date(2023, 8, 1),
        employeeType: EmployeeType.TEACHER,
        isActive: true
      }
    });

    console.log("✅ Employés créés (Directeur, Professeur).");

    // 5. Expenses
    await prisma.expense.createMany({
      data: [
        { tenantId: school.id, description: 'Facture Électricité EDM', amount: 85000, category: 'Services Publics', status: 'PAID' },
        { tenantId: school.id, description: 'Achat de fournitures (Craies, stylos)', amount: 150000, category: 'Matériel', status: 'PAID' },
        { tenantId: school.id, description: 'Abonnement Internet SOTELMA', amount: 25000, category: 'Services Publics', status: 'PAID' },
        { tenantId: school.id, description: 'Maintenance Tracteur Agricole', amount: 350000, category: 'Maintenance', status: 'PENDING' }
      ]
    });
    console.log("✅ Dépenses enregistrées.");

    // 6. Invoices & Payments for Students
    const students = await prisma.student.findMany({
      where: { tenantId: school.id }
    });

    if (students.length === 0) {
      console.log("⚠️ Aucun étudiant trouvé pour générer les factures.");
    } else {
      let totalInvoiced = 0;
      let totalPaid = 0;

      for (const student of students) {
        const invoiceAmount = 250000; // 250,000 F CFA
        const invoice = await prisma.invoice.create({
          data: {
            tenantId: school.id,
            studentId: student.id,
            invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`,
            title: 'Frais de scolarité Année 2025-2026',
            type: 'TUITION',
            amount: invoiceAmount,
            status: 'UNPAID',
            dueDate: new Date(2025, 9, 15) // Oct 15, 2025
          }
        });
        totalInvoiced += invoiceAmount;

        // Randomly pay some invoices fully or partially
        const rand = Math.random();
        if (rand > 0.3) {
          // 70% chance to have a payment
          const paymentAmount = rand > 0.6 ? invoiceAmount : invoiceAmount / 2; // fully or half paid
          
          await prisma.payment.create({
            data: {
              tenantId: school.id,
              invoiceId: invoice.id,
              amount: paymentAmount,
              method: rand > 0.7 ? 'ORANGE_MONEY' : 'ESPECES',
              reference: `TXN-${Math.floor(Math.random() * 1000000)}`
            }
          });

          // Update invoice status
          await prisma.invoice.update({
            where: { id: invoice.id },
            data: { 
              status: paymentAmount === invoiceAmount ? 'PAID' : 'PARTIAL',
              paidDate: paymentAmount === invoiceAmount ? new Date() : null
            }
          });

          totalPaid += paymentAmount;
        }
      }
      console.log(`✅ Factures générées pour ${students.length} étudiants.`);
      console.log(`💰 Total Facturé : ${totalInvoiced.toLocaleString()} F CFA`);
      console.log(`💸 Total Encaissé : ${totalPaid.toLocaleString()} F CFA`);
    }

    console.log("==========================================");
    console.log("✅ Données Financières et RH insérées avec succès !");
    console.log("==========================================");

  } catch (error) {
    console.error("Erreur lors de l'insertion :", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
