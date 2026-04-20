import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/auth';
import * as bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // 1. Find User (For this PoC, we will create a dummy user logic if DB is empty, or just authenticate based on Prisma)
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Temporaire : Auto-création du premier Admin si la DB est vide
      if (email === 'admin@schoolerp.com') {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const newUser = await prisma.user.create({
          data: {
            email,
            password: hashedPassword,
            firstName: 'Super',
            lastName: 'Admin',
            role: 'SUPER_ADMIN',
            tenantId: '1' // ID par défaut
          }
        });
        return await handleLogin(newUser);
      }
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // 2. Validate Password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // 3. Handle Login
    return await handleLogin(user);

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

async function handleLogin(user: any) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId,
  };

  const accessToken = await encrypt(payload, '1h');
  const refreshToken = await encrypt({ id: user.id }, '7d');

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

  // Set HTTP Only cookie for refresh logic
  response.cookies.set('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  });

  return response;
}
