const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Réinitialisation des mots de passe pour les profils de test...');
  
  const pass = await bcrypt.hash('admin123', 10);
  const targetEmails = [
    'super@schoolerp.com',
    'hr@schoolerp.com',
    'compta@schoolerp.com',
    'prof@schoolerp.com',
    'censeur@schoolerp.com',
    'surveillant@schoolerp.com'
  ];

  for (const email of targetEmails) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      await prisma.user.update({
        where: { email },
        data: { password: pass }
      });
      console.log(`✅ Mot de passe réinitialisé pour: ${email} -> admin123`);
    } else {
      console.log(`⚠️ Utilisateur non trouvé: ${email}`);
    }
  }

  console.log('🎉 Terminé !');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
