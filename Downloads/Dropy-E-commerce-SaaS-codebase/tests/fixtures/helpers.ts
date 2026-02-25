import { Page, expect } from '@playwright/test';

export async function waitForToast(page: Page, text?: string | RegExp) {
    const toast = page.locator('[data-sonner-toast], [role="status"], li[data-sonner-toast]'); // Adjusted selector for Sonner
    await expect(toast.first()).toBeVisible({ timeout: 10000 });
    if (text) {
        await expect(toast.first()).toContainText(text);
    }
}

export async function waitForLoadingComplete(page: Page) {
    // Attendre que les skeletons disparaissent
    await page.waitForSelector('[data-loading="true"]', { state: 'detached', timeout: 5000 }).catch(() => { });
    // Attendre que les spinners disparaissent
    await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 5000 }).catch(() => { });
}

export async function selectFromDropdown(page: Page, label: string, value: string) {
    await page.getByLabel(label).click();
    await page.getByRole('option', { name: value }).click();
}

export async function uploadFile(page: Page, selector: string, filePath: string) {
    const fileInput = page.locator(selector);
    await fileInput.setInputFiles(filePath);
}

export async function fillCheckoutForm(page: Page, customer: typeof import('./test-data').TEST_USERS.customer) {
    await page.getByLabel(/nom|name/i).last().fill(customer.name); // Using last() as there might be generic name inputs
    await page.getByLabel(/téléphone|phone/i).fill(customer.phone);
    // await page.getByLabel(/gouvernorat/i).selectOption(customer.governorate); // Select might be a custom component
    // If custom select:
    // await page.getByLabel(/gouvernorat/i).click();
    // await page.getByText(customer.governorate).click();

    await page.getByLabel(/ville|city/i).fill(customer.city);
    await page.getByLabel(/adresse|address/i).fill(customer.address);
    await page.getByLabel(/Postal/i).fill('1000');
}

export function generateUniqueEmail(prefix: string) {
    return `${prefix}-${Date.now()}@test.dropy.tn`;
}
