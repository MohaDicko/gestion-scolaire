import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

/**
 * POST /api/admin/school-settings
 * Met à jour les paramètres pédagogiques et financiers d'une école.
 * Réservé aux super-admins.
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Seul l'admin de l'école peut modifier ses settings
  if (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { gradingScale, defaultPaymentMethod, defaultTuition, schoolCode } = body;

  // Si schoolCode fourni + session SUPER_ADMIN → mise à jour d'une autre école
  const targetId = schoolCode
    ? (await prisma.school.findUnique({ where: { code: schoolCode }, select: { id: true } }))?.id
    : session.tenantId;

  if (!targetId) {
    return NextResponse.json({ error: 'École introuvable' }, { status: 404 });
  }

  const updateData: any = {};
  if (gradingScale !== undefined) updateData.gradingScale = Number(gradingScale);
  if (defaultPaymentMethod !== undefined) updateData.defaultPaymentMethod = defaultPaymentMethod;
  if (defaultTuition !== undefined) updateData.defaultTuition = Number(defaultTuition);

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'Aucun champ à mettre à jour' }, { status: 400 });
  }

  const updated = await prisma.school.update({
    where: { id: targetId },
    data: updateData,
    select: { name: true, code: true, gradingScale: true, defaultPaymentMethod: true, defaultTuition: true }
  });

  return NextResponse.json({ success: true, school: updated });
}
