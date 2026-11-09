import { describe, it, expect } from 'vitest';
import {
  getGradingPolicyBySchoolType,
  computeSubjectAverage,
} from '@/lib/gradingPolicy';

describe('Moteur de Classification & Calcul des Notes par Type d’École (Mali)', () => {
  it('Lycée (LYCEE) : barème /20 et formule (Moyenne Classe + 2 × Compo) / 3', () => {
    const policy = getGradingPolicyBySchoolType('LYCEE');
    expect(policy.profileKey).toBe('LYCEE_GENERAL');
    expect(policy.defaultScale).toBe(20);

    // Devoir: 12/20 (coef 1), Composition: 15/20 (coef 2) => (12 + 30) / 3 = 14/20
    const res = computeSubjectAverage(
      [
        { score: 12, maxScore: 20, examType: 'CONTINUOUS' },
        { score: 15, maxScore: 20, examType: 'FINAL' },
      ],
      policy
    );
    expect(res.classAverage).toBe(12);
    expect(res.compositionAverage).toBe(15);
    expect(res.finalAverage).toBe(14);
    expect(res.mention).toBe('Bien');
  });

  it('Centre Agro-Pastoral (AGRO / CFPPAS) : barème /100 et formule (2 × Pratique/CC + 1 × Examen) / 3', () => {
    const policy = getGradingPolicyBySchoolType('AGRO', 100);
    expect(policy.profileKey).toBe('AGRO_TECHNIQUE');
    expect(policy.defaultScale).toBe(100);
    expect(policy.terms.student).toBe('Apprenant');
    expect(policy.terms.subject).toBe('Module');

    // Pratique/CC: 80/100 (poids 2), Examen: 65/100 (poids 1) => (160 + 65) / 3 = 75/100
    const res = computeSubjectAverage(
      [
        { score: 80, maxScore: 100, examType: 'CONTINUOUS' },
        { score: 65, maxScore: 100, examType: 'FINAL' },
      ],
      policy
    );
    expect(res.finalAverage).toBe(75);
    expect(res.mention).toBe('Bien');
  });

  it('Institut de Santé / Université (SANTE / LMD) : barème /20 semestriel et formule 40% CC + 60% Examen', () => {
    const policy = getGradingPolicyBySchoolType('SANTE');
    expect(policy.profileKey).toBe('SANTE_SUPERIEUR');
    expect(policy.periodType).toBe('SEMESTRE');
    expect(policy.defaultScale).toBe(20);

    // CC: 15/20 (40% = 6), Examen: 10/20 (60% = 6) => 12/20
    const res = computeSubjectAverage(
      [
        { score: 15, maxScore: 20, examType: 'CONTINUOUS' },
        { score: 10, maxScore: 20, examType: 'FINAL' },
      ],
      policy
    );
    expect(res.finalAverage).toBe(12);
    expect(res.mention).toBe('Assez Bien');
  });

  it('Fondamental (FONDAMENTAL / DEF) : barème /20 et formule (Classe + Compo) / 2', () => {
    const policy = getGradingPolicyBySchoolType('FONDAMENTAL');
    expect(policy.profileKey).toBe('FONDAMENTAL');

    // Classe: 10/20, Compo: 16/20 => 13/20
    const res = computeSubjectAverage(
      [
        { score: 10, maxScore: 20, examType: 'CONTINUOUS' },
        { score: 16, maxScore: 20, examType: 'FINAL' },
      ],
      policy
    );
    expect(res.finalAverage).toBe(13);
  });
});

