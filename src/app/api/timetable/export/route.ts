import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import * as xlsx from 'xlsx';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const timetables = await prisma.timetable.findMany({
      where: { tenantId: session.tenantId },
      include: {
        classroom: { select: { name: true } },
        subject: { select: { name: true, code: true } },
        teacher: { select: { firstName: true, lastName: true } }
      },
      orderBy: [
        { classroom: { name: 'asc' } },
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    });

    // Map to Excel format
    const excelData = timetables.map(t => ({
      'Classe': t.classroom.name,
      'Jour (1=Lun...7=Dim)': t.dayOfWeek,
      'Heure Début': t.startTime,
      'Heure Fin': t.endTime,
      'Matière': t.subject.name,
      'Enseignant': `${t.teacher.firstName} ${t.teacher.lastName}`.trim(),
    }));

    // If no data, provide an empty template
    if (excelData.length === 0) {
        excelData.push({
            'Classe': 'Exemple: 6ème A',
            'Jour (1=Lun...7=Dim)': 1,
            'Heure Début': '08:00',
            'Heure Fin': '10:00',
            'Matière': 'Mathématiques',
            'Enseignant': 'Jean Dupont'
        });
    }

    const worksheet = xlsx.utils.json_to_sheet(excelData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'EmploisDuTemps');

    // Widen columns for better readability
    const wscols = [
      { wch: 15 }, // Classe
      { wch: 20 }, // Jour
      { wch: 15 }, // Heure Début
      { wch: 15 }, // Heure Fin
      { wch: 30 }, // Matière
      { wch: 30 }, // Enseignant
    ];
    worksheet['!cols'] = wscols;

    const buf = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="emplois_du_temps.xlsx"'
      }
    });

  } catch (error) {
    console.error('[TIMETABLE EXPORT]', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Erreur interne du serveur lors de l\'exportation' }, { status: 500 });
  }
}
