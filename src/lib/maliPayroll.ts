/**
 * ================================================================
 * MOTEUR DE CALCUL DE PAIE - CONFORME DROIT MALIEN (V2.0 PRO)
 * ================================================================
 * Sources légales :
 *  - Code du Travail du Mali (Loi N°92-020)
 *  - Code Général des Impôts (CGI) du Mali — Art. 118 (ITS)
 *  - Décret INPS & AMO (Taux 2024-2025)
 * ================================================================
 */

export const MALI_RATES = {
  INPS_EMPLOYEE:   0.0360,    // 3.6% (Taux global fréquent)
  INPS_EMPLOYER:   0.1540,    // 15.4% (Taux global fréquent)
  INPS_CEILING:    500_000,   
  AMO_EMPLOYEE:    0.0150,    // 1.5%
  AMO_EMPLOYER:    0.0450,    // 4.5%
  SMIG:            45_000,
} as const;

/** 
 * Barème ITS Progressif - Art. 118 CGI Mali 
 * Tranches mensuelles standards
 */
const ITS_BRACKETS = [
  { min: 0,        max: 25_000,   rate: 0.00 },
  { min: 25_001,   max: 50_000,   rate: 0.05 },
  { min: 50_001,   max: 250_000,  rate: 0.12 },
  { min: 250_001,  max: 500_000,  rate: 0.18 },
  { min: 500_001,  max: 1_000_000, rate: 0.26 },
  { min: 1_000_001, max: Infinity,   rate: 0.37 },
] as const;

export interface MaliPayrollInput {
  baseSalary: number;
  taxableBonuses?: number;
  nonTaxableBonuses?: number;
  numberOfChildren?: number;
  isMarried?: boolean;
  hireDate?: string; // Pour calcul automatique de l'ancienneté
  calculationDate?: string;
}

export interface MaliPayrollResult {
  baseSalary:           number;
  seniorityBonus:       number;
  taxableBonuses:       number;
  nonTaxableBonuses:    number;
  grossSalary:          number;
  inpsEmployee:         number;
  amoEmployee:          number;
  totalDeductions:      number;
  fiscalBase:           number;
  itsBeforeReduction:   number;
  itsReduction:         number;
  its:                  number;
  netSalary:            number;
  inpsEmployer:         number;
  amoEmployer:          number;
  totalEmployerCharges: number;
  totalEmployerCost:    number;
  lines: PayslipLine[];
  isAboveSMIG:          boolean;
  alerts:               string[];
}

export interface PayslipLine {
  label: string;
  base?: number;
  rate?: string;
  amount: number;
  type: 'EARNING' | 'DEDUCTION' | 'EMPLOYER' | 'TOTAL' | 'SEPARATOR';
}

/**
 * Calcul de l'ancienneté (Code du Travail Malien)
 * Généralement : 3% après 3 ans, puis 1% par année supplémentaire.
 */
export function calculateSeniorityBonus(baseSalary: number, hireDate: string, refDateStr?: string): number {
  if (!hireDate) return 0;
  
  const start = new Date(hireDate);
  const ref   = refDateStr ? new Date(refDateStr) : new Date();
  
  let years = ref.getFullYear() - start.getFullYear();
  const m = ref.getMonth() - start.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < start.getDate())) {
    years--;
  }

  if (years < 3) return 0;
  const rate = 0.03 + (years - 3) * 0.01;
  return Math.round(baseSalary * Math.min(rate, 0.30)); // Plafonné à 30% souvent
}

/**
 * Calcule l'ITS avec réduction pour charges de famille
 */
export function calculateProfessionalITS(fiscalBase: number, isMarried: boolean, childrenCount: number): { before: number, reduction: number, final: number } {
  let its = 0;
  let baseRemaining = Math.max(0, fiscalBase);

  // 1. Calcul de l'impôt brut par tranches
  for (const bracket of ITS_BRACKETS) {
    if (baseRemaining <= 0) break;
    const bracketSize = bracket.max === Infinity
      ? baseRemaining
      : Math.max(0, bracket.max - bracket.min + 1);
    
    if (fiscalBase > bracket.min) {
        const taxableInBracket = Math.min(bracketSize, fiscalBase - bracket.min);
        its += taxableInBracket * bracket.rate;
    }
  }

  // 2. Abattement pour charges de famille (Simulation système Mali "Parts")
  // Marié = 10%, par enfant = 5% (courant dans les conventions d'entreprise au Mali)
  let reductionRate = 0;
  if (isMarried) reductionRate += 0.10;
  reductionRate += Math.min(childrenCount * 0.05, 0.40); // Plafond total abattement à 50% souvent

  const reduction = its * reductionRate;
  const final = Math.max(0, its - reduction);

  return { 
    before: Math.round(its), 
    reduction: Math.round(reduction), 
    final: Math.round(final) 
  };
}

export function calculateMaliPayroll(input: MaliPayrollInput): MaliPayrollResult {
  const baseSalary        = Math.round(input.baseSalary ?? 0);
  const taxableBonuses    = Math.round(input.taxableBonuses ?? 0);
  const nonTaxableBonuses = Math.round(input.nonTaxableBonuses ?? 0);
  const childrenCount     = input.numberOfChildren ?? 0;
  const isMarried         = input.isMarried ?? false;

  const seniorityBonus = input.hireDate ? calculateSeniorityBonus(baseSalary, input.hireDate, input.calculationDate) : 0;
  const grossSalary    = baseSalary + seniorityBonus + taxableBonuses;

  // Cotisations salariales
  const inpsBase    = Math.min(grossSalary, MALI_RATES.INPS_CEILING);
  const inpsEmployee = Math.round(inpsBase * MALI_RATES.INPS_EMPLOYEE);
  const amoEmployee = Math.round(grossSalary * MALI_RATES.AMO_EMPLOYEE);
  const totalDeductions = inpsEmployee + amoEmployee;

  // Fiscalité (ITS)
  const fiscalBase = Math.max(0, grossSalary - inpsEmployee);
  const itsCalculation = calculateProfessionalITS(fiscalBase, isMarried, childrenCount);
  const its = itsCalculation.final;

  // Calcul Final
  const netSalary = Math.round(grossSalary + nonTaxableBonuses - totalDeductions - its);

  // Charges Patronales
  const inpsEmployer = Math.round(inpsBase * MALI_RATES.INPS_EMPLOYER);
  const amoEmployer  = Math.round(grossSalary * MALI_RATES.AMO_EMPLOYER);
  const totalEmployerCharges = inpsEmployer + amoEmployer;
  const totalEmployerCost    = grossSalary + nonTaxableBonuses + totalEmployerCharges;

  const alerts: string[] = [];
  if (baseSalary < MALI_RATES.SMIG) alerts.push("⚠️ Salaire inférieur au SMIG (45 000 XOF).");

  const lines: PayslipLine[] = [
    { label: 'Salaire de Base', amount: baseSalary, type: 'EARNING' },
    ...(seniorityBonus > 0 ? [{ label: `Prime d'Ancienneté`, amount: seniorityBonus, type: 'EARNING' as const }] : []),
    ...(taxableBonuses > 0 ? [{ label: 'Primes Imposables', amount: taxableBonuses, type: 'EARNING' as const }] : []),
    ...(nonTaxableBonuses > 0 ? [{ label: 'Indemnités (Transport/Logement)', amount: nonTaxableBonuses, type: 'EARNING' as const }] : []),
    { label: 'SALAIRE BRUT', amount: grossSalary, type: 'TOTAL' },
    { label: '', amount: 0, type: 'SEPARATOR' },
    { label: 'INPS (Part Salariale)', rate: '3.60%', amount: -inpsEmployee, type: 'DEDUCTION' },
    { label: 'AMO (Part Salariale)', rate: '1.50%', amount: -amoEmployee, type: 'DEDUCTION' },
    { label: `ITS (Après abatt. ${childrenCount} enf.)`, amount: -its, type: 'DEDUCTION' },
    { label: 'NET À PAYER', amount: netSalary, type: 'TOTAL' },
    { label: '', amount: 0, type: 'SEPARATOR' },
    { label: 'Charges Patronales Total', amount: totalEmployerCharges, type: 'EMPLOYER' },
    { label: 'COÛT TOTAL ÉTABLISSEMENT', amount: totalEmployerCost, type: 'TOTAL' },
  ];

  return {
    baseSalary, seniorityBonus, taxableBonuses, nonTaxableBonuses,
    grossSalary, inpsEmployee, amoEmployee, totalDeductions,
    fiscalBase, itsBeforeReduction: itsCalculation.before,
    itsReduction: itsCalculation.reduction, its, netSalary,
    inpsEmployer, amoEmployer, totalEmployerCharges, totalEmployerCost,
    lines, isAboveSMIG: baseSalary >= MALI_RATES.SMIG, alerts
  };
}

export const formatXOF = (amount: number): string =>
  `${Math.round(amount).toLocaleString('fr-FR')} FCFA`;
