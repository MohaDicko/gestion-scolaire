/**
 * ================================================================
 * MOTEUR DE CALCUL DES BULLETINS — Multi-tenant
 * ================================================================
 * Les notes sont ramenées sur l'échelle configurée par l'école
 * (gradingScale : 20 par défaut pour le Mali, 100 pour le CFPPAS).
 */

export const DEFAULT_GRADING_SCALE = 20;

export type GradeType = 'CONTINUOUS' | 'MIDTERM' | 'FINAL';

export interface GradeInput {
  studentId: string;
  studentName: string;
  studentNumber: string;
  subjectId: string;
  subjectName: string;
  coefficient: number;
  score: number;
  maxScore: number;
  examType: GradeType;
  trimestre: number;
}

export interface SubjectResult {
  subjectId: string;
  subjectName: string;
  coefficient: number;
  moyenneClasse: number;     // Moyenne des interrogations/devoirs
  moyenneComposition: number; // Note de l'examen (compte double)
  average: number;           // (MoyClasse + 2*MoyComp) / 3
  weightedAverage: number;   // average * coefficient
  mention: string;
}

export interface StudentBulletin {
  studentId: string;
  studentName: string;
  studentNumber: string;
  subjects: SubjectResult[];
  totalPoints: number;
  totalCoefficients: number;
  generalAverage: number;
  rank: number;
  classSize: number;
  mention: string;
}

/**
 * Mentions adaptées à l'échelle de l'école.
 * @param average — Moyenne de l'élève
 * @param scale   — Barème de l'école (20 ou 100)
 */
export function getMaliMention(average: number, scale: number = DEFAULT_GRADING_SCALE): string {
  const p = average / scale; // proportion 0-1
  if (p >= 0.80) return 'Très Bien';
  if (p >= 0.70) return 'Bien';
  if (p >= 0.60) return 'Assez Bien';
  if (p >= 0.50) return 'Passable';
  if (p >= 0.40) return 'Faible';
  if (p >= 0.25) return 'Médiocre';
  return 'Très Faible';
}

/**
 * Calcul selon le modèle Lycée Malien :
 * Moyenne Matière = (Moyenne_Classe + 2 * Moyenne_Composition) / 3
 */
export function calculateClassBulletins(grades: GradeInput[], scale: number = DEFAULT_GRADING_SCALE): StudentBulletin[] {
  const studentsMap = new Map<string, { 
    name: string; 
    number: string; 
    subjects: Map<string, { 
      classScores: number[], 
      compScores: number[], 
      coef: number, 
      name: string 
    }> 
  }>();

  // 1. Groupement des données par élève et par matière
  grades.forEach(g => {
    if (!studentsMap.has(g.studentId)) {
      studentsMap.set(g.studentId, {
        name: g.studentName,
        number: g.studentNumber,
        subjects: new Map()
      });
    }

    const student = studentsMap.get(g.studentId)!;
    if (!student.subjects.has(g.subjectId)) {
      student.subjects.set(g.subjectId, {
        classScores: [],
        compScores: [],
        coef: g.coefficient || 1,
        name: g.subjectName
      });
    }

    const sub = student.subjects.get(g.subjectId)!;
    // Ramener la note sur l'échelle de l'école (gradingScale)
    const normalizedScore = (g.score / g.maxScore) * scale;

    if (g.examType === 'CONTINUOUS') {
      sub.classScores.push(normalizedScore);
    } else {
      sub.compScores.push(normalizedScore);
    }
  });

  // 2. Calcul des moyennes
  const bulletins: StudentBulletin[] = Array.from(studentsMap.entries()).map(([studentId, data]) => {
    let totalPoints = 0;
    let totalCoefficients = 0;
    const subjectResults: SubjectResult[] = [];

    data.subjects.forEach((sub, subjectId) => {
      // Moyenne de classe (moyenne simple de tous les devoirs/interros)
      const moyClasse = sub.classScores.length > 0 
        ? sub.classScores.reduce((a, b) => a + b, 0) / sub.classScores.length 
        : 0;

      // Moyenne de composition (souvent une seule note, sinon moyenne)
      const moyComp = sub.compScores.length > 0 
        ? sub.compScores.reduce((a, b) => a + b, 0) / sub.compScores.length 
        : moyClasse; // Si pas de compo, on prend la moyenne de classe (ou 0 selon politique)

      // FORMULE LYCÉE : (Classe + 2*Composition) / 3
      const average = (moyClasse + (2 * moyComp)) / 3;
      const weightedAverage = average * sub.coef;

      subjectResults.push({
        subjectId,
        subjectName: sub.name,
        coefficient: sub.coef,
        moyenneClasse: Number(moyClasse.toFixed(2)),
        moyenneComposition: Number(moyComp.toFixed(2)),
        average: Number(average.toFixed(2)),
        weightedAverage: Number(weightedAverage.toFixed(2)),
        mention: getMaliMention(average, scale)
      });

      totalPoints += weightedAverage;
      totalCoefficients += sub.coef;
    });

    const generalAverage = totalCoefficients > 0 ? totalPoints / totalCoefficients : 0;

    return {
      studentId,
      studentName: data.name,
      studentNumber: data.number,
      subjects: subjectResults,
      totalPoints: Number(totalPoints.toFixed(2)),
      totalCoefficients,
      generalAverage: Number(generalAverage.toFixed(2)),
      rank: 0,
      classSize: studentsMap.size,
      mention: getMaliMention(generalAverage, scale)
    };
  });

  // 3. Rangs
  bulletins.sort((a, b) => b.generalAverage - a.generalAverage);
  bulletins.forEach((b, index) => {
    b.rank = index + 1;
  });

  return bulletins;
}
