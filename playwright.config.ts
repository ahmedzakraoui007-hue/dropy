import { defineConfig, devices } from '@playwright/test';

const PORT = process.env.PORT || '3000';
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

export default defineConfig({
    testDir: './tests/e2e',
    timeout: 120 * 1000, // 2 minutes per test
    expect: {
        timeout: 30 * 1000,
    },
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: [
        ['html', { open: 'never' }],
        ['list']
    ],
    use: {
        baseURL: BASE_URL,
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        // Mobile commented out to save time for now, or keep it? 
        // User asked for validation. Let's keep it but maybe workers=1 to avoid load?
        {
            name: 'mobile',
            use: { ...devices['iPhone 13'] },
        },
    ],
    webServer: {
        command: 'npm run dev',
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
        env: {
            PORT: PORT,
        }
    },
});
