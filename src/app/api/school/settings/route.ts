import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

/**
 * GET /api/school/settings
 * Retourne les paramètres pédagogiques et financiers de l'école connectée.
 * Utilisé par les pages client pour adapter leur comportement selon l'école.
 */
export async function GET() {
  const session = await getSession();
  if (!session?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const school = await prisma.school.findUnique({
      where: { id: session.tenantId },
      select: {
        gradingScale: true,
        defaultPaymentMethod: true,
        defaultTuition: true,
        primaryColor: true,
        name: true,
      }
    });

    if (!school) {
      return NextResponse.json({ error: 'École introuvable' }, { status: 404 });
    }

    return NextResponse.json({
      gradingScale: school.gradingScale ?? 20,
      defaultPaymentMethod: school.defaultPaymentMethod ?? 'ESPECES',
      defaultTuition: school.defaultTuition ?? 0,
      primaryColor: school.primaryColor ?? '#4f8ef7',
      schoolName: school.name,
    });
  } catch (error) {
    console.error('[SCHOOL SETTINGS]', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
