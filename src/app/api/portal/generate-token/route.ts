import { NextResponse } from 'next/server';
import { encrypt, getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * API to generate a secure, long-lived token for parent portal access.
 * Only accessible by authenticated school admins.
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { studentId } = await request.json();
    
    // Verify student belongs to this tenant
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true, tenantId: true }
    });

    if (!student || student.tenantId !== session.tenantId) {
      return NextResponse.json({ error: 'Élève non trouvé' }, { status: 404 });
    }

    // Generate a long-lived token (e.g., 365 days) for the portal
    // In a real scenario, you might want to rotate or expire these, 
    // but for school parent links, stability is often preferred.
    const token = await encrypt({ studentId: student.id, type: 'portal' }, '365d');

    return NextResponse.json({ token });
  } catch (error: any) {
    console.error('[TOKEN GENERATE]', error);
    return NextResponse.json({ error: 'Erreur lors de la génération du token' }, { status: 500 });
  }
}
