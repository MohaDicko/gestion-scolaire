import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

// Liste des routes accessibles sans être connecté
const publicPaths = [
  '/',
  '/login',
  '/api/auth/login',
  '/portal',
  '/api/portal',
  '/_next',
  '/favicon.ico',
  '/manifest.json',
  '/manifest.webmanifest',
  '/sw.js',
  '/sw.js.map',
  '/workbox-'
];

// Vérifie si le chemin demandé est public
const isPublicPath = (url: string) => {
  return publicPaths.some(path => url.startsWith(path));
};

const applySecurityHeaders = (response: NextResponse) => {
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
};

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  const { pathname } = url;

  // Global API Rate Limiting (except login which has its own strict limit)
  if (pathname.startsWith('/api/') && pathname !== '/api/auth/login') {
    const ip = getClientIp(request as any);
    const rl = rateLimit(`global_api:${ip}`, { limit: 100, windowSecs: 60 });
    if (!rl.success) {
      return applySecurityHeaders(NextResponse.json(
        { error: 'Trop de requêtes. Veuillez ralentir.' },
        { status: 429 }
      ));
    }
  }

  // Détection du sous-domaine / domaine personnalisé
  const currentHost = process.env.NODE_ENV === 'production' 
    ? hostname.replace(`.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`, '')
    : hostname.replace(`.localhost:3000`, '');

  // 1. Laisser passer les routes publiques
  if (isPublicPath(pathname)) {
    // Si l'utilisateur est déjà connecté et essaie d'aller sur /login, on le redirige vers le dashboard
    const token = request.cookies.get('refreshToken')?.value;
    if (token && pathname === '/login') {
      return applySecurityHeaders(NextResponse.redirect(new URL('/dashboard', request.url)));
    }
    return applySecurityHeaders(NextResponse.next());
  }

  // 2. Vérification de sécurité pour les routes privées
  const cookieToken = request.cookies.get('refreshToken')?.value;

  // Support mobile Flutter : header Authorization: Bearer <accessToken>
  const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  const token = cookieToken || bearerToken;

  if (!token) {
    // Routes API sans token → 401 JSON (pas de redirect pour les clients mobiles)
    if (pathname.startsWith('/api/')) {
      return applySecurityHeaders(NextResponse.json({ error: 'Non autorisé. Token manquant.' }, { status: 401 }));
    }
    // Pages web sans token → redirect login
    return applySecurityHeaders(NextResponse.redirect(new URL('/login', request.url)));
  }

  try {
    // 3. Validation Cryptographique du JWT sur le "Edge Runtime"
    const secretKey = process.env.JWT_SECRET;
    if (!secretKey) {
        console.error('FATAL: JWT_SECRET missing in Middleware');
        return applySecurityHeaders(NextResponse.redirect(new URL('/login', request.url)));
    }
    const key = new TextEncoder().encode(secretKey);
    
    const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });

    // Autorisation spécifique pour les APIs de stats/diagnostics
    if (pathname.startsWith('/api/admin/dashboard/stats') || pathname.startsWith('/api/admin/diagnostics')) {
      if (payload.role !== 'SUPER_ADMIN') {
        return applySecurityHeaders(NextResponse.json({ error: 'Accès refusé. Réservé au Super Admin.' }, { status: 403 }));
      }
    }

    // 4. Configuration des headers de sécurité (Niveau Bancaire / ERP)
    return applySecurityHeaders(NextResponse.next());
  } catch (error) {
    // Token expiré ou falsifié
    if (pathname.startsWith('/api/')) {
      // Routes API → 401 JSON (les clients mobiles gèrent eux-mêmes la reconnexion)
      return applySecurityHeaders(NextResponse.json({ error: 'Token invalide ou expiré.' }, { status: 401 }));
    }
    // Pages web → détruire le cookie et rediriger
    const response = applySecurityHeaders(NextResponse.redirect(new URL('/login', request.url)));
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
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|manifest.webmanifest|sw.js|workbox-).*)',
  ],
};
