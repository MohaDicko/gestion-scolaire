const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const count = await prisma.user.count();
    console.log(`TOTAL_USERS: ${count}`);
    const superadmin = await prisma.user.findUnique({ where: { email: 'superadmin@schoolerp.com' } });
    console.log(`SUPERADMIN_EXISTS: ${!!superadmin}`);
    if (superadmin) {
        console.log(`SUPERADMIN_ROLE: ${superadmin.role}`);
    }
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

check();
