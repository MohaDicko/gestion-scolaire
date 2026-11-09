export type InstitutionalProfileKey = 'ALL' | 'AGRO_TECHNIQUE' | 'LYCEE_GENERAL' | 'SANTE_SUPERIEUR' | 'FONDAMENTAL';

export interface GradingPolicy {
  profileKey: Exclude<InstitutionalProfileKey, 'ALL'>;
  label: string;
  shortLabel: string;
  badgeText: string;
  formulaLabel: string;
  formulaDescription: string;
  defaultScale: number;
  passingScoreRatio: number; // ex: 0.50 (10/20 ou 50/100) ou 0.60 en APC
  periodType: 'TRIMESTRE' | 'SEMESTRE';
  periodCount: number;
  periodLabelSingular: string;
  periodLabelPlural: string;
  terms: {
    student: string;
    students: string;
    teacher: string;
    teachers: string;
    subject: string;
    subjects: string;
    continuousLabel: string;
    midtermLabel: string;
    finalLabel: string;
    reportTitle: string;
  };
  weights: {
    continuousWeight: number;
    compositionWeight: number;
  };
}

export const GRADING_POLICIES: Record<Exclude<InstitutionalProfileKey, 'ALL'>, GradingPolicy> = {
  AGRO_TECHNIQUE: {
    profileKey: 'AGRO_TECHNIQUE',
    label: 'Centre Agro-Pastoral & Technique (CFP-PAS / BT / CAP)',
    shortLabel: 'Agro-Pastoral & CFP',
    badgeText: 'Barème /100 • Approche Par Compétences (APC)',
    formulaLabel: '(2 × Pratique/CC + 1 × Examen Final) ÷ 3 sur 100',
    formulaDescription:
      'Pondération privilégiant les travaux pratiques et le contrôle continu (2/3) associés à l’évaluation de synthèse (1/3) sur une échelle de 100 points.',
    defaultScale: 100,
    passingScoreRatio: 0.5,
    periodType: 'TRIMESTRE',
    periodCount: 3,
    periodLabelSingular: 'Trimestre',
    periodLabelPlural: 'Trimestres',
    terms: {
      student: 'Apprenant',
      students: 'Apprenants',
      teacher: 'Formateur',
      teachers: 'Formateurs',
      subject: 'Module',
      subjects: 'Modules',
      continuousLabel: 'Travaux Pratiques / CC (Coef 2)',
      midtermLabel: 'Évaluation Modulaire',
      finalLabel: 'Examen de Synthèse (Coef 1)',
      reportTitle: 'BULLETIN DE NOTES & COMPÉTENCES AGRO-PASTORALES',
    },
    weights: {
      continuousWeight: 2,
      compositionWeight: 1,
    },
  },
  LYCEE_GENERAL: {
    profileKey: 'LYCEE_GENERAL',
    label: 'Lycée d’Enseignement Général & Secondaire (TSE, TLL, TSS)',
    shortLabel: 'Lycée & Secondaire',
    badgeText: 'Barème /20 • Norme Nationale MEN Mali',
    formulaLabel: '(Moyenne Devoirs + 2 × Composition) ÷ 3 sur 20',
    formulaDescription:
      'Formule officielle des lycées maliens : la moyenne de classe compte pour 1/3 et la note de composition trimestrielle pour 2/3.',
    defaultScale: 20,
    passingScoreRatio: 0.5,
    periodType: 'TRIMESTRE',
    periodCount: 3,
    periodLabelSingular: 'Trimestre',
    periodLabelPlural: 'Trimestres',
    terms: {
      student: 'Élève',
      students: 'Élèves',
      teacher: 'Professeur',
      teachers: 'Professeurs',
      subject: 'Matière',
      subjects: 'Matières',
      continuousLabel: 'Interrogation / Devoir de classe (Coef 1)',
      midtermLabel: 'Devoir Surveillé',
      finalLabel: 'Composition Trimestrielle (Coef 2)',
      reportTitle: 'BULLETIN SCOLAIRE TRIMESTRIEL — ENSEIGNEMENT SECONDAIRE',
    },
    weights: {
      continuousWeight: 1,
      compositionWeight: 2,
    },
  },
  SANTE_SUPERIEUR: {
    profileKey: 'SANTE_SUPERIEUR',
    label: 'Institut des Sciences de la Santé & Supérieur (ESBK / LMD)',
    shortLabel: 'Santé & Supérieur',
    badgeText: 'Barème /20 • Système Semestriel LMD / OOAS',
    formulaLabel: '40% Contrôle Continu / Stage + 60% Examen Final sur 20',
    formulaDescription:
      'Norme LMD et instituts paramédicaux (OOAS) : 40% attribués au contrôle continu/TP cliniques et 60% à l’examen terminal.',
    defaultScale: 20,
    passingScoreRatio: 0.5,
    periodType: 'SEMESTRE',
    periodCount: 2,
    periodLabelSingular: 'Semestre',
    periodLabelPlural: 'Semestres',
    terms: {
      student: 'Étudiant',
      students: 'Étudiants',
      teacher: 'Enseignant',
      teachers: 'Enseignants',
      subject: 'Unité d’Enseignement (UE)',
      subjects: 'Unités d’Enseignement (UE)',
      continuousLabel: 'Contrôle Continu / TP Clinique (40%)',
      midtermLabel: 'Partiel Mi-Semestre',
      finalLabel: 'Examen Terminal Semestriel (60%)',
      reportTitle: 'RELEVÉ DE NOTES SEMESTRIEL — SCIENCES DE LA SANTÉ & LMD',
    },
    weights: {
      continuousWeight: 0.4,
      compositionWeight: 0.6,
    },
  },
  FONDAMENTAL: {
    profileKey: 'FONDAMENTAL',
    label: 'Enseignement Fondamental 1er & 2nd Cycle (CAP / DEF)',
    shortLabel: 'Fondamental (DEF)',
    badgeText: 'Barème /20 • Moyenne Équilibrée (Classe + Compo) ÷ 2',
    formulaLabel: '(Moyenne Classe + Composition) ÷ 2 sur 20',
    formulaDescription:
      'Formule officielle du cycle fondamental malien : poids égal (50% / 50%) entre la moyenne des évaluations de classe et la composition.',
    defaultScale: 20,
    passingScoreRatio: 0.5,
    periodType: 'TRIMESTRE',
    periodCount: 3,
    periodLabelSingular: 'Trimestre',
    periodLabelPlural: 'Trimestres',
    terms: {
      student: 'Élève',
      students: 'Élèves',
      teacher: 'Maître / Enseignant',
      teachers: 'Enseignants',
      subject: 'Discipline',
      subjects: 'Disciplines',
      continuousLabel: 'Note de Classe (50%)',
      midtermLabel: 'Évaluation Mensuelle',
      finalLabel: 'Composition (50%)',
      reportTitle: 'BULLETIN TRIMESTRIEL — ENSEIGNEMENT FONDAMENTAL',
    },
    weights: {
      continuousWeight: 1,
      compositionWeight: 1,
    },
  },
};

/**
 * Résout la politique pédagogique à partir du SchoolType Prisma
 */
export function getGradingPolicyBySchoolType(
  schoolType?: string | null,
  customScale?: number | null
): GradingPolicy {
  let basePolicy: GradingPolicy;

  switch (schoolType) {
    case 'AGRO':
    case 'TECHNIQUE':
      basePolicy = GRADING_POLICIES.AGRO_TECHNIQUE;
      break;
    case 'SANTE':
    case 'UNIVERSITE':
      basePolicy = GRADING_POLICIES.SANTE_SUPERIEUR;
      break;
    case 'FONDAMENTAL':
    case 'PRIMAIRE':
    case 'PRESCOLAIRE':
      basePolicy = GRADING_POLICIES.FONDAMENTAL;
      break;
    case 'LYCEE':
    case 'PUBLIC':
    case 'PRIVATE':
    case 'CONFESSIONAL':
    case 'INTERNATIONAL':
    default:
      basePolicy = GRADING_POLICIES.LYCEE_GENERAL;
      break;
  }

  if (customScale && customScale > 0 && customScale !== basePolicy.defaultScale) {
    return {
      ...basePolicy,
      defaultScale: customScale,
    };
  }

  return basePolicy;
}

/**
 * Calcule la moyenne d'une matière/module selon la politique pédagogique de l'établissement
 */
export function computeSubjectAverage(
  grades: Array<{ score: number; maxScore: number; examType: string }>,
  policy: GradingPolicy,
  targetScale?: number
): {
  classAverage: number;
  compositionAverage: number;
  finalAverage: number;
  mention: string;
} {
  const scale = targetScale || policy.defaultScale;

  if (!grades || grades.length === 0) {
    return {
      classAverage: 0,
      compositionAverage: 0,
      finalAverage: 0,
      mention: 'Non évalué',
    };
  }

  const normalize = (g: { score: number; maxScore: number }) =>
    g.maxScore > 0 ? (g.score / g.maxScore) * scale : 0;

  const continuousGrades = grades.filter((g) => g.examType === 'CONTINUOUS');
  const compositionGrades = grades.filter((g) => g.examType !== 'CONTINUOUS');

  const hasContinuous = continuousGrades.length > 0;
  const hasComposition = compositionGrades.length > 0;

  const classAverage = hasContinuous
    ? continuousGrades.reduce((sum, g) => sum + normalize(g), 0) / continuousGrades.length
    : 0;

  const compositionAverage = hasComposition
    ? compositionGrades.reduce((sum, g) => sum + normalize(g), 0) / compositionGrades.length
    : 0;

  let finalAverage = 0;
  const { continuousWeight, compositionWeight } = policy.weights;
  const totalWeight = continuousWeight + compositionWeight;

  if (hasContinuous && hasComposition) {
    finalAverage =
      (classAverage * continuousWeight + compositionAverage * compositionWeight) / totalWeight;
  } else if (hasComposition) {
    finalAverage = compositionAverage;
  } else if (hasContinuous) {
    finalAverage = classAverage;
  }

  const mention = computeMention(finalAverage, scale);

  return {
    classAverage: Math.round(classAverage * 100) / 100,
    compositionAverage: Math.round(compositionAverage * 100) / 100,
    finalAverage: Math.round(finalAverage * 100) / 100,
    mention,
  };
}

export function computeMention(average: number, scale: number): string {
  if (average >= scale * 0.8) return 'Très Bien';
  if (average >= scale * 0.7) return 'Bien';
  if (average >= scale * 0.6) return 'Assez Bien';
  if (average >= scale * 0.5) return 'Passable';
  return 'Insuffisant';
}

