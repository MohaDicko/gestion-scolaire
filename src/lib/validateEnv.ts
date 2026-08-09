/**
 * validateEnv.ts — Validates critical env vars at startup.
 * Import once in prisma.ts singleton.
 */
export function validateEnvironment(): void {
  if (typeof window !== 'undefined') return; // server only

  const required = [
    { key: 'DATABASE_URL', min: 20 },
    { key: 'JWT_SECRET', min: 32 },
  ];

  const placeholders = ['REMPLACER_', 'VOTRE_', 'YOUR_', 'CHANGE_ME', 'changeme'];

  const errors: string[] = [];

  for (const { key, min } of required) {
    const val = process.env[key];
    if (!val) { errors.push(`L'ENV ${key} est requise mais non definie.`); continue; }
    if (val.length < min) errors.push(`L'ENV ${key} doit contenir plus de ${min} caracteres.`);
    if (placeholders.some(p => val.includes(p))) errors.push(`L'ENV ${key} contient une valeur placeholder.`);
  }

  if (errors.length > 0) {
    throw new Error(
      `[SECURITE] Variables d'environnement mal configurees :\n${errors.join('\n')}\n` +
      `Verifiez votre .env (local) ou Vercel Settings > Environment Variables (production)\n`
    );
  }
}
