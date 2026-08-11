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
    // NOTE: We fetch ALL employees regardless of type (teachers can have various types)
    const [classrooms, subjects, employees] = await Promise.all([
      prisma.classroom.findMany({ where: { tenantId: session.tenantId } }),
      prisma.subject.findMany({ where: { tenantId: session.tenantId } }),
      prisma.employee.findMany({ where: { tenantId: session.tenantId } }),
    ]);

    // Fast lookups (case-insensitive)
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
      const subjectName = (row['Matière'] || row['Matiere'] || row['MATIERE'] || '').toString().trim();
      const teacherName = (row['Enseignant'] || row['ENSEIGNANT'] || '').toString().trim();
      const dayStr = row['Jour (1=Lun...7=Dim)'] ?? row['Jour'] ?? row['JOUR'];
      const startTime = (row['Heure Début'] || row['Heure Debut'] || row['HEURE_DEBUT'] || row['Heure_Debut'] || '').toString().trim();
      const endTime = (row['Heure Fin'] || row['HEURE_FIN'] || row['Heure_Fin'] || '').toString().trim();

      // Skip completely empty rows
      if (!className && !subjectName && !teacherName) continue;

      // Report rows with missing fields
      if (!className || !subjectName || !teacherName || dayStr === undefined || dayStr === null || !startTime || !endTime) {
        const missing = [];
        if (!className) missing.push('Classe');
        if (!subjectName) missing.push('Matière');
        if (!teacherName) missing.push('Enseignant');
        if (dayStr === undefined || dayStr === null) missing.push('Jour');
        if (!startTime) missing.push('Heure Début');
        if (!endTime) missing.push('Heure Fin');
        missingReferences.push(`Ligne ${index + 2}: Champs manquants: ${missing.join(', ')}`);
        continue;
      }

      const classroomId = classMap.get(className.toLowerCase());
      const subjectId = subjectMap.get(subjectName.toLowerCase());
      const employeeId = empMap.get(teacherName.toLowerCase());
      const dayOfWeek = parseInt(String(dayStr), 10);

      if (!classroomId) missingReferences.push(`Ligne ${index + 2}: Classe "${className}" introuvable dans le système.`);
      if (!subjectId) missingReferences.push(`Ligne ${index + 2}: Matière "${subjectName}" introuvable dans le système.`);
      if (!employeeId) missingReferences.push(`Ligne ${index + 2}: Enseignant "${teacherName}" introuvable dans le système.`);
      if (isNaN(dayOfWeek) || dayOfWeek < 1 || dayOfWeek > 7) missingReferences.push(`Ligne ${index + 2}: Jour "${dayStr}" invalide (doit être 1=Lun à 7=Dim).`);

      if (classroomId && subjectId && employeeId && !isNaN(dayOfWeek) && dayOfWeek >= 1 && dayOfWeek <= 7) {
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
        error: `${missingReferences.length} erreur(s) trouvée(s) dans le fichier. Vérifiez que les noms correspondent exactement à ceux du système.`,
        details: missingReferences.slice(0, 15)
      }, { status: 400 });
    }

    if (recordsToInsert.length === 0) {
      return NextResponse.json({ error: 'Aucune donnée valide à importer. Vérifiez le format du fichier.' }, { status: 400 });
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
      message: `✅ ${recordsToInsert.length} créneaux importés avec succès pour ${classesProcessed.size} classe(s).` 
    }, { status: 200 });

  } catch (error: any) {
    console.error('[TIMETABLE IMPORT]', error.message);
    return NextResponse.json({ error: 'Erreur lors de l\'importation: ' + error.message }, { status: 500 });
  }
}
