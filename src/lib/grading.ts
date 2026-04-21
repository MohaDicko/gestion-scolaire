/**
 * ================================================================
 * MOTEUR DE CALCUL DES BULLETINS - MODÈLE LYCÉE MALIEN (EX: NIAMANA)
 * ================================================================
 */

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

export function getMaliMention(average: number): string {
  if (average >= 16) return 'Très Bien';
  if (average >= 14) return 'Bien';
  if (average >= 12) return 'Assez Bien';
  if (average >= 10) return 'Passable';
  if (average >= 8)  return 'Faible';
  if (average >= 5)  return 'Médiocre';
  return 'Très Faible';
}

/**
 * Calcul selon le modèle Lycée Malien :
 * Moyenne Matière = (Moyenne_Classe + 2 * Moyenne_Composition) / 3
 */
export function calculateClassBulletins(grades: GradeInput[]): StudentBulletin[] {
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
    const normalizedScore = (g.score / g.maxScore) * 20;

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
        mention: getMaliMention(average)
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
      mention: getMaliMention(generalAverage)
    };
  });

  // 3. Rangs
  bulletins.sort((a, b) => b.generalAverage - a.generalAverage);
  bulletins.forEach((b, index) => {
    b.rank = index + 1;
  });

  return bulletins;
}
