import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const classroomId = url.searchParams.get('classroomId');
  const academicYearId = url.searchParams.get('academicYearId');

  try {
    const filters: any = {};
    if (classroomId) filters.classroomId = classroomId;
    if (academicYearId) filters.academicYearId = academicYearId;

    if (Object.keys(filters).length === 0) {
      return NextResponse.json({ error: 'Fournissez au moins classroomId ou academicYearId' }, { status: 400 });
    }

    const enrollments = await prisma.enrollment.findMany({
      where: filters,
      include: {
        student: { select: { id: true, firstName: true, lastName: true, studentNumber: true, tenantId: true } },
        classroom: { select: { id: true, name: true, tenantId: true } },
        academicYear: { select: { id: true, name: true } }
      }
    });

    const filtered = enrollments.filter(e => e.student.tenantId === session.tenantId && e.classroom.tenantId === session.tenantId);
    return NextResponse.json(filtered);
  } catch (error) {
    console.error('[ENROLLMENTS GET]', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { studentId, classroomId, academicYearId } = body;

    if (!studentId || !classroomId || !academicYearId) {
      return NextResponse.json({ error: 'studentId, classroomId et academicYearId sont requis' }, { status: 400 });
    }

    const [classroom, student, academicYear] = await Promise.all([
      prisma.classroom.findFirst({ where: { id: classroomId, tenantId: session.tenantId } }),
      prisma.student.findFirst({ where: { id: studentId, tenantId: session.tenantId } }),
      prisma.academicYear.findUnique({ where: { id: academicYearId } }),
    ]);

    if (!classroom) return NextResponse.json({ error: 'Classe introuvable ou accès non autorisé' }, { status: 403 });
    if (!student) return NextResponse.json({ error: 'Élève introuvable ou accès non autorisé' }, { status: 403 });

    const existingEnrollment = await prisma.enrollment.findUnique({
      where: { studentId_academicYearId: { studentId, academicYearId } }
    });
    if (existingEnrollment) {
      return NextResponse.json({ error: 'Cet élève est déjà inscrit pour cette année académique' }, { status: 400 });
    }

    // ── Transaction atomique : inscription + facture auto ────────────
    const result = await prisma.$transaction(async (tx) => {
      const enrollment = await tx.enrollment.create({
        data: { studentId, classroomId, academicYearId },
        include: { student: true, classroom: true, academicYear: true }
      });

      const tuitionAmount = Number(body.tuitionAmount ?? 0);
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      let invoice = null;
      if (tuitionAmount > 0) {
        const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
        invoice = await tx.invoice.create({
          data: {
            tenantId: session.tenantId,
            studentId,
            invoiceNumber,
            title: `Frais de scolarité — ${academicYear?.name ?? 'Année en cours'} — ${classroom.name}`,
            type: 'TUITION',
            amount: tuitionAmount,
            status: 'UNPAID',
            dueDate,
          }
        });
      }

      return { enrollment, invoice };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('[ENROLLMENTS POST]', error.message);
    return NextResponse.json({ error: 'Erreur lors de l\'inscription' }, { status: 400 });
  }
}
