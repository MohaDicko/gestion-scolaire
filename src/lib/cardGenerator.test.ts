/**
 * ================================================================
 * TESTS UNITAIRES — Génération SVG Cartes Scolaires (cardGenerator.ts)
 * CFP-PAS de Gao — Intégration signature & cachet Directeur
 * ================================================================
 */
import { describe, it, expect } from 'vitest';
import { generateSVGCard, StudentCardData } from './cardGenerator';

const MOCK_STUDENT: StudentCardData = {
  id: 'stu-001',
  studentNumber: 'RC17PB25G151M',
  firstName: 'Boubacar',
  lastName: 'Abdoulaye',
  dateOfBirth: '2004-03-15',
  gender: 'MALE',
  classroom: { name: '1ère EA' },
  campus: { name: 'Campus Principal Gao' },
};

const MOCK_QR = 'data:image/png;base64,MOCKQR1234';

describe('generateSVGCard — Structure SVG de base', () => {
  it('Retourne une chaîne SVG valide', () => {
    const svg = generateSVGCard(MOCK_STUDENT, MOCK_QR);
    expect(svg.trim()).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(svg.trim()).toContain('</svg>');
  });

  it('Contient le nom complet en MAJUSCULES', () => {
    const svg = generateSVGCard(MOCK_STUDENT, MOCK_QR);
    expect(svg).toContain('BOUBACAR ABDOULAYE');
  });

  it('Contient le matricule de l\'élève', () => {
    const svg = generateSVGCard(MOCK_STUDENT, MOCK_QR);
    expect(svg).toContain('RC17PB25G151M');
  });

  it('Contient le nom de la classe', () => {
    const svg = generateSVGCard(MOCK_STUDENT, MOCK_QR);
    expect(svg).toContain('1ère EA');
  });

  it('Contient la date de naissance formatée', () => {
    const svg = generateSVGCard(MOCK_STUDENT, MOCK_QR);
    expect(svg).toContain('15/03/2004');
  });

  it('Intègre le QR Code encodé en base64', () => {
    const svg = generateSVGCard(MOCK_STUDENT, MOCK_QR);
    expect(svg).toContain(`href="${MOCK_QR}"`);
  });
});

describe('generateSVGCard — Identité visuelle Mali', () => {
  it('Contient le bandeau tricolore du Mali (vert, jaune, rouge)', () => {
    const svg = generateSVGCard(MOCK_STUDENT, MOCK_QR);
    expect(svg).toContain('#009a44'); // Vert
    expect(svg).toContain('#fcd116'); // Jaune/Or
    expect(svg).toContain('#ce1126'); // Rouge
  });

  it('Contient la validité pour l\'année scolaire 2025-2026', () => {
    const svg = generateSVGCard(MOCK_STUDENT, MOCK_QR);
    expect(svg).toContain('2025-2026');
  });
});

describe('generateSVGCard — Cachet du Directeur Général', () => {
  it('Contient une image de cachet (tampon directeur en Base64)', () => {
    const svg = generateSVGCard(MOCK_STUDENT, MOCK_QR);
    expect(svg).toContain('data:image/jpeg;base64,');
  });

  it('Contient le libellé "DIRECTEUR GÉNÉRAL"', () => {
    const svg = generateSVGCard(MOCK_STUDENT, MOCK_QR);
    expect(svg).toContain('DIRECTEUR GÉNÉRAL');
  });

  it('Le cachet est positionné correctement dans le SVG', () => {
    const svg = generateSVGCard(MOCK_STUDENT, MOCK_QR);
    // Vérifier les attributs de positionnement de l'image du cachet
    expect(svg).toMatch(/x="110".*y="430"|y="430".*x="110"/);
  });
});

describe('generateSVGCard — Cas limites', () => {
  it('Fonctionne sans campus défini', () => {
    const studentNoCampus: StudentCardData = { ...MOCK_STUDENT, campus: undefined };
    const svg = generateSVGCard(studentNoCampus, MOCK_QR);
    expect(svg).toContain('<svg');
    expect(svg).toContain('BOUBACAR ABDOULAYE');
  });

  it('Fonctionne sans classe définie (affiche tiret)', () => {
    const studentNoClass: StudentCardData = { ...MOCK_STUDENT, classroom: undefined };
    const svg = generateSVGCard(studentNoClass, MOCK_QR);
    expect(svg).toContain('—');
  });

  it('Gère les noms avec caractères spéciaux (Ag, accents)', () => {
    const student: StudentCardData = {
      ...MOCK_STUDENT,
      firstName: 'Aïssata',
      lastName: 'Ag Albachar',
    };
    const svg = generateSVGCard(student, MOCK_QR);
    expect(svg).toContain('AÏSSATA AG ALBACHAR');
  });
});
