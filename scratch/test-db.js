const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Testing connection...');
    await prisma.$connect();
    console.log('Connected successfully!');
    const users = await prisma.user.count();
    console.log('Users count:', users);
  } catch (e) {
    console.error('Connection failed:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
