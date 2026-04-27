const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const c = await prisma.campus.findFirst();
  console.log('DEFAULT_CAMPUS:', c?.id);
}
main().finally(() => prisma.$disconnect());
