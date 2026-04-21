import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { calculateClassBulletins, GradeInput } from '@/lib/grading';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const classroomId  = url.searchParams.get('classroomId');
  const academicYearId = url.searchParams.get('academicYearId');
  const trimestre    = parseInt(url.searchParams.get('trimestre') || '1', 10);

  if (!classroomId || !academicYearId) {
    return NextResponse.json({ error: 'classroomId et academicYearId sont requis' }, { status: 400 });
  }

  try {
    // 1. Récupérer toutes les notes de la classe pour ce trimestre
    const grades = await prisma.grade.findMany({
      where: {
        academicYearId,
        trimestre,
        student: {
          enrollments: {
            some: {
              classroomId,
              academicYearId
            }
          }
        }
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentNumber: true
          }
        },
        subject: {
          select: {
            id: true,
            name: true,
            coefficient: true
          }
        }
      }
    });

    if (grades.length === 0) {
      return NextResponse.json({ 
        message: 'Aucune donnée trouvée pour ce trimestre.',
        bulletins: [] 
      });
    }

    // 2. Transformer pour le moteur de calcul (Inclure ExamType)
    const formattedGrades: GradeInput[] = grades.map(g => ({
      studentId: g.studentId,
      studentName: `${g.student.firstName} ${g.student.lastName}`,
      studentNumber: g.student.studentNumber,
      subjectId: g.subjectId,
      subjectName: g.subject.name,
      coefficient: g.subject.coefficient,
      score: g.score,
      maxScore: g.maxScore,
      examType: g.examType as any, // CONTINUOUS, MIDTERM, FINAL
      trimestre: g.trimestre
    }));

    // 3. Calculer les bulletins (Modèle Lycée Pondéré)
    const bulletins = calculateClassBulletins(formattedGrades);

    return NextResponse.json({
      classroomId,
      academicYearId,
      trimestre,
      studentCount: bulletins.length,
      bulletins
    });

  } catch (error: any) {
    console.error('[REPORT BULLETIN GET]', error.message);
    return NextResponse.json({ error: 'Erreur lors du calcul des bulletins' }, { status: 500 });
  }
}
