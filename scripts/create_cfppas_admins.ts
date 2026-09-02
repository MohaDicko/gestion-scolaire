import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Recherche du CFPPAS...');
  const school = await prisma.school.findFirst({
    where: { OR: [{ name: { contains: 'CFPPAS' } }, { type: 'AGRO' }] }
  });

  if (!school) {
    console.log('CFPPAS non trouvé dans la BD.');
    return;
  }
  console.log(`École trouvée : ${school.name} (ID: ${school.id})`);

  const pass = await bcrypt.hash('admin123', 10);

  // Admin principal
  const admin1 = await prisma.user.upsert({
    where: { email: 'admin@cfppas-gao.ml' },
    update: { password: pass, tenantId: school.id, role: 'SCHOOL_ADMIN' },
    create: {
      email: 'admin@cfppas-gao.ml',
      password: pass,
      firstName: 'Admin',
      lastName: 'CFPPAS',
      role: 'SCHOOL_ADMIN',
      tenantId: school.id,
    }
  });
  console.log(`Créé/Mis à jour: ${admin1.email} avec mot de passe 'admin123'`);

  // Deuxième admin (Hamada)
  const admin2 = await prisma.user.upsert({
    where: { email: 'hamada@cfppas-gao.ml' },
    update: { password: pass, tenantId: school.id, role: 'SCHOOL_ADMIN' },
    create: {
      email: 'hamada@cfppas-gao.ml',
      password: pass,
      firstName: 'Hamada',
      lastName: 'Admin CFPPAS',
      role: 'SCHOOL_ADMIN',
      tenantId: school.id,
    }
  });
  console.log(`Créé/Mis à jour: ${admin2.email} avec mot de passe 'admin123'`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
