import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { encrypt } from '@/lib/auth';

export async function POST(request: Request) {
  const session = await getSession();
  
  if (!session || session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  try {
    const { schoolId } = await request.json();

    if (!schoolId) {
      return NextResponse.json({ error: 'ID de l\'établissement manquant' }, { status: 400 });
    }

    // Mettre à jour le tenantId du Super Admin dans la base de données
    const updatedUser = await prisma.user.update({
      where: { id: session.id },
      data: { tenantId: schoolId }
    });

    // Générer de nouveaux tokens avec le nouveau tenantId
    const sessionPayload = {
      id: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      tenantId: updatedUser.tenantId,
    };

    const accessToken = await encrypt(sessionPayload, '15m');
    const refreshToken = await encrypt(sessionPayload, '7d');

    const response = NextResponse.json({
      success: true,
      accessToken,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
        tenantId: updatedUser.tenantId,
      }
    });

    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Erreur Switch Tenant:', error);
    return NextResponse.json({ error: 'Erreur Serveur' }, { status: 500 });
  }
}
