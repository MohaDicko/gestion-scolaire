import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (session?.role !== 'SCHOOL_ADMIN' && session?.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tenantId = session.tenantId;

  try {
    const diagnostics = [];
    const baseWhere = tenantId ? { tenantId } : {};

    // 1. Students without active enrollment
    const orphanStudents = await prisma.student.count({
      where: {
        ...baseWhere,
        enrollments: { none: {} }
      }
    });
    diagnostics.push({
      code: 'ORPHAN_STUDENTS',
      label: 'Élèves sans inscription',
      count: orphanStudents,
      status: orphanStudents > 0 ? 'WARNING' : 'SAFE',
      description: 'Élèves enregistrés dans la base mais non rattachés à une classe pour l\'année scolaire en cours.'
    });

    // 2. Payslips with negative or zero net salary
    const criticalPayslips = await prisma.payslip.count({
      where: {
        ...baseWhere,
        netSalary: { lte: 0 }
      }
    });
    diagnostics.push({
      code: 'NEG_PAYSLIPS',
      label: 'Bulletins de paie critiques',
      count: criticalPayslips,
      status: criticalPayslips > 0 ? 'CRITICAL' : 'SAFE',
      description: 'Bulletins où le net à payer est inférieur ou égal à zéro (souvent dû à des retenues trop élevées).'
    });

    // 3. Teachers with possible timetable conflicts (simplified check)
    const timetableEntries = await prisma.timetable.findMany({
        where: baseWhere
    });
    
    let conflicts = 0;
    const teacherSlots = new Map();
    timetableEntries.forEach(entry => {
        const key = `${entry.employeeId}-${entry.dayOfWeek}-${entry.startTime}`;
        if (teacherSlots.has(key)) conflicts++;
        teacherSlots.set(key, true);
    });

    diagnostics.push({
      code: 'TIMETABLE_CONFLICTS',
      label: 'Conflits d\'emploi du temps',
      count: conflicts,
      status: conflicts > 0 ? 'WARNING' : 'SAFE',
      description: 'Enseignants affectés à plusieurs classes sur le même créneau horaire.'
    });

    // 4. Invoices overdue (Unpaid and past due date)
    const overdueInvoices = await prisma.invoice.count({
      where: {
        ...baseWhere,
        status: 'UNPAID',
        dueDate: { lt: new Date() }
      }
    });
    diagnostics.push({
      code: 'OVERDUE_INVOICES',
      label: 'Factures en souffrance',
      count: overdueInvoices,
      status: overdueInvoices > 10 ? 'WARNING' : 'SAFE',
      description: 'Factures impayées dont la date d\'échéance est dépassée.'
    });

    // 5. Missing Grades (Active students with 0 grades)
    const studentsWithNoGrades = await prisma.student.count({
        where: {
            ...baseWhere,
            Grade: { none: {} }
        }
    });
    diagnostics.push({
        code: 'MISSING_GRADES',
        label: 'Dossiers académiques vides',
        count: studentsWithNoGrades,
        status: studentsWithNoGrades > 5 ? 'WARNING' : 'SAFE',
        description: 'Élèves actifs n\'ayant aucune note enregistrée pour le trimestre en cours.'
    });

    return NextResponse.json(diagnostics);
  } catch (error) {
    console.error('[DIAGNOSTICS API]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
