import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

const execAsync = promisify(exec);

async function performBackup() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is missing.');
  }

  // Ensure backups directory exists
  const backupDir = path.join(process.cwd(), 'backups');
  try {
    await fs.access(backupDir);
  } catch {
    await fs.mkdir(backupDir, { recursive: true });
  }

  // Generate filename with current timestamp
  const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup_schoolerp_${dateStr}.sql.gz`;
  const filepath = path.join(backupDir, filename);

  console.log(`[Backup] Démarrage de la sauvegarde de la base de données...`);
  console.log(`[Backup] Fichier cible : ${filename}`);

  try {
    // Note: This assumes pg_dump is available in the system PATH.
    // For a real production system with Postgres, it usually is.
    // We use pg_dump with the database URL, outputting via gzip.
    // If running on Windows without pg_dump, this will fail.
    const command = `pg_dump "${databaseUrl}" | gzip > "${filepath}"`;
    await execAsync(command);
    
    console.log(`[Backup] ✅ Sauvegarde réussie : ${filepath}`);

    // Rotation: Delete backups older than 30 days
    await cleanupOldBackups(backupDir, 30);
  } catch (error: any) {
    console.error(`[Backup] ❌ Erreur lors de la sauvegarde :`, error.message);
    if (error.message.includes('pg_dump: command not found') || error.message.includes("n'est pas reconnu")) {
      console.error(`[AIDE] Veuillez vous assurer que les outils clients PostgreSQL (pg_dump) sont installés sur ce serveur et ajoutés à la variable d'environnement PATH.`);
    }
    process.exit(1);
  }
}

async function cleanupOldBackups(backupDir: string, maxDays: number) {
  const files = await fs.readdir(backupDir);
  const now = Date.now();
  const maxAgeMs = maxDays * 24 * 60 * 60 * 1000;
  
  let deletedCount = 0;

  for (const file of files) {
    if (!file.endsWith('.sql.gz')) continue;
    
    const filePath = path.join(backupDir, file);
    const stats = await fs.stat(filePath);
    
    if (now - stats.mtimeMs > maxAgeMs) {
      await fs.unlink(filePath);
      console.log(`[Backup Rotation] 🗑️ Suppression de l'ancienne sauvegarde : ${file}`);
      deletedCount++;
    }
  }

  if (deletedCount > 0) {
    console.log(`[Backup Rotation] ${deletedCount} ancienne(s) sauvegarde(s) supprimée(s).`);
  }
}

performBackup().catch(err => {
  console.error('[Backup] Fatal error:', err);
  process.exit(1);
});
