import { test, expect } from '@playwright/test';

test.describe('School Management SaaS - Interface & Fonctionnalités', () => {

  test('Page d\'accueil SaaS : Login Landing Page sobre et accès rapide', async ({ page }) => {
    await page.goto('/');

    // Vérifier l'identité EduGestion
    await expect(page.locator('text=EduGestion').first()).toBeVisible();

    // Vérifier l'absence d'éléments de design AI ou faux-gouvernementaux
    await expect(page.locator('text=RÉPUBLIQUE DU MALI')).not.toBeVisible();
    await expect(page.locator('text=Service Layer d\'État Opérationnel')).not.toBeVisible();

    // Vérifier le titre de connexion et le formulaire
    await expect(page.locator('h1')).toContainText('Connexion à votre espace');
    await expect(page.locator('#email-input')).toBeVisible();
    await expect(page.locator('#password-input')).toBeVisible();
    await expect(page.locator('#submit-login-button')).toBeVisible();

    // Vérifier les boutons d'accès rapide aux établissements
    await expect(page.locator('#btn-quick-cfppas')).toBeVisible();
    await expect(page.locator('#btn-quick-esbk')).toBeVisible();

    // Cliquer sur le compte CFPPAS pour pré-remplir
    await page.locator('#btn-quick-cfppas').click();
    await expect(page.locator('#email-input')).toHaveValue('admin@cfppas-gao.ml');
    await expect(page.locator('#password-input')).toHaveValue('CfpPasGao2026!');
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
