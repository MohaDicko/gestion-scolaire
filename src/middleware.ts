import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

// Routes accessibles sans être connecté
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
  '/workbox-',
];

const isPublicPath = (url: string) => publicPaths.some(path => url.startsWith(path));

// ── CSRF Protection ──────────────────────────────────────────────────────────
// For state-mutating requests (POST/PUT/DELETE/PATCH), verify that the Origin
// header matches the expected domain. This prevents cross-site request forgery.
const isMutatingMethod = (method: string) =>
  ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method.toUpperCase());

function csrfCheck(request: NextRequest): boolean {
  if (!isMutatingMethod(request.method)) return true; // GET/HEAD are safe

  // Mobile clients (Flutter) with Bearer token — skip CSRF check
  const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) return true;

  // Webhooks routes — skip CSRF check (they use their own signature verification)
  const { pathname } = request.nextUrl;
  if (pathname.startsWith('/api/finance/om-webhook') || pathname.startsWith('/api/webhooks')) return true;

  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000';

  if (!origin) {
    // No origin = likely a server-to-server call or old browser — allow but log
    return true;
  }

  // Normalize: strip protocol
  const originHost = origin.replace(/^https?:\/\//, '');

  // Allow same host or subdomain of root domain
  if (
    originHost === host ||
    originHost === rootDomain ||
    originHost.endsWith(`.${rootDomain}`) ||
    originHost.startsWith('localhost')
  ) {
    return true;
  }

  return false;
}

// ── Security Headers ─────────────────────────────────────────────────────────
const applySecurityHeaders = (response: NextResponse) => {
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
  return response;
};

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  const { pathname } = url;

  // ── 1. Global API Rate Limiting ──────────────────────────────────────────
  if (pathname.startsWith('/api/') && pathname !== '/api/auth/login') {
    const ip = getClientIp(request as any);
    const rl = await rateLimit(`global_api:${ip}`, { limit: 100, windowSecs: 60 });
    if (!rl.success) {
      return applySecurityHeaders(NextResponse.json(
        { error: 'Trop de requêtes. Veuillez ralentir.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      ));
    }
  }

  // ── 2. CSRF Protection for API mutations ─────────────────────────────────
  if (pathname.startsWith('/api/') && !csrfCheck(request)) {
    console.warn(`[CSRF] Requête bloquée depuis origin: ${request.headers.get('origin')} vers ${pathname}`);
    return applySecurityHeaders(NextResponse.json(
      { error: 'Requête bloquée : origine non autorisée.' },
      { status: 403 }
    ));
  }

  // Détection du sous-domaine / domaine personnalisé
  const currentHost = process.env.NODE_ENV === 'production'
    ? hostname.replace(`.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`, '')
    : hostname.replace(`.localhost:3000`, '');
  void currentHost; // used for future multi-tenant routing

  // ── 3. Routes publiques ──────────────────────────────────────────────────
  if (isPublicPath(pathname)) {
    const token = request.cookies.get('refreshToken')?.value;
    if (token && pathname === '/login') {
      return applySecurityHeaders(NextResponse.redirect(new URL('/dashboard', request.url)));
    }
    return applySecurityHeaders(NextResponse.next());
  }

  // ── 4. Vérification du token d'authentification ──────────────────────────
  const cookieToken = request.cookies.get('refreshToken')?.value;
  const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  const token = cookieToken || bearerToken;

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return applySecurityHeaders(NextResponse.json({ error: 'Non autorisé. Token manquant.' }, { status: 401 }));
    }
    return applySecurityHeaders(NextResponse.redirect(new URL('/login', request.url)));
  }

  try {
    // ── 5. Validation Cryptographique du JWT ─────────────────────────────
    const secretKey = process.env.JWT_SECRET;
    if (!secretKey) {
      console.error('[AUTH] FATAL: JWT_SECRET manquant dans le Middleware');
      return applySecurityHeaders(NextResponse.redirect(new URL('/login', request.url)));
    }
    const key = new TextEncoder().encode(secretKey);
    const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });

    // ── 6. Autorisation par rôle pour les routes admin ────────────────────
    if (pathname.startsWith('/api/admin/dashboard/stats') || pathname.startsWith('/api/admin/diagnostics')) {
      if (payload.role !== 'SUPER_ADMIN') {
        return applySecurityHeaders(NextResponse.json({ error: 'Accès refusé. Réservé au Super Admin.' }, { status: 403 }));
      }
    }

    return applySecurityHeaders(NextResponse.next());

  } catch {
    // Token expiré ou falsifié
    if (pathname.startsWith('/api/')) {
      return applySecurityHeaders(NextResponse.json({ error: 'Token invalide ou expiré.' }, { status: 401 }));
    }
    const response = applySecurityHeaders(NextResponse.redirect(new URL('/login', request.url)));
    response.cookies.delete('refreshToken');
    return response;
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|manifest.webmanifest|sw.js|workbox-).*)',
  ],
};
