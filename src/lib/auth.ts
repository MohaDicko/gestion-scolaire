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

/**
 * Récupère la session actuelle de l'utilisateur à partir des cookies httpOnly.
 * Utilisable dans les Server Components et les API Routes.
 */
export async function getSession(): Promise<{ id: string; email: string; role: string; tenantId: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('refreshToken')?.value;
  if (!token) return null;
  return await decrypt(token);
}
