// Script de mise à jour des settings CFPPAS
// Utilise DIRECT_URL (port 5432) pour contourner PgBouncer qui bloque localement
const { PrismaClient } = require('@prisma/client');

// Extraire DIRECT_URL depuis .env
require('dotenv').config();
const directUrl = process.env.DIRECT_URL;
if (!directUrl) {
  console.error('DIRECT_URL non trouvée dans .env');
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: { db: { url: directUrl } }
});

prisma.school.update({
  where: { code: 'CFPPAS' },
  data: { gradingScale: 100, defaultPaymentMethod: 'VIREMENT', defaultTuition: 200000 }
}).then(s => {
  console.log('✅ CFPPAS mis a jour avec succes:');
  console.log('   gradingScale:', s.gradingScale);
  console.log('   defaultPaymentMethod:', s.defaultPaymentMethod);
  console.log('   defaultTuition:', s.defaultTuition);
}).catch(e => {
  console.error('❌ ERREUR:', e.message);
}).finally(() => {
  prisma.$disconnect();
});
