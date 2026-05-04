import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const school = await prisma.school.findUnique({ where: { subdomain: 'excellence' } });
  
  if (!school) {
    console.log('❌ École "excellence" non trouvée. Lancez d\'abord le seeder.');
    return;
  }

  const hashedPassword = await bcrypt.hash('TestPassword123!', 10);

  const user = await prisma.user.upsert({
    where: { email: 'admin@excellence.ml' },
    update: { 
      password: hashedPassword,
      tenantId: school.id,
      role: 'SCHOOL_ADMIN'
    },
    create: {
      email: 'admin@excellence.ml',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'Excellence',
      role: 'SCHOOL_ADMIN',
      tenantId: school.id
    }
  });

  console.log('✅ Utilisateur de démonstration créé !');
  console.log('📧 Email: admin@excellence.ml');
  console.log('🔑 Password: TestPassword123!');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
