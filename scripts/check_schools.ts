import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const schools = await prisma.school.findMany({
    select: {
      id: true,
      name: true,
      code: true,
      city: true,
      type: true,
    }
  });
  console.log("Current schools in DB:", JSON.stringify(schools, null, 2));
}

main().finally(() => prisma.$disconnect());
