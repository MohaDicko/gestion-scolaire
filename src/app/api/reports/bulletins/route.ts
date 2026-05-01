import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateClassBulletins, GradeInput } from '@/lib/grading';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const classroomId = searchParams.get('classroomId');
  const academicYearId = searchParams.get('academicYearId');
  const trimestre = parseInt(searchParams.get('trimestre') || '1');

  if (!classroomId || !academicYearId) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
  }

  try {
    // 1. Récupérer toutes les notes de la classe pour le trimestre donné
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
        student: true,
        subject: true
      }
    });

    if (grades.length === 0) {
      return NextResponse.json([]);
    }

    // 2. Transformer pour le moteur de calcul
    const input: GradeInput[] = grades.map(g => ({
      studentId: g.studentId,
      studentName: `${g.student.firstName} ${g.student.lastName}`,
      studentNumber: g.student.studentNumber,
      subjectId: g.subjectId,
      subjectName: g.subject.name,
      coefficient: g.subject.coefficient,
      score: g.score,
      maxScore: g.maxScore,
      examType: g.examType as any,
      trimestre: g.trimestre
    }));

    // 3. Calculer les bulletins (Moyennes, Rangs, Mentions)
    const bulletins = calculateClassBulletins(input);

    return NextResponse.json(bulletins);
  } catch (error) {
    console.error('Erreur lors de la génération des bulletins:', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
