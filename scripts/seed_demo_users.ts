import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    const code = 'CFPPAS';
    const school = await prisma.school.findUnique({ where: { code } });
    
    if (!school) {
      console.log("L'école CFPPAS est introuvable.");
      return;
    }

    const passwordHash = await bcrypt.hash('Demo2026!', 10);

    const demoUsers = [
      { email: 'compta@cfppas-gao.ml', firstName: 'Aïssata', lastName: 'Cissé', role: UserRole.ACCOUNTANT },
      { email: 'prof@cfppas-gao.ml', firstName: 'Moussa', lastName: 'Diarra', role: UserRole.TEACHER },
      { email: 'rh@cfppas-gao.ml', firstName: 'Khadija', lastName: 'Sow', role: UserRole.HR_MANAGER },
      { email: 'surveillant@cfppas-gao.ml', firstName: 'Amadou', lastName: 'Kéita', role: UserRole.SURVEILLANT },
      { email: 'parent@cfppas-gao.ml', firstName: 'Cheick', lastName: 'Touré', role: UserRole.PARENT },
      { email: 'eleve@cfppas-gao.ml', firstName: 'Fatou', lastName: 'Touré', role: UserRole.STUDENT },
    ];

    console.log("Création des comptes de démonstration en cours...");

    for (const u of demoUsers) {
      await prisma.user.upsert({
        where: { email: u.email },
        update: {
          password: passwordHash,
          firstName: u.firstName,
          lastName: u.lastName,
          role: u.role,
        },
        create: {
          tenantId: school.id,
          email: u.email,
          password: passwordHash,
          firstName: u.firstName,
          lastName: u.lastName,
          role: u.role,
          isActive: true
        }
      });
      console.log(`✅ Compte ${u.role} créé : ${u.email}`);
    }

    console.log("==========================================");
    console.log("✅ Tous les comptes de démo ont été créés avec succès !");
    console.log("Mot de passe universel pour tous : Demo2026!");
    console.log("==========================================");

  } catch (error) {
    console.error("Erreur lors de la création :", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
