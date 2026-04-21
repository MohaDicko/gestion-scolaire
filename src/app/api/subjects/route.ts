import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const subjects = await prisma.subject.findMany({
      where: { tenantId: session.tenantId },
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(subjects);
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['SUPER_ADMIN', 'SCHOOL_ADMIN', 'DIRECTEUR_DES_ETUDES'].includes(session.role)) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }
  try {
    const { name, code, coefficient } = await request.json();
    if (!name || !code) return NextResponse.json({ error: 'name et code sont requis' }, { status: 400 });
    const subject = await prisma.subject.create({
      data: { tenantId: session.tenantId, name, code: code.toUpperCase(), coefficient: parseFloat(coefficient) || 1.0 }
    });
    return NextResponse.json(subject, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') return NextResponse.json({ error: 'Ce code matière existe déjà.' }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
