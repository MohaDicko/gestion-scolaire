import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Liste des routes accessibles sans être connecté
const publicPaths = [
  '/',
  '/login',
  '/api/auth/login',
  '/portal',
  '/api/portal',
  '/_next',
  '/favicon.ico'
];

// Vérifie si le chemin demandé est public
const isPublicPath = (url: string) => {
  return publicPaths.some(path => url.startsWith(path));
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Laisser passer les routes publiques
  if (isPublicPath(pathname)) {
    // Si l'utilisateur est déjà connecté et essaie d'aller sur /login, on le redirige vers le dashboard
    const token = request.cookies.get('refreshToken')?.value;
    if (token && pathname === '/login') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // 2. Vérification de sécurité pour les routes privées
  const token = request.cookies.get('refreshToken')?.value;

  if (!token) {
    // Pas de token -> retour à la page de connexion
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // 3. Validation Cryptographique du JWT sur le "Edge Runtime"
    const secretKey = process.env.JWT_SECRET;
    if (!secretKey) {
        console.error('FATAL: JWT_SECRET missing in Middleware');
        return NextResponse.redirect(new URL('/login', request.url));
    }
    const key = new TextEncoder().encode(secretKey);
    
    const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });

    // Autorisation spécifique pour les APIs de stats/diagnostics
    if (pathname.startsWith('/api/admin/dashboard/stats') || pathname.startsWith('/api/admin/diagnostics')) {
      if (payload.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Accès refusé. Réservé au Super Admin.' }, { status: 403 });
      }
    }

    // 4. Configuration des headers de sécurité (Niveau Bancaire / ERP)
    const response = NextResponse.next();
    
    response.headers.set('X-DNS-Prefetch-Control', 'on');
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https:; font-src 'self' data: https:;"
    );

    return response;
  } catch (error) {
    // Token expiré ou falsifié -> On détruit le cookie suspect et on redirige
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('refreshToken');
    return response;
  }
}

// 4. Cibler uniquement les pages et les API importantes (ignorer les images, css, etc.)
export const config = {
  matcher: [
    /*
     * Protéger toutes les routes SAUF:
     * - api (si on veut laisser des webhooks, sinon on protège aussi)
     * - _next/static (fichiers statiques)
     * - _next/image (images d'optimisation)
     * - favicon.ico (icône du site)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
