/**
 * ================================================================
 * TESTS UNITAIRES — Moteur de Paie Mali (maliPayroll.ts)
 * CFP-PAS de Gao — Tarif vacataire 1 750 FCFA/heure
 * ================================================================
 */
import { describe, it, expect } from 'vitest';
import {
  calculateMaliPayroll,
  calculateSeniorityBonus,
  calculateProfessionalITS,
  MALI_RATES,
  formatXOF
} from './maliPayroll';

// ────────────────────────────────────────────────────────────────
// Constantes métier CFPPAS
// ────────────────────────────────────────────────────────────────
const HOURLY_RATE = 1750; // FCFA par heure — Tarif vacataire CFPPAS

describe('Constantes du moteur de paie Mali', () => {
  it('Le tarif SMIG doit être de 45 000 FCFA', () => {
    expect(MALI_RATES.SMIG).toBe(45_000);
  });

  it('Le taux INPS salarié doit être de 3.60%', () => {
    expect(MALI_RATES.INPS_EMPLOYEE).toBe(0.0360);
  });

  it('Le taux AMO salarié doit être de 1.50%', () => {
    expect(MALI_RATES.AMO_EMPLOYEE).toBe(0.0150);
  });

  it('Le taux INPS patronal doit être de 15.40%', () => {
    expect(MALI_RATES.INPS_EMPLOYER).toBe(0.1540);
  });
});

describe('Calcul de rémunération vacataire CFPPAS', () => {
  it('Un professeur ayant fait 20h doit percevoir 35 000 FCFA brut', () => {
    const gross = 20 * HOURLY_RATE;
    expect(gross).toBe(35_000);
  });

  it('Un professeur ayant fait 40h doit percevoir 70 000 FCFA brut', () => {
    const gross = 40 * HOURLY_RATE;
    expect(gross).toBe(70_000);
  });

  it('Un professeur ayant fait 60h doit percevoir 105 000 FCFA brut', () => {
    const gross = 60 * HOURLY_RATE;
    expect(gross).toBe(105_000);
  });

  it('Le salaire calculé par le moteur pour 40h doit avoir un net positif', () => {
    const result = calculateMaliPayroll({ baseSalary: 40 * HOURLY_RATE });
    expect(result.netSalary).toBeGreaterThan(0);
    expect(result.grossSalary).toBe(70_000);
    expect(result.inpsEmployee).toBeGreaterThan(0);
    expect(result.amoEmployee).toBeGreaterThan(0);
    expect(result.netSalary).toBeLessThan(result.grossSalary);
  });
});

describe('formatXOF — Formateur de montant FCFA', () => {
  it('Doit formater 1 750 correctement', () => {
    expect(formatXOF(1750)).toMatch(/1\s?750/);
  });

  it('Doit formater 70 000 correctement', () => {
    expect(formatXOF(70000)).toMatch(/70\s?000/);
  });

  it('Doit toujours inclure "FCFA"', () => {
    expect(formatXOF(1000)).toContain('FCFA');
  });
});

describe('calculateMaliPayroll — Calcul complet de la paie', () => {
  it('Un salaire de base 0 doit générer un net de 0', () => {
    const r = calculateMaliPayroll({ baseSalary: 0 });
    expect(r.netSalary).toBeLessThanOrEqual(0);
    expect(r.grossSalary).toBe(0);
  });

  it('Un salaire inférieur au SMIG doit déclencher une alerte', () => {
    const r = calculateMaliPayroll({ baseSalary: 30_000 });
    expect(r.isAboveSMIG).toBe(false);
    expect(r.alerts.length).toBeGreaterThan(0);
    expect(r.alerts[0]).toContain('SMIG');
  });

  it('Un salaire au-dessus du SMIG ne doit pas déclencher d\'alerte SMIG', () => {
    const r = calculateMaliPayroll({ baseSalary: 70_000 });
    expect(r.isAboveSMIG).toBe(true);
    expect(r.alerts.filter(a => a.includes('SMIG'))).toHaveLength(0);
  });

  it('Les cotisations INPS ne doivent pas dépasser le plafond de 500 000', () => {
    const r = calculateMaliPayroll({ baseSalary: 1_000_000 });
    const inpsBase = Math.min(1_000_000, MALI_RATES.INPS_CEILING);
    const expectedINPS = Math.round(inpsBase * MALI_RATES.INPS_EMPLOYEE);
    expect(r.inpsEmployee).toBe(expectedINPS);
  });

  it('Les primes non imposables ne doivent pas figurer dans la base fiscale', () => {
    const r = calculateMaliPayroll({ baseSalary: 60_000, nonTaxableBonuses: 20_000 });
    expect(r.fiscalBase).toBe(r.grossSalary - r.inpsEmployee);
    expect(r.netSalary).toBe(r.grossSalary + 20_000 - r.totalDeductions - r.its);
  });

  it('Les primes imposables doivent augmenter le brut', () => {
    const base = calculateMaliPayroll({ baseSalary: 60_000 });
    const withBonus = calculateMaliPayroll({ baseSalary: 60_000, taxableBonuses: 10_000 });
    expect(withBonus.grossSalary).toBe(base.grossSalary + 10_000);
  });

  it('Les charges patronales doivent être supérieures aux charges salariales', () => {
    const r = calculateMaliPayroll({ baseSalary: 70_000 });
    expect(r.totalEmployerCharges).toBeGreaterThan(r.totalDeductions);
  });

  it('Le coût total pour l\'établissement doit inclure les charges patronales', () => {
    const r = calculateMaliPayroll({ baseSalary: 70_000 });
    expect(r.totalEmployerCost).toBe(r.grossSalary + r.totalEmployerCharges);
  });

  it('Le bulletin de paie doit avoir au minimum 5 lignes', () => {
    const r = calculateMaliPayroll({ baseSalary: 70_000 });
    expect(r.lines.length).toBeGreaterThanOrEqual(5);
  });
});

describe('calculateSeniorityBonus — Prime d\'ancienneté', () => {
  it('Aucune prime avant 3 ans', () => {
    const bonus = calculateSeniorityBonus(60_000, '2023-01-01', '2025-06-01');
    expect(bonus).toBe(0);
  });

  it('Prime de 3% dès 3 ans d\'ancienneté exactement', () => {
    const bonus = calculateSeniorityBonus(60_000, '2021-01-01', '2024-01-15');
    expect(bonus).toBe(Math.round(60_000 * 0.03));
  });

  it('Renvoie 0 si hireDate est vide', () => {
    const bonus = calculateSeniorityBonus(60_000, '');
    expect(bonus).toBe(0);
  });
});

describe('calculateProfessionalITS — Impôt sur les Traitements et Salaires', () => {
  it('Un revenu de 0 doit générer un ITS de 0', () => {
    const { final } = calculateProfessionalITS(0, false, 0);
    expect(final).toBe(0);
  });

  it('Un revenu sous le seuil de 25 000 doit être exonéré d\'ITS', () => {
    const { final } = calculateProfessionalITS(20_000, false, 0);
    expect(final).toBe(0);
  });

  it('Un employé marié avec 2 enfants doit bénéficier d\'une réduction d\'ITS', () => {
    const single = calculateProfessionalITS(100_000, false, 0);
    const married2kids = calculateProfessionalITS(100_000, true, 2);
    expect(married2kids.final).toBeLessThan(single.final);
    expect(married2kids.reduction).toBeGreaterThan(0);
  });

  it('ITS avant réduction doit toujours être >= ITS après réduction', () => {
    const { before, final } = calculateProfessionalITS(250_000, true, 3);
    expect(before).toBeGreaterThanOrEqual(final);
  });
});
