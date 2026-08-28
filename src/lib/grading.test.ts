/**
 * ================================================================
 * TESTS UNITAIRES — Moteur de Bulletins multi-tenant (grading.ts)
 * CFP-PAS de Gao — Barème /20 (Mali) et /100
 * ================================================================
 */
import { describe, it, expect } from 'vitest';
import {
  getMaliMention,
  calculateClassBulletins,
  DEFAULT_GRADING_SCALE,
  GradeInput,
} from './grading';

// ──────────────────────────────────────────────
// getMaliMention — Mentions sur barème /20 et /100
// ──────────────────────────────────────────────
describe('getMaliMention — Barème /20 (Mali)', () => {
  it('≥ 16/20 → Très Bien', () => {
    expect(getMaliMention(16, 20)).toBe('Très Bien');
    expect(getMaliMention(20, 20)).toBe('Très Bien');
  });

  it('≥ 14/20 → Bien', () => {
    expect(getMaliMention(14, 20)).toBe('Bien');
    expect(getMaliMention(15.9, 20)).toBe('Bien');
  });

  it('≥ 12/20 → Assez Bien', () => {
    expect(getMaliMention(12, 20)).toBe('Assez Bien');
  });

  it('≥ 10/20 → Passable', () => {
    expect(getMaliMention(10, 20)).toBe('Passable');
    expect(getMaliMention(11.9, 20)).toBe('Passable');
  });

  it('≥ 8/20 → Faible', () => {
    expect(getMaliMention(8, 20)).toBe('Faible');
  });

  it('≥ 5/20 → Médiocre', () => {
    expect(getMaliMention(5, 20)).toBe('Médiocre');
  });

  it('< 5/20 → Très Faible', () => {
    expect(getMaliMention(0, 20)).toBe('Très Faible');
    expect(getMaliMention(4.9, 20)).toBe('Très Faible');
  });

  it('Utilise le barème par défaut /20 si non précisé', () => {
    expect(getMaliMention(16)).toBe('Très Bien');
    expect(getMaliMention(10)).toBe('Passable');
  });
});

describe('getMaliMention — Barème /100 (CFPPAS / lycée technique)', () => {
  it('≥ 80/100 → Très Bien', () => {
    expect(getMaliMention(80, 100)).toBe('Très Bien');
    expect(getMaliMention(95, 100)).toBe('Très Bien');
  });

  it('50/100 → Passable (équivalent 10/20)', () => {
    expect(getMaliMention(50, 100)).toBe('Passable');
  });

  it('25/100 → Médiocre (seuil bas)', () => {
    expect(getMaliMention(25, 100)).toBe('Médiocre');
  });

  it('24/100 → Très Faible', () => {
    expect(getMaliMention(24.9, 100)).toBe('Très Faible');
  });

  it('La proportion est identique pour les deux barèmes', () => {
    // 15/20 = 75%, 75/100 = 75% → même mention
    expect(getMaliMention(15, 20)).toBe(getMaliMention(75, 100));
  });
});

// ──────────────────────────────────────────────
// calculateClassBulletins — Calcul des bulletins
// ──────────────────────────────────────────────
const STUDENT_BOUBACAR = 'stu-001';
const STUDENT_AISSATA  = 'stu-002';

const buildGrades = (): GradeInput[] => [
  // Boubacar — Biologie : devoir 14/20, compo 16/20
  { studentId: STUDENT_BOUBACAR, studentName: 'Boubacar Abdoulaye', studentNumber: 'RC17PB25G001M', subjectId: 'bio', subjectName: 'Biologie', coefficient: 3, score: 14, maxScore: 20, examType: 'CONTINUOUS', trimestre: 1 },
  { studentId: STUDENT_BOUBACAR, studentName: 'Boubacar Abdoulaye', studentNumber: 'RC17PB25G001M', subjectId: 'bio', subjectName: 'Biologie', coefficient: 3, score: 16, maxScore: 20, examType: 'FINAL', trimestre: 1 },
  // Boubacar — Maths : devoir 10/20, compo 8/20
  { studentId: STUDENT_BOUBACAR, studentName: 'Boubacar Abdoulaye', studentNumber: 'RC17PB25G001M', subjectId: 'math', subjectName: 'Mathématiques', coefficient: 4, score: 10, maxScore: 20, examType: 'CONTINUOUS', trimestre: 1 },
  { studentId: STUDENT_BOUBACAR, studentName: 'Boubacar Abdoulaye', studentNumber: 'RC17PB25G001M', subjectId: 'math', subjectName: 'Mathématiques', coefficient: 4, score: 8, maxScore: 20, examType: 'FINAL', trimestre: 1 },
  // Aïssata — Biologie : devoir 18/20, compo 19/20
  { studentId: STUDENT_AISSATA, studentName: 'Aïssata Dicko', studentNumber: 'RC18PB26G001F', subjectId: 'bio', subjectName: 'Biologie', coefficient: 3, score: 18, maxScore: 20, examType: 'CONTINUOUS', trimestre: 1 },
  { studentId: STUDENT_AISSATA, studentName: 'Aïssata Dicko', studentNumber: 'RC18PB26G001F', subjectId: 'bio', subjectName: 'Biologie', coefficient: 3, score: 19, maxScore: 20, examType: 'FINAL', trimestre: 1 },
  // Aïssata — Maths : devoir 12/20, compo 11/20
  { studentId: STUDENT_AISSATA, studentName: 'Aïssata Dicko', studentNumber: 'RC18PB26G001F', subjectId: 'math', subjectName: 'Mathématiques', coefficient: 4, score: 12, maxScore: 20, examType: 'CONTINUOUS', trimestre: 1 },
  { studentId: STUDENT_AISSATA, studentName: 'Aïssata Dicko', studentNumber: 'RC18PB26G001F', subjectId: 'math', subjectName: 'Mathématiques', coefficient: 4, score: 11, maxScore: 20, examType: 'FINAL', trimestre: 1 },
];

describe('calculateClassBulletins — Génération des bulletins multi-élèves', () => {
  it('Retourne un bulletin par élève', () => {
    const bulletins = calculateClassBulletins(buildGrades());
    expect(bulletins).toHaveLength(2);
  });

  it('Chaque bulletin contient les matières calculées', () => {
    const bulletins = calculateClassBulletins(buildGrades());
    const boubacar = bulletins.find(b => b.studentId === STUDENT_BOUBACAR)!;
    expect(boubacar.subjects).toHaveLength(2);
    const bio = boubacar.subjects.find(s => s.subjectId === 'bio')!;
    expect(bio.subjectName).toBe('Biologie');
    expect(bio.coefficient).toBe(3);
  });

  it('Formule Lycée : (Classe + 2×Compo) / 3 doit être respectée', () => {
    const bulletins = calculateClassBulletins(buildGrades());
    const boubacar = bulletins.find(b => b.studentId === STUDENT_BOUBACAR)!;
    const bio = boubacar.subjects.find(s => s.subjectId === 'bio')!;
    // MoyClasse=14, MoyComp=16 → (14 + 2*16) / 3 = 46/3 ≈ 15.33
    const expected = parseFloat(((14 + 2 * 16) / 3).toFixed(2));
    expect(bio.average).toBeCloseTo(expected, 1);
  });

  it('La moyenne générale est la somme pondérée divisée par les coeff', () => {
    const bulletins = calculateClassBulletins(buildGrades());
    const boubacar = bulletins.find(b => b.studentId === STUDENT_BOUBACAR)!;
    expect(boubacar.totalCoefficients).toBe(7); // 3 + 4
    expect(boubacar.generalAverage).toBeGreaterThan(0);
    expect(boubacar.generalAverage).toBeLessThanOrEqual(20);
  });

  it('Le rang est attribué (1=meilleur, ordre décroissant)', () => {
    const bulletins = calculateClassBulletins(buildGrades());
    // Aïssata a de meilleures notes → rang 1
    const aissata = bulletins.find(b => b.studentId === STUDENT_AISSATA)!;
    const boubacar = bulletins.find(b => b.studentId === STUDENT_BOUBACAR)!;
    expect(aissata.rank).toBe(1);
    expect(boubacar.rank).toBe(2);
  });

  it('classSize correspond au nombre total d\'élèves dans la classe', () => {
    const bulletins = calculateClassBulletins(buildGrades());
    bulletins.forEach(b => expect(b.classSize).toBe(2));
  });

  it('Retourne un tableau vide si aucune note n\'est fournie', () => {
    expect(calculateClassBulletins([])).toEqual([]);
  });

  it('Fonctionne avec le barème /100 (CFPPAS)', () => {
    const cfppasGrades: GradeInput[] = [
      { studentId: 'stu-1', studentName: 'Test Elève', studentNumber: 'MAT-001', subjectId: 'bio', subjectName: 'Bio', coefficient: 2, score: 75, maxScore: 100, examType: 'CONTINUOUS', trimestre: 1 },
      { studentId: 'stu-1', studentName: 'Test Elève', studentNumber: 'MAT-001', subjectId: 'bio', subjectName: 'Bio', coefficient: 2, score: 85, maxScore: 100, examType: 'FINAL', trimestre: 1 },
    ];
    const [bulletin] = calculateClassBulletins(cfppasGrades, 100);
    const bio = bulletin.subjects[0];
    // scores: 75/100 → 75 (normalisé sur /100), compo: 85/100 → 85
    // Moyenne = (75 + 2*85)/3 = 245/3 ≈ 81.67
    expect(bio.average).toBeCloseTo(81.67, 0);
    expect(bulletin.mention).toBe('Très Bien'); // 81.67/100 ≥ 80%
  });

  it('Si pas de compo, la moyenne de classe est utilisée comme compo', () => {
    const singleGrade: GradeInput[] = [
      { studentId: 'stu-1', studentName: 'Test', studentNumber: 'MAT-001', subjectId: 'math', subjectName: 'Maths', coefficient: 3, score: 12, maxScore: 20, examType: 'CONTINUOUS', trimestre: 1 },
    ];
    const [bulletin] = calculateClassBulletins(singleGrade);
    const math = bulletin.subjects[0];
    // MoyClasse=12, MoyComp=12 (fallback) → (12 + 2*12) / 3 = 12
    expect(math.average).toBeCloseTo(12, 1);
  });
});
