import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Suppression de toutes les notes...");
  try {
    const deletedGrades = await prisma.grade.deleteMany({});
    console.log(`Succès : ${deletedGrades.count} notes supprimées.`);
  } catch (error) {
    console.error("Erreur lors de la suppression :", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
