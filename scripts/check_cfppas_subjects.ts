import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const school = await prisma.school.findFirst({ where: { type: 'AGRO', isActive: true } });
  if (!school) { console.log('CFPPAS introuvable'); return; }
  const subjects = await prisma.subject.findMany({ where: { tenantId: school.id }, orderBy: { name: 'asc' } });
  console.log(`gradingScale: ${school.gradingScale}`);
  console.log(`${subjects.length} matières:`);
  subjects.forEach(s => console.log(`  code="${s.code}" | coeff=${s.coefficient} | name="${s.name}"`));
}
main().finally(() => prisma.$disconnect());
