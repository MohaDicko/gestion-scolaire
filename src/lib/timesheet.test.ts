/**
 * ================================================================
 * TESTS UNITAIRES — Tableau Utilitaire des Heures d'Enseignement
 * Grille journalière Lundi-Samedi · Heures Prévues · Perdues
 * ================================================================
 */
import { describe, it, expect } from 'vitest';

interface TimesheetSession {
  day: number;
  hoursCount: number;
  status: 'COMPLETED' | 'ABSENT';
}

function calculateTeacherTimesheet(
  sessions: TimesheetSession[],
  quotaPrevues: number = 20,
  rate: number = 1750
) {
  let totalHours = 0;
  let heuresPerdues = 0;
  const dayGrid: Record<number, number> = {};

  for (const s of sessions) {
    if (s.status === 'COMPLETED') {
      dayGrid[s.day] = (dayGrid[s.day] || 0) + s.hoursCount;
      totalHours += s.hoursCount;
    } else if (s.status === 'ABSENT') {
      heuresPerdues += (s.hoursCount > 0 ? s.hoursCount : 2);
    }
  }

  const heuresPrevues = Math.max(quotaPrevues, totalHours + heuresPerdues);
  const calculatedPerdues = Math.max(heuresPerdues, heuresPrevues - totalHours);
  const montant = totalHours * rate;

  return {
    dayGrid,
    totalHours,
    heuresPrevues,
    heuresPerdues: calculatedPerdues,
    rate,
    montant
  };
}

describe('Logique Métier — Tableau Utilitaire des Heures (CFPPAS)', () => {
  it('Exclut le dimanche du calendrier de travail ouvré sahélien', () => {
    const daysInMonth = 31;
    let sundaysCount = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      // Octobre 2024 : 1er Octobre = Mardi
      const date = new Date(2024, 9, d);
      if (date.getDay() === 0) sundaysCount++;
    }
    expect(sundaysCount).toBe(4);
    expect(daysInMonth - sundaysCount).toBe(27); // 27 jours ouvrés
  });

  it('Calcule correctement la ligne d\'un professeur régulier (ex: Ousmane Alhassane)', () => {
    const sessions: TimesheetSession[] = [
      { day: 1, hoursCount: 2, status: 'COMPLETED' },
      { day: 3, hoursCount: 2, status: 'COMPLETED' },
      { day: 8, hoursCount: 2, status: 'COMPLETED' },
      { day: 10, hoursCount: 2, status: 'COMPLETED' },
      { day: 15, hoursCount: 2, status: 'COMPLETED' },
      { day: 17, hoursCount: 2, status: 'COMPLETED' }
    ];

    const result = calculateTeacherTimesheet(sessions, 20);
    expect(result.totalHours).toBe(12);
    expect(result.heuresPrevues).toBe(20);
    expect(result.heuresPerdues).toBe(8); // 20 - 12 = 8h restantes ou perdues
    expect(result.montant).toBe(12 * 1750); // 21 000 FCFA
  });

  it('Détecte et pénalise les séances (P) Absent (ex: Aminata Maïga)', () => {
    const sessions: TimesheetSession[] = [
      { day: 2, hoursCount: 2, status: 'COMPLETED' },
      { day: 4, hoursCount: 2, status: 'ABSENT' }, // Absence constatée
      { day: 9, hoursCount: 2, status: 'COMPLETED' }
    ];

    const result = calculateTeacherTimesheet(sessions, 20);
    expect(result.totalHours).toBe(4); // Seules 4h exécutées
    expect(result.heuresPerdues).toBe(16); // 20 - 4 = 16h
    expect(result.montant).toBe(4 * 1750); // 7 000 FCFA
  });
});
