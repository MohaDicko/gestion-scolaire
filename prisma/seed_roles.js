const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🏗️  SEEDING DES PROFILS UTILISATEURS...');

  const school = await prisma.school.findFirst({ where: { code: 'SCH-001' } });
  if (!school) {
    console.error('École SCH-001 non trouvée. Veuillez d\'abord lancer le seed principal.');
    return;
  }

  const pass = await bcrypt.hash('pass123', 10);

  const roles = [
    { email: 'super@schoolerp.com', role: 'SUPER_ADMIN', name: 'Super Admin' },
    { email: 'admin@schoolerp.com', role: 'SCHOOL_ADMIN', name: 'Directeur' },
    { email: 'hr@schoolerp.com', role: 'HR_MANAGER', name: 'RH Manager' },
    { email: 'compta@schoolerp.com', role: 'ACCOUNTANT', name: 'Comptable' },
    { email: 'prof@schoolerp.com', role: 'TEACHER', name: 'Enseignant' },
    { email: 'censeur@schoolerp.com', role: 'CENSEUR', name: 'Censeur' },
    { email: 'surveillant@schoolerp.com', role: 'SURVEILLANT', name: 'Surveillant' },
  ];

  for (const r of roles) {
    await prisma.user.upsert({
      where: { email: r.email },
      update: { tenantId: school.id, password: pass, role: r.role },
      create: {
        tenantId: school.id,
        email: r.email,
        password: pass,
        firstName: r.name,
        lastName: 'Test',
        role: r.role,
      },
    });
  }

  console.log('✅ TOUS LES PROFILS SONT CRÉÉS AVEC LE MOT DE PASSE "pass123"');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
