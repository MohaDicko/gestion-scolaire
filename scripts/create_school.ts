import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    const passwordHash = await bcrypt.hash('CfpPasGao2026!', 10);
    const code = 'CFPPAS';

    // 1. Upsert School with better personalization
    const school = await prisma.school.upsert({
      where: { code },
      update: {
        name: 'CFP-PAS de Gao (Agro-Pastorale)',
        address: 'Quartier Château, Route de Bourem',
        city: 'Gao',
        phoneNumber: '+223 70 12 34 56',
        motto: 'L\'Excellence au Service de l\'Agriculture et de l\'Élevage',
        nationalRNE: 'RNE-ML-GAO-2023',
        primaryColor: '#16a34a', // Vert Agriculture
        secondaryColor: '#451a03', // Marron Terre
        logoUrl: 'https://cdn-icons-png.flaticon.com/512/1004/1004186.png', // Logo agro
      },
      create: {
        name: 'CFP-PAS de Gao (Agro-Pastorale)',
        code: code,
        address: 'Quartier Château, Route de Bourem',
        city: 'Gao',
        country: 'Mali',
        phoneNumber: '+223 70 12 34 56',
        email: 'contact@cfppas-gao.ml',
        type: 'AGRO',
        drenCode: 'AE-GAO',
        isActive: true,
        isSetupComplete: true,
        motto: 'L\'Excellence au Service de l\'Agriculture et de l\'Élevage',
        nationalRNE: 'RNE-ML-GAO-2023',
        primaryColor: '#16a34a',
        secondaryColor: '#451a03',
        logoUrl: 'https://cdn-icons-png.flaticon.com/512/1004/1004186.png',
      }
    });

    // 2. Ensure Campus exists
    let campus = await prisma.campus.findFirst({ where: { tenantId: school.id } });
    if (!campus) {
      campus = await prisma.campus.create({
        data: {
          tenantId: school.id,
          name: 'Campus Principal Gao',
          address: 'Quartier Château',
          city: 'Gao',
          region: 'Gao',
          phoneNumber: '+223 70 12 34 56',
          email: 'contact@cfppas-gao.ml',
          managerName: 'Ousmane Maïga'
        }
      });
    } else {
      // Update existing campus
      await prisma.campus.update({
        where: { id: campus.id },
        data: {
          address: 'Quartier Château',
          managerName: 'Ousmane Maïga'
        }
      });
    }

    // 3. Ensure Academic Year exists
    let academicYear = await prisma.academicYear.findFirst({ where: { tenantId: school.id } });
    if (!academicYear) {
      academicYear = await prisma.academicYear.create({
        data: {
          tenantId: school.id,
          name: '2025-2026',
          startDate: new Date('2025-09-01'),
          endDate: new Date('2026-06-30'),
          isActive: true
        }
      });
    }

    // 4. Upsert Admin User
    const adminEmail = 'admin@cfppas-gao.ml';
    const adminUser = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        password: passwordHash,
        firstName: 'Ousmane',
        lastName: 'Maïga',
      },
      create: {
        tenantId: school.id,
        email: adminEmail,
        password: passwordHash,
        firstName: 'Ousmane',
        lastName: 'Maïga',
        role: 'SCHOOL_ADMIN',
        isActive: true
      }
    });

    console.log("=== COMPTE PERSONNALISÉ AVEC SUCCÈS ===");
    console.log("École : ", school.name);
    console.log("Couleurs : Vert Agro (#16a34a) & Terre (#451a03)");
    console.log("Directeur : ", adminUser.firstName, adminUser.lastName);
    console.log("Email : ", adminUser.email);
    console.log("==========================================");

  } catch (error) {
    console.error("Error setting up school:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
