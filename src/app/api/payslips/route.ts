import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { calculateMaliPayroll } from '@/lib/maliPayroll';
import { isFeatureAllowed } from '@/lib/plans';
import { logAudit } from '@/lib/audit';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const school = await prisma.school.findUnique({ where: { id: session.tenantId } });
  if (!school || !isFeatureAllowed(school.plan, 'hasHR')) {
    return NextResponse.json({ error: 'Le module Paie/RH n\'est pas inclus dans votre plan actuel.' }, { status: 403 });
  }

  const url = new URL(request.url);
  const employeeId = url.searchParams.get('employeeId');

  try {
    const payslips = await prisma.payslip.findMany({
      where: {
        tenantId: session.tenantId,
        ...(employeeId ? { employeeId } : {})
      },
      include: {
        employee: {
          select: { firstName: true, lastName: true, employeeNumber: true, employeeType: true }
        }
      },
      orderBy: { periodEnd: 'desc' }
    });
    return NextResponse.json(payslips);
  } catch (error) {
    console.error('[PAYSLIPS GET]', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const school = await prisma.school.findUnique({ where: { id: session.tenantId } });
  if (!school || !isFeatureAllowed(school.plan, 'hasHR')) {
    return NextResponse.json({ error: 'Le module Paie/RH n\'est pas inclus dans votre plan actuel.' }, { status: 403 });
  }

  if (!['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HR_MANAGER'].includes(session.role)) {
    return NextResponse.json({ error: 'Accès refusé — droits insuffisants' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      employeeId,
      periodStart,
      periodEnd,
      baseSalary,
      taxableBonuses = 0,
      nonTaxableBonuses = 0,
      numberOfChildren = 0,
      notes
    } = body;

    // ── Validation des champs obligatoires ─────────────────────
    if (!employeeId || !periodStart || !periodEnd || baseSalary === undefined) {
      return NextResponse.json({ 
        error: 'Champs obligatoires manquants : employeeId, periodStart, periodEnd, baseSalary' 
      }, { status: 400 });
    }

    const numBase = parseFloat(baseSalary);
    if (isNaN(numBase) || numBase < 0) {
      return NextResponse.json({ error: 'Salaire de base invalide' }, { status: 400 });
    }

    // ── Vérification appartenance tenant ───────────────────────
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, tenantId: session.tenantId }
    });
    if (!employee) {
      return NextResponse.json({ error: 'Employé introuvable ou accès non autorisé' }, { status: 403 });
    }

    // ── Calcul de paie selon le droit malien ───────────────────
    const payroll = calculateMaliPayroll({
      baseSalary: numBase,
      taxableBonuses: parseFloat(taxableBonuses) || 0,
      nonTaxableBonuses: parseFloat(nonTaxableBonuses) || 0,
      numberOfChildren: parseInt(numberOfChildren) || 0,
    });

    // ── Sauvegarde complète en base ────────────────────────────
    const payslip = await prisma.payslip.create({
      data: {
        tenantId: session.tenantId,
        employeeId,
        periodStart: new Date(periodStart),
        periodEnd:   new Date(periodEnd),

        // Rémunération
        baseSalary:         payroll.baseSalary,
        taxableBonuses:     payroll.taxableBonuses,
        nonTaxableBonuses:  payroll.nonTaxableBonuses,
        grossSalary:        payroll.grossSalary,

        // Cotisations salariales
        inpsEmployee:       payroll.inpsEmployee,
        amoEmployee:        payroll.amoEmployee,
        totalDeductions:    payroll.totalDeductions,

        // ITS
        fiscalBase:         payroll.fiscalBase,
        its:                payroll.its,

        // Net
        netSalary:          payroll.netSalary,

        // Charges patronales
        inpsEmployer:        payroll.inpsEmployer,
        amoEmployer:         payroll.amoEmployer,
        totalEmployerCharges: payroll.totalEmployerCharges,

        // Méta
        numberOfChildren,
        status: 'FINALIZED',
        notes,
      },
      include: {
        employee: { select: { firstName: true, lastName: true, employeeNumber: true } }
      }
    });

    // ── Enregistrement dans la piste d'audit Enterprise ────────
    await logAudit({
      action: 'CREATE',
      entityType: 'Payslip',
      entityId: payslip.id,
      description: `Génération fiche de paie pour l'employé ${employee.firstName} ${employee.lastName} (Net: ${payroll.netSalary} FCFA)`,
      request,
    });

    return NextResponse.json({
      payslip,
      maliBulletin: payroll,  // Renvoie aussi le détail pour affichage immédiat
      alerts: payroll.alerts,
    }, { status: 201 });

  } catch (error: any) {
    console.error('[PAYSLIPS POST]', error.message);
    return NextResponse.json({ error: error.message || 'Erreur création bulletin' }, { status: 400 });
  }
}
