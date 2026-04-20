const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function main() {
  try {
    const sqlPath = path.join(__dirname, 'setup_utf8.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    const lines = sql.split('\n');
    let currentStatement = '';
    
    console.log('Starting manual SQL sync (UTF-8)...');

    for (let line of lines) {
      if (line.trim().startsWith('--') || line.trim() === '') continue;
      currentStatement += line + ' ';
      
      if (line.includes(';')) {
        try {
          await prisma.$executeRawUnsafe(currentStatement);
          process.stdout.write('.');
        } catch (err) {
          if (!err.message.includes('already exists')) {
             console.log('\nError on:', currentStatement.substring(0, 50) + '...');
             console.error(err.message);
          }
        }
        currentStatement = '';
      }
    }

    console.log('\nManual sync finished.');
  } catch (e) {
    console.error('Core failure:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
