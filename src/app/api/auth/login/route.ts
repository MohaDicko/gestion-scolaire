import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/auth';
import * as bcrypt from 'bcryptjs';
import { rateLimit, getClientIp } from '@/lib/rateLimit';
import { logAudit } from '@/lib/audit';

export async function POST(request: Request) {
  // ── Rate Limiting: max 10 login attempts per IP per 15 minutes ──
  const ip = getClientIp(request);
  const rl = rateLimit(`login:${ip}`, { limit: 10, windowSecs: 15 * 60 });

  if (!rl.success) {
    const retryAfterSecs = Math.ceil((rl.resetAt - Date.now()) / 1000);
    return NextResponse.json(
      { error: `Trop de tentatives. Réessayez dans ${Math.ceil(retryAfterSecs / 60)} minute(s).` },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfterSecs),
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': '0',
        }
      }
    );
  }

  try {
    const body = await request.json();
    const { email, password } = body;

    // --- Input validation ---
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Adresse email invalide.' }, { status: 400 });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'Mot de passe invalide (minimum 6 caractères).' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });

    // --- Domain/Subdomain Verification ---
    const host = request.headers.get('host') || '';
    const isLocal = host.includes('localhost');
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000';
    
    // Extract subdomain (e.g., 'ecole1' from 'ecole1.votre-erp.com')
    const subdomain = isLocal 
      ? (host !== 'localhost:3000' ? host.split('.')[0] : null)
      : (host !== rootDomain ? host.replace(`.${rootDomain}`, '') : null);

    if (subdomain && subdomain !== 'www' && user && user.role !== 'SUPER_ADMIN') {
      const school = await prisma.school.findFirst({
        where: { OR: [{ subdomain }, { customDomain: host }] }
      });

      if (school && user.tenantId !== school.id) {
        return NextResponse.json({ error: 'Cet utilisateur n\'appartient pas à cet établissement.' }, { status: 401 });
      }
    }

    // Always respond after bcrypt compare — avoids timing attacks / user enumeration
    if (!user) {
      await bcrypt.compare(password, '$2a$10$dummyhashtopreventtimingattack000000000000'); // blind compare
      return NextResponse.json({ error: 'Email ou mot de passe incorrect.' }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'Ce compte a été désactivé. Contactez l\'administrateur.' }, { status: 403 });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: 'Email ou mot de passe incorrect.' }, { status: 401 });
    }

    return await handleLogin(user);

  } catch (error) {
    // No stack trace in production logs
    console.error('[AUTH] Login error occurred');
    return NextResponse.json({ error: 'Erreur interne du serveur.' }, { status: 500 });
  }
}

async function handleLogin(user: any) {
  const sessionPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId,
  };

  // accessToken short-lived (15min) stored in memory via localStorage
  const accessToken = await encrypt(sessionPayload, '15m');
  // refreshToken long-lived (7d) stored in httpOnly cookie only
  const refreshToken = await encrypt(sessionPayload, '7d'); // includes full payload for getSession()

  const response = NextResponse.json({
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      tenantId: user.tenantId,
    }
  });

  response.cookies.set('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict', // upgraded from 'lax'
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  });

  await prisma.auditLog.create({
    data: {
      tenantId: user.tenantId || 'SYSTEM',
      userId: user.id,
      userRole: user.role,
      userEmail: user.email,
      action: 'LOGIN',
      entityType: 'User',
      entityId: user.id,
      description: `Connexion réussie de ${user.email}`,
    }
  });

  return response;
}
