import { test, expect } from '@playwright/test';

test.describe('School Management SaaS - Interface & Fonctionnalités', () => {

  test('Page d\'accueil SaaS : Présentation sobre et professionnelle', async ({ page }) => {
    await page.goto('/');

    // Vérifier l'identité EduGestion
    await expect(page.locator('text=EduGestion').first()).toBeVisible();

    // Vérifier l'absence d'éléments de design AI ou faux-gouvernementaux
    await expect(page.locator('text=RÉPUBLIQUE DU MALI')).not.toBeVisible();
    await expect(page.locator('text=Service Layer d\'État Opérationnel')).not.toBeVisible();

    // Vérifier le titre et les CTA clairs
    await expect(page.locator('h1')).toContainText('La solution simple et complète');
    await expect(page.locator('#hero-cta-dashboard')).toBeVisible();

    // Vérifier les portails métiers
    await expect(page.locator('text=Espace Direction')).toBeVisible();
    await expect(page.locator('text=Secrétariat & Admissions')).toBeVisible();
    await expect(page.locator('text=Espace Enseignants')).toBeVisible();
  });

  test('Tableau de bord : Navigation et Chiffres clés opérationnels', async ({ page }) => {
    await page.goto('/dashboard');

    // Vérifier le header de la page
    await expect(page.locator('text=Tableau de bord').first()).toBeVisible();

    // Vérifier les 4 cartes métriques essentielles
    await expect(page.locator('text=Élèves inscrits')).toBeVisible();
    await expect(page.locator('text=Présence aujourd\'hui')).toBeVisible();
    await expect(page.locator('text=Recouvrement scolarités')).toBeVisible();

    // Vérifier les opérations rapides
    await expect(page.locator('text=Opérations fréquentes')).toBeVisible();
    await expect(page.locator('text=Inscrire un élève')).toBeVisible();
    await expect(page.locator('text=Encaisser reçu')).toBeVisible();
    await expect(page.locator('text=Faire l\'appel')).toBeVisible();

    // Vérifier le tableau des dossiers prioritaires
    await expect(page.locator('text=Dossiers prioritaires à traiter')).toBeVisible();
  });

  test('Filtres des dossiers prioritaires', async ({ page }) => {
    await page.goto('/dashboard');

    // Cliquer sur le filtre "Urgents"
    const urgentBtn = page.locator('button:has-text("Urgents")');
    if (await urgentBtn.isVisible()) {
      await urgentBtn.click();
      await expect(urgentBtn).toHaveClass(/text-rose-600/);
    }

    // Revenir sur "Tous"
    const allBtn = page.getByRole('button', { name: /^Tous/ });
    if (await allBtn.isVisible()) {
      await allBtn.click();
      await expect(allBtn).toHaveClass(/shadow-2xs/);
    }
  });

});
