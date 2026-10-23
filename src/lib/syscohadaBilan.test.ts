/**
 * ================================================================
 * TESTS UNITAIRES — Bilan Système Allégé SYSCOHADA (Mali)
 * CFP-PAS de Gao — Exercice 2024
 * ================================================================
 */
import { describe, it, expect } from 'vitest';

describe('Règles Comptables SYSCOHADA — Bilan CFP-PAS', () => {
  // Constantes issues du Bilan officiel 2024
  const MATERIEL_BRUT = 26_256_908;
  const MATERIEL_NET = 21_040_501;
  const AMORTISSEMENT_MATERIEL = 5_216_407;

  const CREANCES_CLIENTS = 1_895_880;
  const TRESORERIE_ACTIF = 2_816_575;

  const CAPITAL = 27_168_956;
  const RESULTAT_NET = -1_416_000;
  const DETTES_FINANCIERES = 0;
  const PASSIF_CIRCULANT = 0;

  it('L\'amortissement cumulé du matériel correspond exactement à la dotation constatée', () => {
    expect(MATERIEL_BRUT - MATERIEL_NET).toBe(AMORTISSEMENT_MATERIEL);
  });

  it('Le total de l\'Actif Net est exactement égal à 25 752 956 FCFA', () => {
    const totalActifNet = MATERIEL_NET + CREANCES_CLIENTS + TRESORERIE_ACTIF;
    expect(totalActifNet).toBe(25_752_956);
  });

  it('Le total des Capitaux Propres (Passif) est exactement égal à 25 752 956 FCFA', () => {
    const totalCapitauxPropres = CAPITAL + RESULTAT_NET;
    expect(totalCapitauxPropres).toBe(25_752_956);
  });

  it('L\'équilibre comptable fondamental est rigoureusement respecté : Actif Net = Passif Net', () => {
    const totalActifNet = MATERIEL_NET + CREANCES_CLIENTS + TRESORERIE_ACTIF;
    const totalPassifNet = CAPITAL + RESULTAT_NET + DETTES_FINANCIERES + PASSIF_CIRCULANT;
    expect(totalActifNet).toBe(totalPassifNet);
  });

  it('Le taux d\'endettement est strictement nul (100% d\'autofinancement)', () => {
    const totalDettes = DETTES_FINANCIERES + PASSIF_CIRCULANT;
    expect(totalDettes).toBe(0);
  });

  it('La trésorerie disponible en banque et caisse est de 2 816 575 FCFA', () => {
    expect(TRESORERIE_ACTIF).toBe(2_816_575);
    expect(TRESORERIE_ACTIF).toBeGreaterThan(1_600_500); // En hausse par rapport à N-1
  });
});
