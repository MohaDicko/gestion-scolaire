/**
 * ================================================================
 * MOTEUR DE CALCUL DE PAIE - CONFORME DROIT MALIEN
 * ================================================================
 * Sources légales :
 *  - Code du Travail du Mali (Loi N°92-020 et amendements)
 *  - Code Général des Impôts (CGI) du Mali — Art. 118 (ITS)
 *  - Décret INPS : cotisation vieillesse 3.06% salarié / 7% patronal
 *  - Convention AMO/CANAM : 1.5% salarié / 4.5% patronal
 *  - SMIG Mali 2024 : 45 000 XOF/mois
 * ================================================================
 */

// ─── TAUX EN VIGUEUR (2024-2025) ────────────────────────────────

export const MALI_RATES = {
  // INPS (Institut National de Prévoyance Sociale)
  INPS_EMPLOYEE:   0.0306,    // 3.06% — Part salariale
  INPS_EMPLOYER:   0.0700,    // 7.00% — Part patronale
  INPS_CEILING:    500_000,   // Plafond mensuel XOF pour INPS

  // AMO/CANAM (Assurance Maladie Obligatoire)
  AMO_EMPLOYEE:    0.0150,    // 1.50% — Part salariale
  AMO_EMPLOYER:    0.0450,    // 4.50% — Part patronale
  
  // SMIG mensuel (Salaire Minimum Interprofessionnel Garanti)
  SMIG:            45_000,
} as const;

// ─── BARÈME ITS MENSUEL — Art. 118 CGI Mali ─────────────────────
// Impôt sur Traitements et Salaires (progressif)

const ITS_BRACKETS = [
  { min: 0,        max: 100_000,  rate: 0.00 },
  { min: 100_001,  max: 200_000,  rate: 0.10 },
  { min: 200_001,  max: 500_000,  rate: 0.20 },
  { min: 500_001,  max: Infinity, rate: 0.30 },
] as const;

// ─── TYPES ──────────────────────────────────────────────────────

export interface MaliPayrollInput {
  /** Salaire de base mensuel (XOF) */
  baseSalary: number;
  /** Primes et gratifications imposables (XOF) */
  taxableBonuses?: number;
  /** Indemnités non imposables : transport, logement, repas (XOF) */
  nonTaxableBonuses?: number;
  /** Nombre d'enfants à charge (réduction ITS) */
  numberOfChildren?: number;
}

export interface MaliPayrollResult {
  // ── Rémunération ──────────────────────────────────────────────
  baseSalary:           number;
  taxableBonuses:       number;
  nonTaxableBonuses:    number;
  grossSalary:          number;   // Brut imposable = base + primes imp.

  // ── Cotisations salariales ───────────────────────────────────
  inpsEmployee:         number;   // INPS part salariale (3.06%)
  amoEmployee:          number;   // AMO/CANAM part salariale (1.5%)
  totalDeductions:      number;   // Total retenues salariales

  // ── ITS ──────────────────────────────────────────────────────
  fiscalBase:           number;   // Assiette = brut - INPS employé
  its:                  number;   // ITS calculé selon barème progressif

  // ── Net à payer ───────────────────────────────────────────────
  netSalary:            number;

  // ── Charges patronales (info transparence) ────────────────────
  inpsEmployer:         number;   // INPS part patronale (7%)
  amoEmployer:          number;   // AMO part patronale (4.5%)
  totalEmployerCharges: number;
  totalEmployerCost:    number;   // Coût total employeur

  // ── Détails ligne par ligne (pour le bulletin) ────────────────
  lines: PayslipLine[];

  // ── Conformité ────────────────────────────────────────────────
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

// ─── MOTEUR ITS ──────────────────────────────────────────────────

/**
 * Calcule l'ITS selon le barème progressif malien
 * Appliqué sur l'assiette = (Brut imposable - INPS employé)
 */
export function calculateITS(fiscalBase: number): number {
  let its = 0;
  let baseRemaining = Math.max(0, fiscalBase);

  for (const bracket of ITS_BRACKETS) {
    if (baseRemaining <= 0) break;
    if (fiscalBase <= bracket.min) continue;

    const bracketSize = bracket.max === Infinity
      ? baseRemaining
      : Math.min(baseRemaining, bracket.max - bracket.min);

    its += bracketSize * bracket.rate;
    baseRemaining -= bracketSize;
  }

  return Math.round(its);
}

// ─── MOTEUR PRINCIPAL ─────────────────────────────────────────────

/**
 * Calcule la fiche de paie complète conforme au droit malien.
 */
export function calculateMaliPayroll(input: MaliPayrollInput): MaliPayrollResult {
  const baseSalary        = Math.round(input.baseSalary ?? 0);
  const taxableBonuses    = Math.round(input.taxableBonuses ?? 0);
  const nonTaxableBonuses = Math.round(input.nonTaxableBonuses ?? 0);
  const numberOfChildren  = input.numberOfChildren ?? 0;

  const alerts: string[] = [];

  // ── 1. Salaire brut imposable ────────────────────────────────
  const grossSalary = baseSalary + taxableBonuses;

  // ── 2. INPS Employé (plafonné à 500 000 XOF) ────────────────
  const inpsBase    = Math.min(grossSalary, MALI_RATES.INPS_CEILING);
  const inpsEmployee = Math.round(inpsBase * MALI_RATES.INPS_EMPLOYEE);

  // ── 3. AMO/CANAM Employé ────────────────────────────────────
  const amoEmployee = Math.round(grossSalary * MALI_RATES.AMO_EMPLOYEE);

  const totalDeductions = inpsEmployee + amoEmployee;

  // ── 4. Assiette ITS ─────────────────────────────────────────
  const fiscalBase = Math.max(0, grossSalary - inpsEmployee);

  // ── 5. ITS (barème progressif) ──────────────────────────────
  const its = calculateITS(fiscalBase);

  // ── 6. Net à payer ──────────────────────────────────────────
  const netSalary = Math.round(grossSalary + nonTaxableBonuses - totalDeductions - its);

  // ── 7. Charges patronales ────────────────────────────────────
  const inpsEmployerBase   = Math.min(grossSalary, MALI_RATES.INPS_CEILING);
  const inpsEmployer       = Math.round(inpsEmployerBase * MALI_RATES.INPS_EMPLOYER);
  const amoEmployer        = Math.round(grossSalary * MALI_RATES.AMO_EMPLOYER);
  const totalEmployerCharges = inpsEmployer + amoEmployer;
  const totalEmployerCost  = Math.round(grossSalary + nonTaxableBonuses + totalEmployerCharges);

  // ── Alertes conformité ───────────────────────────────────────
  const isAboveSMIG = baseSalary >= MALI_RATES.SMIG;
  if (!isAboveSMIG) {
    alerts.push(`⚠️ Salaire de base (${baseSalary.toLocaleString()} XOF) inférieur au SMIG (${MALI_RATES.SMIG.toLocaleString()} XOF) — Non conforme au Code du Travail.`);
  }
  if (netSalary < 0) {
    alerts.push('⚠️ Net à payer négatif — Vérifiez les paramètres de paie.');
  }

  // ── Lignes bulletin détaillé ─────────────────────────────────
  const lines: PayslipLine[] = [
    // Éléments gains
    { label: 'Salaire de Base',          amount: baseSalary,        type: 'EARNING' },
    ...(taxableBonuses > 0 ? [{ label: 'Primes et Gratifications', amount: taxableBonuses, type: 'EARNING' as const }] : []),
    ...(nonTaxableBonuses > 0 ? [{ label: 'Indemnités (non imposables)', amount: nonTaxableBonuses, type: 'EARNING' as const }] : []),
    { label: 'Salaire Brut Imposable',   amount: grossSalary,       type: 'TOTAL' },

    // Séparateur
    { label: '',                         amount: 0,                 type: 'SEPARATOR' },

    // Retenues salariales
    { label: 'INPS (3,06% × brut plafonné)',  base: inpsBase,  rate: '3,06%', amount: -inpsEmployee, type: 'DEDUCTION' },
    { label: 'AMO / CANAM (1,5% × brut)',     base: grossSalary, rate: '1,50%', amount: -amoEmployee,  type: 'DEDUCTION' },
    { label: 'ITS (Barème progressif)',        base: fiscalBase,  rate: '—',     amount: -its,          type: 'DEDUCTION' },
    { label: 'Total Retenues',           amount: -(totalDeductions + its), type: 'TOTAL' },

    // Séparateur
    { label: '',                         amount: 0,                 type: 'SEPARATOR' },

    // Net
    { label: 'NET À PAYER',              amount: netSalary,         type: 'TOTAL' },

    // Séparateur
    { label: '',                         amount: 0,                 type: 'SEPARATOR' },

    // Charges patronales (transparence) 
    { label: 'INPS Patronal (7%)',        base: inpsEmployerBase, rate: '7,00%', amount: inpsEmployer,  type: 'EMPLOYER' },
    { label: 'AMO Patronale (4,5%)',      base: grossSalary, rate: '4,50%', amount: amoEmployer,   type: 'EMPLOYER' },
    { label: 'Total Charges Patronales', amount: totalEmployerCharges, type: 'EMPLOYER' },
    { label: 'Coût Total Employeur',      amount: totalEmployerCost,   type: 'TOTAL' },
  ];

  return {
    baseSalary,
    taxableBonuses,
    nonTaxableBonuses,
    grossSalary,
    inpsEmployee,
    amoEmployee,
    totalDeductions,
    fiscalBase,
    its,
    netSalary,
    inpsEmployer,
    amoEmployer,
    totalEmployerCharges,
    totalEmployerCost,
    lines,
    isAboveSMIG,
    alerts,
  };
}

// ─── UTILITAIRES ────────────────────────────────────────────────

/** Formate un montant en XOF */
export const formatXOF = (amount: number): string =>
  `${Math.round(amount).toLocaleString('fr-FR')} XOF`;

/** Retourne la tranche ITS applicable */
export function getITSBracketLabel(fiscalBase: number): string {
  for (const bracket of ITS_BRACKETS) {
    if (fiscalBase <= bracket.max) {
      return `${(bracket.rate * 100).toFixed(0)}%`;
    }
  }
  return '30%';
}
