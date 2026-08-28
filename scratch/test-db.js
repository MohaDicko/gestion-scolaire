const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$connect();
    console.log('Database connection successful!');
    const count = await prisma.user.count();
    console.log('Total users:', count);
    const users = await prisma.user.findMany({ select: { email: true } });
    console.log('Users:', users.map(u => u.email).join(', '));
  } catch (error) {
    console.error('Connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}
main();
