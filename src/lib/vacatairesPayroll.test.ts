/**
 * ================================================================
 * TESTS UNITAIRES — Rémunération des Enseignants Vacataires CFPPAS
 * Tarification officielle : 1 750 FCFA / heure émargée
 * ================================================================
 */
import { describe, it, expect } from 'vitest';

const CFPPAS_HOURLY_RATE = 1750; // FCFA par heure émargée

interface LessonLogMock {
  title: string;
  hoursCount: number;
  status: 'COMPLETED' | 'ABSENT';
}

function calculateVacataireTotalPay(lessons: LessonLogMock[], rate: number = CFPPAS_HOURLY_RATE) {
  let executedHours = 0;
  let absentHours = 0;

  for (const l of lessons) {
    if (l.status === 'COMPLETED') {
      executedHours += l.hoursCount;
    } else if (l.status === 'ABSENT') {
      absentHours += (l.hoursCount > 0 ? l.hoursCount : 2);
    }
  }

  const gross = executedHours * rate;
  const deductions = 0;
  const net = gross - deductions;

  return {
    executedHours,
    absentHours,
    hourlyRate: rate,
    gross,
    deductions,
    net
  };
}

describe('Règles Métier — Paie des Vacataires CFPPAS', () => {
  it('Applique le taux conventionné officiel de 1 750 FCFA / heure', () => {
    expect(CFPPAS_HOURLY_RATE).toBe(1750);
  });

  it('Calcule correctement la paie pour une séance de 2h exécutée (ex: Aguissa Touré)', () => {
    const lessons: LessonLogMock[] = [
      { title: 'Anglais technique', hoursCount: 2, status: 'COMPLETED' }
    ];
    const pay = calculateVacataireTotalPay(lessons);
    expect(pay.executedHours).toBe(2);
    expect(pay.absentHours).toBe(0);
    expect(pay.gross).toBe(3500); // 2 * 1750 = 3 500 FCFA
    expect(pay.net).toBe(3500);
  });

  it('Exclut rigoureusement de la rémunération les séances marquées (P) Absent (ex: Abdoulaye Maïga)', () => {
    const lessons: LessonLogMock[] = [
      { title: 'Éducation civique et morale', hoursCount: 0, status: 'ABSENT' }
    ];
    const pay = calculateVacataireTotalPay(lessons);
    expect(pay.executedHours).toBe(0);
    expect(pay.absentHours).toBe(2);
    expect(pay.gross).toBe(0); // Pas de paie pour absence
    expect(pay.net).toBe(0);
  });

  it('Calcule le cumul pour un formateur ayant 5 séances exécutées (ex: Dr. Sissoko - 10h)', () => {
    const lessons: LessonLogMock[] = [
      { title: 'Soins d\'hygiène et santé 1', hoursCount: 2, status: 'COMPLETED' },
      { title: 'Hygiène corporelle et de vie', hoursCount: 2, status: 'COMPLETED' },
      { title: 'La santé et la maladie', hoursCount: 2, status: 'COMPLETED' },
      { title: 'Biosécurité en élevage', hoursCount: 2, status: 'COMPLETED' },
      { title: 'Éléments de la biosécurité', hoursCount: 2, status: 'COMPLETED' }
    ];
    const pay = calculateVacataireTotalPay(lessons);
    expect(pay.executedHours).toBe(10);
    expect(pay.gross).toBe(17500); // 10 * 1750 = 17 500 FCFA
    expect(pay.net).toBe(17500);
  });

  it('Gère un formateur avec séances exécutées et séances absentes', () => {
    const lessons: LessonLogMock[] = [
      { title: 'Pesticides et utilisation', hoursCount: 2, status: 'COMPLETED' },
      { title: 'Désherbage chimique', hoursCount: 2, status: 'COMPLETED' },
      { title: 'Pratique en parcelle', hoursCount: 0, status: 'ABSENT' }
    ];
    const pay = calculateVacataireTotalPay(lessons);
    expect(pay.executedHours).toBe(4);
    expect(pay.absentHours).toBe(2);
    expect(pay.gross).toBe(7000); // 4 * 1750 = 7 000 FCFA
    expect(pay.net).toBe(7000);
  });
});
