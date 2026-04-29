const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('👪 Création du compte Parent de test...');
  
  // On va récupérer la première école pour le tenantId
  const school = await prisma.school.findFirst();
  if (!school) throw new Error("Aucune école trouvée");

  // On va récupérer le premier étudiant pour avoir l'email de son parent
  const student = await prisma.student.findFirst({
    orderBy: { createdAt: 'asc' }
  });

  if (!student) throw new Error("Aucun élève trouvé");

  const parentEmail = student.parentEmail || 'parent@schoolerp.com';
  const parentName = student.parentName || 'Parent Test';

  const pass = await bcrypt.hash('admin123', 10);
  
  await prisma.user.upsert({
    where: { email: parentEmail },
    update: { 
      role: 'PARENT',
      password: pass,
      tenantId: school.id
    },
    create: {
      tenantId: school.id,
      email: parentEmail,
      password: pass,
      firstName: parentName.split(' ')[0] || 'Parent',
      lastName: parentName.split(' ')[1] || 'Test',
      role: 'PARENT',
    },
  });

  console.log(`✅ Compte parent créé avec succès !`);
  console.log(`📧 Email: ${parentEmail}`);
  console.log(`🔑 Mot de passe: admin123`);
  console.log(`👦 Élève lié: ${student.firstName} ${student.lastName} (${student.studentNumber})`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
