import { PrismaClient, SchoolType, UserRole, Plan } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log("🏥 Initialisation de l'École de Santé Bernard Kouchner (ESBK) de Bamako...");

  const passwordAdminHash = await bcrypt.hash('EsbkBamako2026!', 10);
  const passwordStaffHash = await bcrypt.hash('Esbk2026!', 10);

  // 1. Création ou mise à jour de l'établissement (School / Tenant)
  const school = await prisma.school.upsert({
    where: { code: 'ESBK' },
    update: {
      name: 'École de Santé Bernard Kouchner (ESBK)',
      city: 'Bamako',
      address: 'Hamdallaye ACI 2000, Près du Monument de l\'Obélisque, Bamako',
      country: 'Mali',
      phoneNumber: '+223 20 29 45 80',
      email: 'direction@esbk-bamako.ml',
      type: SchoolType.SANTE,
      nationalRNE: 'AGR-MSHP-2024-BKO-087',
      motto: 'Excellence médicale, Humanisme & Soins de Qualité',
      plan: Plan.BUSINESS,
      gradingScale: 20,
      defaultPaymentMethod: 'ESPECES',
      defaultTuition: 450000, // 450 000 FCFA / an
      isActive: true,
      isSetupComplete: true,
    },
    create: {
      code: 'ESBK',
      name: 'École de Santé Bernard Kouchner (ESBK)',
      city: 'Bamako',
      address: 'Hamdallaye ACI 2000, Près du Monument de l\'Obélisque, Bamako',
      country: 'Mali',
      phoneNumber: '+223 20 29 45 80',
      email: 'direction@esbk-bamako.ml',
      type: SchoolType.SANTE,
      nationalRNE: 'AGR-MSHP-2024-BKO-087',
      motto: 'Excellence médicale, Humanisme & Soins de Qualité',
      plan: Plan.BUSINESS,
      gradingScale: 20,
      defaultPaymentMethod: 'ESPECES',
      defaultTuition: 450000,
      isActive: true,
      isSetupComplete: true,
    }
  });

  console.log(`✅ Établissement créé : ${school.name} (ID: ${school.id})`);

  // 2. Campus Central
  let campus = await prisma.campus.findFirst({
    where: { tenantId: school.id }
  });

  if (!campus) {
    campus = await prisma.campus.create({
      data: {
        tenantId: school.id,
        name: 'Campus Central ACI 2000 — Bamako',
        address: 'Hamdallaye ACI 2000',
        city: 'Bamako',
        region: 'District de Bamako',
        phoneNumber: '+223 20 29 45 80',
        email: 'campus.bko@esbk-bamako.ml',
        managerName: 'Dr. Ibrahim Traoré',
        isActive: true,
      }
    });
    console.log(`✅ Campus créé : ${campus.name}`);
  }

  // 3. Année Académique 2025 - 2026
  let academicYear = await prisma.academicYear.findFirst({
    where: { tenantId: school.id, name: '2025-2026' }
  });

  if (!academicYear) {
    academicYear = await prisma.academicYear.create({
      data: {
        tenantId: school.id,
        name: '2025-2026',
        startDate: new Date('2025-10-01'),
        endDate: new Date('2026-06-30'),
        isActive: true,
      }
    });
    console.log(`✅ Année académique créée : ${academicYear.name}`);
  }

  // 4. Classes / Promotions de Santé
  const classesData = [
    { name: '1ère Année IDE (Infirmiers d\'État)', capacity: 45, level: '1ère Année' },
    { name: '2ème Année IDE (Soins & Pratique)', capacity: 40, level: '2ème Année' },
    { name: '1ère Année SF (Sages-Femmes)', capacity: 35, level: '1ère Année' },
    { name: 'Techniciens de Laboratoire & Biologie', capacity: 30, level: '1ère Année' },
  ];

  for (const c of classesData) {
    const existingClass = await prisma.classroom.findFirst({
      where: { tenantId: school.id, name: c.name }
    });
    if (!existingClass) {
      await prisma.classroom.create({
        data: {
          tenantId: school.id,
          campusId: campus.id,
          academicYearId: academicYear.id,
          name: c.name,
          maxCapacity: c.capacity,
          level: c.level,
        }
      });
      console.log(`✅ Promotion créée : ${c.name}`);
    }
  }

  // 5. Matières Médicales / Modules de Santé
  const subjectsData = [
    { name: 'Anatomie & Physiologie Humaine', code: 'MED-101', coefficient: 3 },
    { name: 'Soins Infirmiers Fondamentaux', code: 'INF-102', coefficient: 4 },
    { name: 'Pharmacologie & Thérapeutique', code: 'PHAR-103', coefficient: 3 },
    { name: 'Santé Publique & Épidémiologie', code: 'SP-104', coefficient: 2 },
    { name: 'Déontologie & Éthique Médicale', code: 'ETH-105', coefficient: 2 },
    { name: 'Gynécologie & Obstétrique de Base', code: 'OBS-106', coefficient: 4 },
  ];

  for (const s of subjectsData) {
    const existingSubject = await prisma.subject.findFirst({
      where: { tenantId: school.id, code: s.code }
    });
    if (!existingSubject) {
      await prisma.subject.create({
        data: {
          tenantId: school.id,
          name: s.name,
          code: s.code,
          coefficient: s.coefficient,
        }
      });
      console.log(`✅ Module médical créé : ${s.name}`);
    }
  }

  // 6. Utilisateurs & Identifiants Officiels
  const usersToCreate = [
    {
      email: 'admin@esbk-bamako.ml',
      password: passwordAdminHash,
      firstName: 'Dr. Ibrahim',
      lastName: 'Traoré',
      role: UserRole.SCHOOL_ADMIN,
      title: 'Directeur Général d\'Établissement'
    },
    {
      email: 'scolarite@esbk-bamako.ml',
      password: passwordStaffHash,
      firstName: 'Fatoumata',
      lastName: 'Samaké',
      role: UserRole.CENSEUR,
      title: 'Secrétaire Générale / Scolarité'
    },
    {
      email: 'caisse@esbk-bamako.ml',
      password: passwordStaffHash,
      firstName: 'Modibo',
      lastName: 'Keïta',
      role: UserRole.ACCOUNTANT,
      title: 'Responsable Caisse & Facturation'
    },
    {
      email: 'dr.coulibaly@esbk-bamako.ml',
      password: passwordStaffHash,
      firstName: 'Dr. Aminata',
      lastName: 'Coulibaly',
      role: UserRole.TEACHER,
      title: 'Médecin Enseignant / Soins Infirmiers'
    },
  ];

  for (const u of usersToCreate) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        tenantId: school.id,
        password: u.password,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        isActive: true,
      },
      create: {
        tenantId: school.id,
        email: u.email,
        password: u.password,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        isActive: true,
      }
    });
    console.log(`👤 Utilisateur actif : ${u.email} (${u.role})`);
  }

  console.log("\n=======================================================");
  console.log("🎉 COMPTE ÉCOLE DE SANTÉ BERNARD KOUCHNER PRÊT !");
  console.log("=======================================================");
  console.log("Établissement   : École de Santé Bernard Kouchner (ESBK)");
  console.log("Code Établissement : ESBK");
  console.log("Ville           : Bamako, Mali (ACI 2000)");
  console.log("Email Admin     : admin@esbk-bamako.ml");
  console.log("Mot de passe    : EsbkBamako2026!");
  console.log("Rôle            : SCHOOL_ADMIN (Dr. Ibrahim Traoré)");
  console.log("=======================================================");
}

main()
  .catch((e) => {
    console.error("Erreur lors de la création de l'école :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
