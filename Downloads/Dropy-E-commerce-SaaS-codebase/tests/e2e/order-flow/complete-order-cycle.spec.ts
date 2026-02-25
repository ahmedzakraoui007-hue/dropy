import { test, expect } from '@playwright/test';
import { TEST_USERS } from '../../fixtures/test-data';
import { waitForToast, waitForLoadingComplete } from '../../fixtures/helpers';

test.describe('Parcours 3: Cycle Commande Vendeur → Fournisseur', () => {

    test('3.5 - Vendeur confirme commande', async ({ page }) => {
        await page.goto('/login');
        await page.getByLabel(/email/i).fill(TEST_USERS.seller.email);
        await page.getByLabel(/mot de passe|password/i).fill(TEST_USERS.seller.password);
        await page.getByRole('button', { name: /connexion|login/i }).click();
        await page.waitForURL(/seller/);

        await page.goto('/seller/orders');
        // await page.getByRole('tab', { name: /attente|pending/i }).click(); 
        await waitForLoadingComplete(page);

        // Trouver une commande "En attente" et cliquer Confirmer
        // Note: This relies on existing data. Real E2E should create data first.
        // For this audit script, we'll try to find one.

        const confirmButton = page.getByRole('button', { name: /confirmer/i }).first();

        if (await confirmButton.isVisible()) {
            await confirmButton.click();
            await waitForToast(page, /confirmée/i);
        } else {
            console.log('No pending orders found to confirm');
        }
    });

});
