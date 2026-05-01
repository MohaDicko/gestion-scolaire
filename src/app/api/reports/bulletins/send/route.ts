import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendReportCardEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { bulletins, trimestreLabel } = await request.json();

    if (!bulletins || !Array.isArray(bulletins)) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }

    // On récupère les emails des parents pour chaque élève
    const results = await Promise.all(bulletins.map(async (b) => {
      const student = await prisma.student.findUnique({
        where: { id: b.studentId },
        select: { parentEmail: true }
      });

      if (student?.parentEmail) {
        return sendReportCardEmail(
          student.parentEmail,
          b.studentName,
          b.generalAverage,
          b.rank,
          trimestreLabel
        );
      }
      return { success: false, error: 'Email parent non trouvé' };
    }));

    const successCount = results.filter(r => r.success).length;

    return NextResponse.json({ 
      success: true, 
      sent: successCount, 
      total: bulletins.length 
    });

  } catch (error) {
    console.error('Erreur lors de l\'envoi des bulletins:', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
