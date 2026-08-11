import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import * as xlsx from 'xlsx';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    
    if (!workbook.SheetNames.length) {
      return NextResponse.json({ error: 'Fichier Excel invalide ou vide' }, { status: 400 });
    }

    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Parse to JSON
    const data = xlsx.utils.sheet_to_json<any>(worksheet);

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Le fichier ne contient aucune donnée' }, { status: 400 });
    }

    // 1. Fetch all existing references for the tenant to resolve IDs
    const [classrooms, subjects, employees] = await Promise.all([
      prisma.classroom.findMany({ where: { tenantId: session.tenantId } }),
      prisma.subject.findMany({ where: { tenantId: session.tenantId } }),
      prisma.employee.findMany({ where: { tenantId: session.tenantId, employeeType: 'TEACHER' } }),
    ]);

    // Fast lookups
    const classMap = new Map(classrooms.map(c => [c.name.trim().toLowerCase(), c.id]));
    const subjectMap = new Map(subjects.map(s => [s.name.trim().toLowerCase(), s.id]));
    const empMap = new Map(employees.map(e => [`${e.firstName} ${e.lastName}`.trim().toLowerCase(), e.id]));

    const recordsToInsert: any[] = [];
    const classesProcessed = new Set<string>();
    const missingReferences: string[] = [];

    // 2. Validate and build records
    for (let index = 0; index < data.length; index++) {
      const row = data[index];
      const className = (row['Classe'] || '').toString().trim();
      const subjectName = (row['Matière'] || '').toString().trim();
      const teacherName = (row['Enseignant'] || '').toString().trim();
      const dayStr = row['Jour (1=Lun...7=Dim)'];
      const startTime = (row['Heure Début'] || '').toString().trim();
      const endTime = (row['Heure Fin'] || '').toString().trim();

      if (!className || !subjectName || !teacherName || !dayStr || !startTime || !endTime) {
        // Skip completely empty rows
        if (!className && !subjectName) continue;
        missingReferences.push(`Ligne ${index + 2}: Champs obligatoires manquants.`);
        continue;
      }

      const classroomId = classMap.get(className.toLowerCase());
      const subjectId = subjectMap.get(subjectName.toLowerCase());
      const employeeId = empMap.get(teacherName.toLowerCase());
      const dayOfWeek = parseInt(dayStr, 10);

      if (!classroomId) missingReferences.push(`Ligne ${index + 2}: Classe '${className}' introuvable.`);
      if (!subjectId) missingReferences.push(`Ligne ${index + 2}: Matière '${subjectName}' introuvable.`);
      if (!employeeId) missingReferences.push(`Ligne ${index + 2}: Enseignant '${teacherName}' introuvable.`);
      if (isNaN(dayOfWeek) || dayOfWeek < 1 || dayOfWeek > 7) missingReferences.push(`Ligne ${index + 2}: Jour invalide (1-7 attendu).`);

      if (classroomId && subjectId && employeeId && !isNaN(dayOfWeek)) {
        classesProcessed.add(classroomId);
        recordsToInsert.push({
          tenantId: session.tenantId,
          classroomId,
          subjectId,
          employeeId,
          dayOfWeek,
          startTime,
          endTime
        });
      }
    }

    if (missingReferences.length > 0) {
      return NextResponse.json({ 
        error: 'Des erreurs de référence ont été trouvées. Veuillez corriger le fichier.', 
        details: missingReferences.slice(0, 10) // Only send first 10 to not overload the client
      }, { status: 400 });
    }

    if (recordsToInsert.length === 0) {
      return NextResponse.json({ error: 'Aucune donnée valide à importer' }, { status: 400 });
    }

    // 3. Perform the actual DB operations in a transaction
    await prisma.$transaction(async (tx) => {
      // Clear existing timetables ONLY for the classes that are present in the Excel file
      const classroomIdsArray = Array.from(classesProcessed);
      await tx.timetable.deleteMany({
        where: {
          tenantId: session.tenantId,
          classroomId: { in: classroomIdsArray }
        }
      });

      // Insert all new records
      await tx.timetable.createMany({
        data: recordsToInsert
      });
    });

    return NextResponse.json({ 
      success: true, 
      message: `${recordsToInsert.length} créneaux importés avec succès pour ${classesProcessed.size} classe(s).` 
    }, { status: 200 });

  } catch (error: any) {
    console.error('[TIMETABLE IMPORT]', error.message);
    return NextResponse.json({ error: 'Erreur lors de l\'importation: ' + error.message }, { status: 500 });
  }
}
