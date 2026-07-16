import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

async function verifyLogins() {
  console.log('--- Vérification des comptes ---');
  
  const accounts = [
    { email: 'admin@cfppas-gao.ml', password: 'CfpPasGao2026!', role: 'Direction' },
    { email: 'compta@cfppas-gao.ml', password: 'Demo2026!', role: 'Compta' },
    { email: 'parent@cfppas-gao.ml', password: 'Demo2026!', role: 'Parent' },
  ];

  for (const acc of accounts) {
    const user = await prisma.user.findUnique({ where: { email: acc.email } });
    if (!user) {
      console.log(`❌ Compte ${acc.role} (${acc.email}) : NON TROUVÉ dans la base de données.`);
      continue;
    }

    const passwordMatch = await bcrypt.compare(acc.password, user.password);
    if (passwordMatch) {
      console.log(`✅ Compte ${acc.role} (${acc.email}) : Authentification RÉUSSIE.`);
    } else {
      console.log(`❌ Compte ${acc.role} (${acc.email}) : MOT DE PASSE INCORRECT.`);
    }
  }

  await prisma.$disconnect();
}

verifyLogins().catch(console.error);
