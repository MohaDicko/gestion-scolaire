import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import * as xlsx from 'xlsx';

// Parse time like "7H15", "7h15", "07:15", "5h30"
function parseTime(timeStr: string): string | null {
  const s = (timeStr || '').toString().trim().replace(/\s/g, '');
  const hMatch = s.match(/^(\d{1,2})[Hh:](\d{2})$/);
  if (hMatch) return `${hMatch[1].padStart(2, '0')}:${hMatch[2]}`;
  const singleMatch = s.match(/^(\d{1,2})[Hh]$/);
  if (singleMatch) return `${singleMatch[1].padStart(2, '0')}:00`;
  return null;
}

// Parse time range like "7H15-9H15" or "7H15 - 9H15"
function parseTimeRange(rangeStr: string): { start: string; end: string } | null {
  const s = (rangeStr || '').toString().trim();
  const match = s.match(/(\d{1,2}[Hh:]?\d{0,2})\s*[-–—]\s*(\d{1,2}[Hh:]?\d{0,2})/);
  if (!match) return null;
  const start = parseTime(match[1]);
  const end = parseTime(match[2]);
  if (!start || !end) return null;
  return { start, end };
}

// Normalize text
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

// Extract teacher and subject from cell text
function extractTeacherAndSubject(
  rawText: string,
  empMap: Map<string, string>,
  lastNameMap: Map<string, string>,
  fullNameList: Array<{ name: string; id: string }>
): { employeeId: string | null; subjectText: string } {
  const text = cleanCellText(rawText);
  const words = text.split(/\s+/).filter(Boolean);

  // 1. Full name match anywhere in cell text
  for (const emp of fullNameList) {
    const empNameLower = emp.name.toLowerCase();
    if (text.toLowerCase().includes(empNameLower)) {
      const idx = text.toLowerCase().indexOf(empNameLower);
      const subjectText = text.substring(0, idx).trim();
      return { employeeId: emp.id, subjectText: subjectText || text };
    }
  }

  // 2. Last 1-4 words match
  for (let n = Math.min(4, words.length); n >= 1; n--) {
    const potentialName = words.slice(words.length - n).join(' ').toLowerCase();
    const employeeId = empMap.get(potentialName);
    if (employeeId) {
      const subjectText = words.slice(0, words.length - n).join(' ').trim();
      return { employeeId, subjectText: subjectText || text };
    }
  }

  // 3. Last name match
  for (let i = words.length - 1; i >= 0; i--) {
    const word = words[i].toLowerCase().replace(/[^a-z]/g, '');
    if (word.length >= 3) {
      const employeeId = lastNameMap.get(word);
      if (employeeId) {
        const subjectText = words.slice(0, i).join(' ').trim();
        return { employeeId, subjectText: subjectText || text };
      }
    }
  }

  return { employeeId: null, subjectText: text };
}

function detectDayHeaderRow(rows: any[][]): number {
  const dayNames = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  for (let r = 0; r < Math.min(25, rows.length); r++) {
    const row = rows[r] || [];
    const rowText = row.map((c: any) => (c || '').toString().toLowerCase());
    const dayCount = dayNames.filter(d => rowText.some((c: string) => c.trim().includes(d))).length;
    if (dayCount >= 3) return r;
  }
  return -1;
}

function extractClassName(rows: any[][], upToRow: number): string | null {
  for (let r = 0; r <= upToRow; r++) {
    const row = rows[r] || [];
    for (const cell of row) {
      const text = (cell || '').toString();
      const match = text.match(/CLASSE\s+(.{3,60}?)(?:\s{3,}|$)/i);
      if (match) return match[1].trim();
    }
  }
  return null;
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });

    const buffer = await file.arrayBuffer();
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    if (!workbook.SheetNames.length) {
      return NextResponse.json({ error: 'Fichier Excel invalide ou vide' }, { status: 400 });
    }

    const tenantId = session.tenantId;

    // Campus et Année académique
    let campus = await prisma.campus.findFirst({ where: { tenantId } });
    if (!campus) {
      const school = await prisma.school.findUnique({ where: { id: tenantId } });
      campus = await prisma.campus.create({
        data: {
          tenantId,
          name: 'Campus Principal',
          address: school?.address || 'Quartier Principal',
          city: school?.city || 'Gao',
          region: school?.city || 'Gao',
          phoneNumber: school?.phoneNumber || '+223 00 00 00 00',
        }
      });
    }

    let academicYear = await prisma.academicYear.findFirst({ where: { tenantId } });
    if (!academicYear) {
      academicYear = await prisma.academicYear.create({
        data: {
          tenantId,
          name: '2025-2026',
          startDate: new Date('2025-09-01'),
          endDate: new Date('2026-06-30'),
          isActive: true
        }
      });
    }

    // Récupérer données existantes
    const [allClassrooms, allSubjects, allEmployees] = await Promise.all([
      prisma.classroom.findMany({ where: { tenantId } }),
      prisma.subject.findMany({ where: { tenantId } }),
      prisma.employee.findMany({ where: { tenantId } }),
    ]);

    const classMap = new Map(allClassrooms.map(c => [c.name.trim().toLowerCase(), c]));
    const subjectMap = new Map(allSubjects.map(s => [s.name.trim().toLowerCase(), s]));
    const empMap = new Map(allEmployees.map(e => [`${e.firstName} ${e.lastName}`.trim().toLowerCase(), e.id]));
    const lastNameMap = new Map(allEmployees.map(e => [e.lastName.trim().toLowerCase(), e.id]));
    const fullNameList = allEmployees.map(e => ({ name: `${e.firstName} ${e.lastName}`.trim(), id: e.id }));

    const dayNames = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
    const recordsToInsert: any[] = [];
    const classesProcessed = new Set<string>();

    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const rows: any[][] = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];

      const headerRowIndex = detectDayHeaderRow(rows);
      if (headerRowIndex === -1) continue;

      const dayColMap: { [col: number]: number } = {};
      const headerRow = rows[headerRowIndex] || [];
      for (let col = 0; col < headerRow.length; col++) {
        const cell = (headerRow[col] || '').toString().toLowerCase().trim();
        const dayIdx = dayNames.findIndex(d => cell.includes(d));
        if (dayIdx >= 0) dayColMap[col] = dayIdx + 1;
      }

      if (Object.keys(dayColMap).length === 0) continue;

      let className = sheetName.trim();
      const extractedName = extractClassName(rows, headerRowIndex);
      if (extractedName) className = extractedName;

      // Récupérer ou créer la classe
      let classroom = classMap.get(className.toLowerCase());
      if (!classroom) {
        classroom = await prisma.classroom.create({
          data: {
            tenantId,
            campusId: campus.id,
            academicYearId: academicYear.id,
            name: className,
            level: className.includes('1') ? '1ere' : '2eme',
            maxCapacity: 30
          }
        });
        classMap.set(className.toLowerCase(), classroom);
      }

      classesProcessed.add(classroom.id);

      for (let r = headerRowIndex + 1; r < rows.length; r++) {
        const row = rows[r] || [];
        const firstCell = (row[0] || '').toString().trim();
        const timeRange = parseTimeRange(firstCell);
        if (!timeRange) continue;
        const { start: startTime, end: endTime } = timeRange;

        for (const [colStr, dayOfWeek] of Object.entries(dayColMap)) {
          const col = parseInt(colStr);
          const cellText = normalizeText((row[col] || '').toString());
          if (!cellText || /^(recreation|pause|repas|midi)$/i.test(cellText)) continue;

          const extracted = extractTeacherAndSubject(cellText, empMap, lastNameMap, fullNameList);
          let employeeId = extracted.employeeId;
          let subjectText = extracted.subjectText || cellText;

          // Assigner le premier employé par défaut si l'enseignant n'est pas identifié
          if (!employeeId && allEmployees.length > 0) {
            employeeId = allEmployees[0].id;
          }
          if (!employeeId) continue;

          // Récupérer ou créer la matière
          let subject = subjectMap.get(subjectText.toLowerCase());
          if (!subject) {
            subject = await prisma.subject.create({
              data: {
                tenantId,
                name: subjectText.slice(0, 60),
                code: `SUB-${Math.floor(100 + Math.random() * 900)}`
              }
            });
            subjectMap.set(subjectText.toLowerCase(), subject);
          }

          recordsToInsert.push({
            tenantId,
            classroomId: classroom.id,
            subjectId: subject.id,
            employeeId,
            dayOfWeek,
            startTime,
            endTime
          });
        }
      }
    }

    if (recordsToInsert.length === 0) {
      return NextResponse.json({ error: 'Aucun créneau d\'emploi du temps valide n\'a pu être extrait.' }, { status: 400 });
    }

    // Sauvegarde en base de données
    await prisma.$transaction(async (tx) => {
      const ids = Array.from(classesProcessed);
      await tx.timetable.deleteMany({ where: { tenantId, classroomId: { in: ids } } });
      await tx.timetable.createMany({ data: recordsToInsert });
    });

    return NextResponse.json({
      success: true,
      message: `✅ Importation réussie : ${recordsToInsert.length} créneaux enregistrés pour ${classesProcessed.size} classe(s).`
    }, { status: 200 });

  } catch (error: any) {
    console.error('[TIMETABLE IMPORT CRITICAL ERROR]', error.message);
    return NextResponse.json({ error: 'Erreur lors de l\'importation: ' + error.message }, { status: 500 });
  }
}
