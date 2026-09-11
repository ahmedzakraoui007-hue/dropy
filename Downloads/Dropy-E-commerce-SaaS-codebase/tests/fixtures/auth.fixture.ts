import { test as base, Page } from '@playwright/test';
import { TEST_USERS } from './test-data';

type AuthFixtures = {
    sellerPage: Page;
    supplierPage: Page;
    creatorPage: Page;
    authenticatedAsRole: (role: 'seller' | 'supplier' | 'creator' | 'admin') => Promise<Page>;
};
type AuthRole = 'seller' | 'supplier' | 'creator' | 'admin';

export const test = base.extend<AuthFixtures>({
    sellerPage: async ({ browser }, use) => {
        const context = await browser.newContext();
        const page = await context.newPage();
        await loginAs(page, 'seller');
        await use(page);
        await context.close();
    },

    supplierPage: async ({ browser }, use) => {
        const context = await browser.newContext();
        const page = await context.newPage();
        await loginAs(page, 'supplier');
        await use(page);
        await context.close();
    },

    authenticatedAsRole: async ({ browser }, use) => {
        const authenticate = async (role: AuthRole) => {
            const context = await browser.newContext();
            const page = await context.newPage();
            await loginAs(page, role);
            return page;
        };
        await use(authenticate);
    },
});

async function loginAs(page: Page, role: AuthRole) {
    const user = TEST_USERS[role];
    // Assuming the user already exists. If not, tests might fail if seeds aren't run.
    // We might want to handle registration if login fails, but let's stick to the prompt.
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(user.email);
    await page.getByLabel(/mot de passe|password/i).fill(user.password);
    await page.getByRole('button', { name: /connexion|se connecter|login/i }).click();

    // Attendre redirection vers dashboard
    // Using a more lenient regex matching for dashboard URLs
    await page.waitForURL(new RegExp(`/${role}/|/${role}`), { timeout: 15000 });
}

export { expect } from '@playwright/test';
