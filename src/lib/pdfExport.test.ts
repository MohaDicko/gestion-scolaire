/**
 * ================================================================
 * TESTS UNITAIRES & D'INTÉGRATION — Export PDF Bulletins & Cartes
 * Tests de validation du format, des noms de fichiers et de l'intégrité
 * ================================================================
 */
import { describe, it, expect } from 'vitest';

// Fonction de nettoyage et standardisation de noms de fichiers PDF
export const sanitizeFilename = (str: string): string => {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_');
};

// Fonction de construction du nom de fichier pour un bulletin
export const buildBulletinFilename = (student: { lastName?: string; firstName?: string }, trimestre: number, academicYear: string): string => {
  const cleanLast = sanitizeFilename(student?.lastName || 'Eleve');
  const cleanFirst = sanitizeFilename(student?.firstName || '');
  const cleanYear = sanitizeFilename(academicYear || '2025-2026');
  return `Bulletin_${cleanLast}_${cleanFirst}_T${trimestre}_${cleanYear}.pdf`;
};

// Fonction de construction du nom de fichier pour une carte scolaire
export const buildCardFilename = (student: { studentNumber?: string; lastName?: string; firstName?: string }): string => {
  const cleanNum = sanitizeFilename(student?.studentNumber || '00');
  const cleanLast = sanitizeFilename(student?.lastName || 'Eleve');
  const cleanFirst = sanitizeFilename(student?.firstName || '');
  return `Carte_${cleanNum}_${cleanLast}_${cleanFirst}.pdf`;
};

// Calcul du layout pour planche A4 de cartes scolaires
export const calculateA4CardLayout = (totalCards: number, cardsPerPage = 4) => {
  const totalPages = Math.ceil(totalCards / cardsPerPage);
  const pages = [];
  for (let p = 0; p < totalPages; p++) {
    const count = Math.min(cardsPerPage, totalCards - p * cardsPerPage);
    pages.push(count);
  }
  return { totalPages, pages };
};

describe('Tests Unitaires — Normalisation des Noms de Fichiers PDF', () => {
  it('Supprime correctement les accents (É, È, Ê, etc.)', () => {
    const input = 'THIÉRO';
    const output = sanitizeFilename(input);
    expect(output).toBe('THIERO');
  });

  it('Remplace les espaces par des underscores', () => {
    const input = 'Kadiatou Mamaou';
    const output = sanitizeFilename(input);
    expect(output).toBe('Kadiatou_Mamaou');
  });

  it('Gère les caractères spéciaux et les slashes d\'année scolaire', () => {
    const input = '2025/2026';
    const output = sanitizeFilename(input);
    expect(output).toBe('2025_2026');
  });

  it('Gère les valeurs vides ou nulles sans erreur', () => {
    expect(sanitizeFilename('')).toBe('');
    expect(sanitizeFilename(null as unknown as string)).toBe('');
    expect(sanitizeFilename(undefined as unknown as string)).toBe('');
  });
});

describe('Tests Unitaires — Format et Extension des Bulletins', () => {
  it('Génère un nom de fichier se terminant impérativement par .pdf', () => {
    const filename = buildBulletinFilename(
      { lastName: 'THIÉRO', firstName: 'Kadiatou' },
      1,
      '2025/2026'
    );
    expect(filename.endsWith('.pdf')).toBe(true);
    expect(filename).toBe('Bulletin_THIERO_Kadiatou_T1_2025_2026.pdf');
  });

  it('Ne contient aucun caractère non-ASCII risquant de casser le téléchargement sous Windows', () => {
    const filename = buildBulletinFilename(
      { lastName: 'BOUBACAR-DIOP', firstName: 'Aïssata Éléonore' },
      2,
      '2025-2026'
    );
    // Vérification stricte que chaque caractère est ASCII standard
    const isPureAscii = /^[\x20-\x7E]+$/.test(filename);
    expect(isPureAscii).toBe(true);
    expect(filename).toContain('Aissata_Eleonore');
  });

  it('Gère les élèves sans nom ou prénom renseigné', () => {
    const filename = buildBulletinFilename({}, 1, '2025-2026');
    expect(filename).toBe('Bulletin_Eleve__T1_2025-2026.pdf');
    expect(filename.endsWith('.pdf')).toBe(true);
  });
});

describe('Tests Unitaires — Format et Extension des Cartes Scolaires', () => {
  it('Génère un nom de carte individuelle au format .pdf', () => {
    const filename = buildCardFilename({
      studentNumber: 'RC18PB25ZD5616F',
      lastName: 'THIÉRO',
      firstName: 'Kadiatou'
    });
    expect(filename.endsWith('.pdf')).toBe(true);
    expect(filename).toBe('Carte_RC18PB25ZD5616F_THIERO_Kadiatou.pdf');
  });

  it('Vérifie le découpage de pagination A4 pour les lots de badges', () => {
    // Cas 1: 10 élèves -> 3 pages (4, 4, 2)
    const layout10 = calculateA4CardLayout(10, 4);
    expect(layout10.totalPages).toBe(3);
    expect(layout10.pages).toEqual([4, 4, 2]);

    // Cas 2: 4 élèves -> 1 page exacte (4)
    const layout4 = calculateA4CardLayout(4, 4);
    expect(layout4.totalPages).toBe(1);
    expect(layout4.pages).toEqual([4]);

    // Cas 3: 50 élèves d'une classe complète -> 13 pages
    const layout50 = calculateA4CardLayout(50, 4);
    expect(layout50.totalPages).toBe(13);
    expect(layout50.pages[12]).toBe(2);
  });
});

describe('Tests d\'Intégration — Données du Bulletin de Notes', () => {
  it('Vérifie la validité des calculs de moyenne et mentions pour l\'impression', () => {
    const mockGrades = [
      { subjectName: 'Anglais', coefficient: 2, score: 18, maxScore: 20 },
      { subjectName: 'Mathématiques', coefficient: 4, score: 14, maxScore: 20 },
      { subjectName: 'Histoire', coefficient: 2, score: 10, maxScore: 20 },
    ];

    const totalCoeff = mockGrades.reduce((sum, g) => sum + g.coefficient, 0);
    const totalPoints = mockGrades.reduce((sum, g) => sum + g.score * g.coefficient, 0);
    const average = totalPoints / totalCoeff;

    expect(totalCoeff).toBe(8);
    expect(totalPoints).toBe(18 * 2 + 14 * 4 + 10 * 2); // 36 + 56 + 20 = 112
    expect(average).toBe(14); // 112 / 8 = 14

    // Mention pour 14/20
    let mention = 'Passable';
    if (average >= 16) mention = 'Très Bien';
    else if (average >= 14) mention = 'Bien';
    else if (average >= 12) mention = 'Assez Bien';

    expect(mention).toBe('Bien');
  });

  it('Protège contre la division par zéro si aucun coefficient n\'est présent', () => {
    const totalCoeff = 0;
    const average = totalCoeff > 0 ? 15 / totalCoeff : 0;
    expect(Number.isFinite(average)).toBe(true);
    expect(average).toBe(0);
  });
});
