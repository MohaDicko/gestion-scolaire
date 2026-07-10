import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUniversal } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getSessionUniversal(request);
    
    // Vérification de la session et du rôle (doit être PARENT ou au moins avoir un email)
    if (!session || !session.tenantId || !session.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Récupérer les étudiants dont le "parentEmail" correspond à l'email du parent connecté
    const students = await prisma.student.findMany({
      where: {
        tenantId: session.tenantId,
        parentEmail: {
          equals: session.email,
          mode: 'insensitive' // Ignorer la casse pour plus de sécurité
        },
        isActive: true
      },
      include: {
        campus: true,
        enrollments: {
          include: {
            classroom: true,
            academicYear: true
          }
        },
        Invoice: {
          where: { status: 'UNPAID' },
          orderBy: { dueDate: 'asc' }
        },
        Grade: {
          orderBy: { createdAt: 'desc' },
          take: 3, // Les 3 dernières notes
          include: {
            subject: true
          }
        },
        Attendance: {
          where: { status: { not: 'PRESENT' } }, // Prendre les retards et absences
          orderBy: { date: 'desc' },
          take: 3
        }
      }
    });

    return NextResponse.json({ children: students });
  } catch (error: any) {
    console.error('[PARENT API ERROR]', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération des données.' }, { status: 500 });
  }
}
