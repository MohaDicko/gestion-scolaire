import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import * as xlsx from 'xlsx';

// Parse time like "7H15", "7h15", "07:15", "5h30"
function parseTime(timeStr: string): string | null {
  const s = (timeStr || '').toString().trim().replace(/\s/g, '');
  // Format "7h15" or "7H15"
  const hMatch = s.match(/^(\d{1,2})[Hh](\d{2})$/);
  if (hMatch) return `${hMatch[1].padStart(2, '0')}:${hMatch[2]}`;
  // Format "7:15" or "07:15"
  const colonMatch = s.match(/^(\d{1,2}):(\d{2})$/);
  if (colonMatch) return `${colonMatch[1].padStart(2, '0')}:${colonMatch[2]}`;
  return null;
}

// Parse time range like "7H15-9H15" or "7H15 - 9H15"
function parseTimeRange(rangeStr: string): { start: string; end: string } | null {
  const s = (rangeStr || '').toString().trim();
  // Match something like "7H15-9H15" or "7h15 - 9h15"
  const match = s.match(/(\d{1,2}[Hh:]\d{2})\s*[-–—]\s*(\d{1,2}[Hh:]\d{2})/);
  if (!match) return null;
  const start = parseTime(match[1]);
  const end = parseTime(match[2]);
  if (!start || !end) return null;
  return { start, end };
}

// Normalize text: remove newlines, multiple spaces
function normalizeText(text: string): string {
  return text.replace(/[\r\n]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
}

// Clean cell text: remove "Module X:" prefix
function cleanCellText(text: string): string {
  return normalizeText(text)
    .replace(/^module\s+\d+\s*[:.]?\s*/i, '')
    .replace(/^\d+\s*[:.]?\s*/i, '')
    .trim();
}

// Find employee name at the END of cell text (1-4 words)
function extractTeacherAndSubject(
  rawText: string,
  empMap: Map<string, string>,
  lastNameMap: Map<string, string>
): { employeeId: string; subjectText: string } | null {
  const text = cleanCellText(rawText);
  const words = text.split(/\s+/).filter(Boolean);

  // Try 1, 2, 3, 4 words from the end → check against full name map
  for (let n = Math.min(4, words.length); n >= 1; n--) {
    const potentialName = words.slice(words.length - n).join(' ').toLowerCase();
    const employeeId = empMap.get(potentialName);
    if (employeeId) {
      const subjectText = words.slice(0, words.length - n).join(' ').trim();
      return { employeeId, subjectText };
    }
  }

  // Fallback: try last name only match
  if (words.length > 0) {
    const lastName = words[words.length - 1].toLowerCase();
    const employeeId = lastNameMap.get(lastName);
    if (employeeId) {
      const subjectText = words.slice(0, words.length - 1).join(' ').trim();
      return { employeeId, subjectText };
    }
  }

  return null;
}

// Detect grid format: find the row containing day names
function detectDayHeaderRow(rows: any[][]): number {
  const dayNames = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  for (let r = 0; r < Math.min(25, rows.length); r++) {
    const row = rows[r] || [];
    const rowText = row.map((c: any) => (c || '').toString().toLowerCase());
    const dayCount = dayNames.filter(d => rowText.some((c: string) => c.trim() === d)).length;
    if (dayCount >= 4) return r;
  }
  return -1;
}

// Try to extract class name from header rows
function extractClassName(rows: any[][], upToRow: number): string | null {
  for (let r = 0; r <= upToRow; r++) {
    const row = rows[r] || [];
    for (const cell of row) {
      const text = (cell || '').toString();
      // Look for "CLASSE X" pattern
      const match = text.match(/CLASSE\s+(.{3,60}?)(?:\s{3,}|$)/i);
      if (match) return match[1].trim();
    }
  }
  return null;
}

// Find subject by fuzzy matching
function findSubjectId(subjectText: string, subjectEntries: Array<[string, string]>): string | null {
  const clean = subjectText.toLowerCase().trim();
  for (let i = 0; i < subjectEntries.length; i++) {
    const dbName = subjectEntries[i][0];
    const id = subjectEntries[i][1];
    if (clean === dbName || clean.includes(dbName) || dbName.includes(clean)) return id;
  }
  return null;
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });

    const buffer = await file.arrayBuffer();
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    if (!workbook.SheetNames.length) {
      return NextResponse.json({ error: 'Fichier Excel invalide ou vide' }, { status: 400 });
    }

    // Fetch all DB references
    const [classrooms, subjects, employees] = await Promise.all([
      prisma.classroom.findMany({ where: { tenantId: session.tenantId } }),
      prisma.subject.findMany({ where: { tenantId: session.tenantId } }),
      prisma.employee.findMany({ where: { tenantId: session.tenantId } }),
    ]);

    const classMap = new Map(classrooms.map(c => [c.name.trim().toLowerCase(), c.id]));
    const subjectEntries: Array<[string, string]> = subjects.map(s => [s.name.trim().toLowerCase(), s.id] as [string, string]);
    const subjectMap = new Map(subjectEntries);
    const empMap = new Map(employees.map(e => [`${e.firstName} ${e.lastName}`.trim().toLowerCase(), e.id]));
    const lastNameMap = new Map(employees.map(e => [e.lastName.trim().toLowerCase(), e.id]));
    // Pre-compute classMap entries for iteration
    const classEntries: Array<[string, string]> = classrooms.map(c => [c.name.trim().toLowerCase(), c.id] as [string, string]);
    // Pre-compute dayColMap entries helper
    const getDayColEntries = (m: {[k: number]: number}): Array<[string, number]> => Object.keys(m).map(k => [k, m[parseInt(k)]] as [string, number]);

    const recordsToInsert: any[] = [];
    const classesProcessed = new Set<string>();
    const missingReferences: string[] = [];

    const dayNames = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      // Read raw rows (with header: 1 means array of arrays)
      const rows: any[][] = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];

      // --- Try to detect flat format (has "Classe" header in first row) ---
      const firstRowFlat = (rows[0] || []).map((c: any) => (c || '').toString().toLowerCase());
      const isFlat = firstRowFlat.some((h: string) => h.trim() === 'classe');

      if (isFlat) {
        // FLAT FORMAT
        const flatData = xlsx.utils.sheet_to_json<any>(worksheet);
        for (let index = 0; index < flatData.length; index++) {
          const row = flatData[index];
          const className = (row['Classe'] || row['CLASSE'] || '').toString().trim();
          const subjectName = (row['Matière'] || row['Matiere'] || row['MATIERE'] || '').toString().trim();
          const teacherName = (row['Enseignant'] || row['ENSEIGNANT'] || '').toString().trim();
          const dayStr = row['Jour (1=Lun...7=Dim)'] ?? row['Jour'] ?? row['JOUR'];
          const startTime = (row['Heure Début'] || row['Heure Debut'] || '').toString().trim();
          const endTime = (row['Heure Fin'] || row['Heure_Fin'] || '').toString().trim();

          if (!className && !subjectName && !teacherName) continue;

          const missing: string[] = [];
          if (!className) missing.push('Classe');
          if (!subjectName) missing.push('Matière');
          if (!teacherName) missing.push('Enseignant');
          if (!dayStr) missing.push('Jour');
          if (!startTime) missing.push('Heure Début');
          if (!endTime) missing.push('Heure Fin');
          if (missing.length > 0) {
            missingReferences.push(`[${sheetName}] Ligne ${index + 2}: Champs manquants: ${missing.join(', ')}`);
            continue;
          }

          const classroomId = classMap.get(className.toLowerCase());
          const subjectId = subjectMap.get(subjectName.toLowerCase());
          const employeeId = empMap.get(teacherName.toLowerCase());
          const dayOfWeek = parseInt(String(dayStr), 10);

          if (!classroomId) missingReferences.push(`[${sheetName}] L${index + 2}: Classe "${className}" introuvable.`);
          if (!subjectId) missingReferences.push(`[${sheetName}] L${index + 2}: Matière "${subjectName}" introuvable.`);
          if (!employeeId) missingReferences.push(`[${sheetName}] L${index + 2}: Enseignant "${teacherName}" introuvable.`);
          if (isNaN(dayOfWeek) || dayOfWeek < 1 || dayOfWeek > 7) missingReferences.push(`[${sheetName}] L${index + 2}: Jour invalide.`);

          if (classroomId && subjectId && employeeId && !isNaN(dayOfWeek)) {
            classesProcessed.add(classroomId);
            recordsToInsert.push({ tenantId: session.tenantId, classroomId, subjectId, employeeId, dayOfWeek, startTime, endTime });
          }
        }
        continue;
      }

      // --- GRID FORMAT (visual timetable like the school model) ---
      const headerRowIndex = detectDayHeaderRow(rows);
      if (headerRowIndex === -1) {
        missingReferences.push(`Feuille "${sheetName}": Format non reconnu (ni liste ni grille avec jours).`);
        continue;
      }

      // Map column indices to day numbers
      const dayColMap: { [col: number]: number } = {};
      const headerRow = rows[headerRowIndex] || [];
      for (let col = 0; col < headerRow.length; col++) {
        const cell = (headerRow[col] || '').toString().toLowerCase().trim();
        const dayIdx = dayNames.indexOf(cell);
        if (dayIdx >= 0) dayColMap[col] = dayIdx + 1; // 1=Lundi, 6=Samedi
      }

      if (Object.keys(dayColMap).length === 0) {
        missingReferences.push(`Feuille "${sheetName}": Aucun jour trouvé dans la ligne d'en-tête.`);
        continue;
      }

      // Get class name from header rows or sheet name
      let className = sheetName.trim();
      const headerClassName = extractClassName(rows, headerRowIndex);
      if (headerClassName) className = headerClassName;

      const classroomId = classMap.get(className.toLowerCase());
      if (!classroomId) {
        // Try to match by partial name
        let foundId: string | undefined;
        for (let ci = 0; ci < classEntries.length; ci++) {
          const dbName = classEntries[ci][0];
          const id = classEntries[ci][1];
          if (className.toLowerCase().includes(dbName) || dbName.includes(className.toLowerCase())) {
            foundId = id;
            break;
          }
        }
        if (!foundId) {
          missingReferences.push(
            `Feuille "${sheetName}": Classe "${className}" introuvable dans le système.\n` +
            `Classes disponibles: ${classrooms.map(c => c.name).join(', ')}`
          );
          continue;
        }
        classesProcessed.add(foundId!);
        // Use foundId below
        const resolvedClassId = foundId!;

        // Parse data rows for this sheet (with resolved class)
        for (let r = headerRowIndex + 1; r < rows.length; r++) {
          const row = rows[r] || [];
          const firstCell = (row[0] || '').toString().trim();
          const timeRange = parseTimeRange(firstCell);
          if (!timeRange) continue;
          const { start: startTime, end: endTime } = timeRange;

          for (let di = 0; di < getDayColEntries(dayColMap).length; di++) {
            const colStr = getDayColEntries(dayColMap)[di][0];
            const dayOfWeek = getDayColEntries(dayColMap)[di][1];
            const col = parseInt(colStr);
            const cellText = normalizeText((row[col] || '').toString());
            if (!cellText || /^(recreation|pause|repas|après-midi|apres.midi|midi|am|fm)$/i.test(cellText)) continue;

            const extracted = extractTeacherAndSubject(cellText, empMap, lastNameMap);
            if (!extracted) {
              missingReferences.push(`[${sheetName}] ${firstCell} Jour${dayOfWeek}: Enseignant introuvable dans "${cellText.substring(0, 50)}"`);
              continue;
            }

            const { employeeId, subjectText } = extracted;
            const subjectId = findSubjectId(subjectText, subjectEntries);
            if (!subjectId) {
              missingReferences.push(`[${sheetName}] ${firstCell} Jour${dayOfWeek}: Matière "${subjectText}" introuvable.`);
              continue;
            }

            recordsToInsert.push({ tenantId: session.tenantId, classroomId: resolvedClassId, subjectId, employeeId, dayOfWeek, startTime, endTime });
          }
        }
        continue;
      }

      classesProcessed.add(classroomId);

      // Parse data rows
      for (let r = headerRowIndex + 1; r < rows.length; r++) {
        const row = rows[r] || [];
        const firstCell = (row[0] || '').toString().trim();
        const timeRange = parseTimeRange(firstCell);
        if (!timeRange) continue;
        const { start: startTime, end: endTime } = timeRange;

        const dayColEntries = getDayColEntries(dayColMap);
        for (let di = 0; di < dayColEntries.length; di++) {
          const colStr = dayColEntries[di][0];
          const dayOfWeek = dayColEntries[di][1];
          const col = parseInt(colStr);
          const cellText = normalizeText((row[col] || '').toString());
          if (!cellText) continue;
          if (/^(recreation|pause|repas|après-midi|apres.midi|midi|matin|am|pm|fm)$/i.test(cellText)) continue;

          const extracted = extractTeacherAndSubject(cellText, empMap, lastNameMap);
          if (!extracted) {
            missingReferences.push(`[${sheetName}] ${firstCell} Jour${dayOfWeek}: Enseignant introuvable dans "${cellText.substring(0, 50)}"`);
            continue;
          }

          const { employeeId, subjectText } = extracted;
          const subjectId = findSubjectId(subjectText, subjectEntries);
          if (!subjectId) {
            missingReferences.push(`[${sheetName}] ${firstCell} Jour${dayOfWeek}: Matière "${subjectText}" introuvable. Disponibles: ${subjects.slice(0, 3).map(s => s.name).join(', ')}...`);
            continue;
          }

          recordsToInsert.push({ tenantId: session.tenantId, classroomId, subjectId, employeeId, dayOfWeek, startTime, endTime });
        }
      }
    }

    // If there are errors, return them all (don't import partial data)
    if (missingReferences.length > 0) {
      return NextResponse.json({
        error: `${missingReferences.length} problème(s) détecté(s) dans le fichier.`,
        details: missingReferences.slice(0, 20)
      }, { status: 400 });
    }

    if (recordsToInsert.length === 0) {
      return NextResponse.json({ error: 'Aucun créneau valide trouvé dans le fichier.' }, { status: 400 });
    }

    // Perform DB transaction
    await prisma.$transaction(async (tx) => {
      const ids = Array.from(classesProcessed);
      await tx.timetable.deleteMany({ where: { tenantId: session.tenantId, classroomId: { in: ids } } });
      await tx.timetable.createMany({ data: recordsToInsert });
    });

    return NextResponse.json({
      success: true,
      message: `✅ ${recordsToInsert.length} créneaux importés pour ${classesProcessed.size} classe(s).`
    }, { status: 200 });

  } catch (error: any) {
    console.error('[TIMETABLE IMPORT]', error.message);
    return NextResponse.json({ error: 'Erreur lors de l\'importation: ' + error.message }, { status: 500 });
  }
}
