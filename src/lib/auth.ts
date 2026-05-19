import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

// 🔐 SECURITY: Throw at startup if JWT_SECRET is missing — no silent fallback
const secretKey = process.env.JWT_SECRET;
if (!secretKey || secretKey.length < 32) {
  throw new Error(
    'FATAL: JWT_SECRET environment variable is not set or is too short (min 32 chars). ' +
    'Set it in your .env file or Vercel environment variables.'
  );
}
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any, expiresIn: string = '1h') {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(key);
}

export async function decrypt(input: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch {
    return null;
  }
}

export type SessionPayload = {
  id: string;
  email: string;
  role: string;
  tenantId: string;
};

/**
 * [WEB] Récupère la session depuis le cookie httpOnly `refreshToken`.
 * Utilisable dans les Server Components et les API Routes Next.js.
 * 100% inchangé — rétrocompatible avec tout le code existant.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('refreshToken')?.value;
  if (!token) return null;
  return await decrypt(token);
}

/**
 * [MOBILE] Récupère la session depuis le header `Authorization: Bearer <token>`.
 * Utilisé par les clients mobiles Flutter qui ne peuvent pas lire les cookies httpOnly.
 * Le token envoyé est l'`accessToken` retourné dans le body JSON de /api/auth/login.
 *
 * Côté Flutter:
 *   dio.options.headers['Authorization'] = 'Bearer $accessToken';
 */
export async function getSessionFromBearer(request: Request): Promise<SessionPayload | null> {
  const authHeader =
    request.headers.get('Authorization') ||
    request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7).trim(); // Retire le préfixe "Bearer "
  if (!token) return null;

  return await decrypt(token);
}

/**
 * [UNIVERSEL — WEB + MOBILE] Authentification double stratégie.
 *
 * Ordre de priorité :
 *   1. Cookie httpOnly `refreshToken`  → clients web (plus sécurisé)
 *   2. Header `Authorization: Bearer`  → clients mobiles Flutter
 *
 * Usage dans une API Route qui doit fonctionner pour WEB et MOBILE :
 *
 *   export async function GET(request: Request) {
 *     const session = await getSessionUniversal(request);
 *     if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 *     // ...
 *   }
 *
 * Note : Les routes qui n'ont pas encore migré continuent d'utiliser getSession() sans problème.
 */
export async function getSessionUniversal(request: Request): Promise<SessionPayload | null> {
  // Priorité 1 : cookie httpOnly (web)
  try {
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get('refreshToken')?.value;
    if (cookieToken) {
      const session = await decrypt(cookieToken);
      if (session) return session;
    }
  } catch {
    // cookies() peut jeter une erreur hors contexte Next.js — on tombe sur le Bearer
  }

  // Priorité 2 : header Authorization: Bearer (mobile)
  return await getSessionFromBearer(request);
}
