import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export async function GET(request: Request) {
  // 1. Sécurité : Vérifier le secret (CRON_SECRET)
  // Seul le cron job (ou l'admin) connaissant ce secret peut déclencher le backup.
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret || secret !== cronSecret) {
    return NextResponse.json({ error: 'Accès refusé. Secret invalide ou non configuré.' }, { status: 401 });
  }

  try {
    // Note: Pour Vercel/Serveurless, l'exécution de child_process peut être problématique 
    // et il n'y a pas pg_dump. Ce endpoint est pensé pour un VPS classique.
    const scriptPath = path.join(process.cwd(), 'scripts', 'backup.ts');
    
    // Déclenchement asynchrone du script via npx tsx
    // On n'attend pas la fin pour répondre 200 (car Vercel/Next coupe la requête après 10s-60s)
    execAsync(`npx tsx "${scriptPath}"`).catch((err) => {
      console.error('[API Backup] Erreur lors de l\'exécution asynchrone :', err);
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Processus de sauvegarde déclenché en arrière-plan.' 
    });
  } catch (error: any) {
    console.error('[API Backup] Failed:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur.' }, { status: 500 });
  }
}
