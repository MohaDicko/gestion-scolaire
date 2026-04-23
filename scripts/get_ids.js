const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const s = await prisma.school.findFirst();
    const c = await prisma.campus.findFirst();
    console.log(JSON.stringify({ tenantId: s?.id, campusId: c?.id }));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
