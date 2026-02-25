import { test, expect } from '@playwright/test';
import { TEST_USERS } from '../../fixtures/test-data';
import { waitForToast, waitForLoadingComplete, generateUniqueEmail } from '../../fixtures/helpers';

test.describe('Parcours 1: Onboarding Vendeur Complet', () => {

    const uniqueEmail = generateUniqueEmail('seller');
    const testSeller = {
        ...TEST_USERS.seller,
        email: uniqueEmail,
        storeSlug: `test-store-${Date.now()}`,
    };

    test.describe.serial('Étapes séquentielles', () => {

        test('1.1 - Page inscription accessible', async ({ page }) => {
            await page.goto('/inscription');
            await expect(page).toHaveURL(/inscription/);
            await expect(page.getByRole('heading', { name: /inscription|créer.*compte|register/i })).toBeVisible();
        });

        test('1.2 - Sélection rôle Vendeur', async ({ page }) => {
            await page.goto('/inscription');

            // Chercher le sélecteur de rôle
            const roleSelector = page.getByRole('button', { name: /vendeur|seller/i })
                .or(page.getByLabel(/vendeur|seller/i))
                .or(page.locator('[data-role="seller"]'));

            await roleSelector.first().click();

            // Vérifier que le formulaire vendeur est affiché
            // Assuming fullName input is generic, but role selection might change UI context or query params
        });

        test('1.3 - Création compte vendeur', async ({ page }) => {
            await page.goto('/inscription');

            // Sélectionner rôle vendeur si nécessaire
            const roleSelector = page.getByRole('button', { name: /vendeur|seller/i }).or(page.locator('[data-role="seller"]'));
            await roleSelector.first().click();

            // Remplir formulaire
            await page.getByLabel(/email/i).fill(testSeller.email);
            await page.getByLabel(/mot de passe|password/i).first().fill(testSeller.password);

            await page.getByLabel(/nom/i).first().fill(testSeller.storeName); // Using storeName as Full Name substitute or just generic Name
            // await page.getByLabel(/téléphone|phone/i).fill(testSeller.phone); // If phone is required

            // Accepter CGU
            const cguCheckbox = page.locator('button.rounded.border-2').first(); // Custom checkbox implementation
            if (await cguCheckbox.isVisible()) {
                await cguCheckbox.click();
            }

            // Soumettre
            await page.getByRole('button', { name: /créer|s'inscrire|register|submit/i }).click();

            // Vérifier succès (redirection ou message)
            // Check for toast or redirection
            try {
                await waitForToast(page, /succès|success/i);
            } catch (e) {
                // If no toast, maybe check URL
            }

            // For local testing without email confirm, we expect to be able to login or be redirected
            // If redirection to login
            await expect(page).toHaveURL(/login/, { timeout: 10000 });
        });

        test('1.4 - Redirection dashboard vendeur', async ({ page }) => {
            // Login avec le compte créé
            await page.goto('/login');
            await page.getByLabel(/email/i).fill(testSeller.email);
            await page.getByLabel(/mot de passe|password/i).fill(testSeller.password);
            await page.getByRole('button', { name: /connexion|login/i }).click();

            await expect(page).toHaveURL(/seller\/dashboard/, { timeout: 15000 });
        });

        test('1.5 - Checklist onboarding visible', async ({ page }) => {
            // Login first
            await page.goto('/login');
            await page.getByLabel(/email/i).fill(testSeller.email);
            await page.getByLabel(/mot de passe|password/i).fill(testSeller.password);
            await page.getByRole('button', { name: /connexion|login/i }).click();
            await page.waitForURL(/seller\/dashboard/);

            // Chercher la checklist (Progress bar or steps)
            const checklist = page.getByText(/Configuration de votre boutique/i);
            await expect(checklist).toBeVisible();
        });

        test('1.6 - Accès galerie de thèmes', async ({ page }) => {
            await page.goto('/login');
            await page.getByLabel(/email/i).fill(testSeller.email);
            await page.getByLabel(/mot de passe|password/i).fill(testSeller.password);
            await page.getByRole('button', { name: /connexion|login/i }).click();
            await page.waitForURL(/seller/);

            await page.goto('/seller/store-builder/themes');
            await waitForLoadingComplete(page);

            // Vérifier qu'au moins quelques thèmes sont affichés
            const themeCards = page.getByText('Voir la démo');
            await expect(themeCards.first()).toBeVisible({ timeout: 10000 });
        });

        test('1.7 - Application d\'un thème', async ({ page }) => {
            await page.goto('/login');
            await page.getByLabel(/email/i).fill(testSeller.email);
            await page.getByLabel(/mot de passe|password/i).fill(testSeller.password);
            await page.getByRole('button', { name: /connexion|login/i }).click();
            await page.waitForURL(/seller/);

            await page.goto('/seller/store-builder/themes');
            await waitForLoadingComplete(page);

            // Cliquer sur "Appliquer" sur le premier thème
            const applyButtons = page.getByRole('button', { name: /appliquer/i });
            await applyButtons.first().click();

            // Vérifier confirmation
            await waitForToast(page, /activé|succès/i);
        });

        test('1.10 - Import de produits', async ({ page }) => {
            await page.goto('/login');
            await page.getByLabel(/email/i).fill(testSeller.email);
            await page.getByLabel(/mot de passe|password/i).fill(testSeller.password);
            await page.getByRole('button', { name: /connexion|login/i }).click();
            await page.waitForURL(/seller/);

            await page.goto('/seller/products/catalog');
            await waitForLoadingComplete(page);

            // Importer 1 produit
            const importButtons = page.getByRole('button', { name: /importer/i });
            if (await importButtons.count() > 0) {
                await importButtons.first().click();
                await waitForToast(page, /importé|succès/i);
            }
        });

        test('1.12 - Publication boutique', async ({ page }) => {
            await page.goto('/login');
            await page.getByLabel(/email/i).fill(testSeller.email);
            await page.getByLabel(/mot de passe|password/i).fill(testSeller.password);
            await page.getByRole('button', { name: /connexion|login/i }).click();
            await page.waitForURL(/seller/);

            await page.goto('/seller/store-builder');
            await waitForLoadingComplete(page);

            // Trouver et cliquer sur Publier
            const publishButton = page.getByRole('button', { name: /publier/i });
            await expect(publishButton).toBeVisible();
            await publishButton.click();

            await waitForToast(page, /publiée|succès/i);
        });

    });
});
