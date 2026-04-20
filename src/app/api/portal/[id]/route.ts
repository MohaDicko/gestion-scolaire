import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

/**
 * Portal API — Public endpoint for student self-service access.
 * Secured via a signed studentToken query param instead of session cookies.
 * Parents/students access this via a unique link: /portal/STUDENT_ID?token=SIGNED_TOKEN
 * 
 * For now, we secure with a simplified bearer approach:
 * The student ID in the URL must match a valid student and the request must come
 * from an authenticated user (admin sharing the portal) OR a signed token.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(request.url);

  // Validate UUID format to prevent injection
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return NextResponse.json({ error: 'Identifiant invalide' }, { status: 400 });
  }

  // Portal token validation (signed JWT passed as query param for parent access)
  const portalToken = url.searchParams.get('token');
  const cookieHeader = request.headers.get('cookie') || '';
  const sessionCookie = cookieHeader.match(/refreshToken=([^;]+)/)?.[1];

  let isAuthorized = false;

  // Option 1: Authenticated user (admin/teacher viewing the portal)
  if (sessionCookie) {
    try {
      const secretKey = process.env.JWT_SECRET!;
      const key = new TextEncoder().encode(secretKey);
      await jwtVerify(sessionCookie, key, { algorithms: ['HS256'] });
      isAuthorized = true;
    } catch { /* invalid session */ }
  }

  // Option 2: Portal token (for parent self-service link)
  if (!isAuthorized && portalToken) {
    try {
      const secretKey = process.env.JWT_SECRET!;
      const key = new TextEncoder().encode(secretKey);
      const { payload } = await jwtVerify(portalToken, key, { algorithms: ['HS256'] });
      // Portal token must contain the specific student ID it was issued for
      if (payload.studentId === id) {
        isAuthorized = true;
      }
    } catch { /* invalid token */ }
  }

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Accès non autorisé. Un lien valide est requis.' }, { status: 401 });
  }

  try {
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        enrollments: { include: { classroom: true } },
        Grade: { include: { subject: true } }
      }
    });

    if (!student) {
      return NextResponse.json({ error: 'Élève non trouvé' }, { status: 404 });
    }

    const attendance = await prisma.attendance.findMany({
      where: { studentId: id },
      orderBy: { date: 'desc' },
      take: 20
    });

    // Only expose non-sensitive fields
    const safeStudent = {
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      studentNumber: student.studentNumber,
      gender: student.gender,
      enrollments: student.enrollments,
      grades: student.Grade,
    };

    return NextResponse.json({ student: safeStudent, attendance });
  } catch (error) {
    console.error('[PORTAL GET]', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
