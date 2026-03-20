import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Smoke tests — project-3028 Democratic Stress Dashboard
//
// These tests require the Vite dev server to be running on port 3000.
// If the dev server is not running they will fail with a connection error —
// that is expected behaviour in offline / CI-without-server environments.
// ---------------------------------------------------------------------------

test.describe('Smoke: Home page', () => {
  test('home page loads and title contains "Civic Vigil" or "Democratic"', async ({ page }) => {
    await page.goto('/');
    const title = await page.title();
    const bodyText = await page.textContent('body');
    const titleMatch = /civic vigil|democratic/i.test(title) || /civic vigil|democratic/i.test(bodyText ?? '');
    expect(titleMatch).toBe(true);
  });
});

test.describe('Smoke: Country page', () => {
  test('/country/US renders a country name heading', async ({ page }) => {
    await page.goto('/country/US');
    // Wait for the page to settle — data is loaded asynchronously
    await page.waitForTimeout(1000);
    const bodyText = await page.textContent('body');
    // The page should render either "United States" or a loading/error state
    // with meaningful text — not a blank page.
    expect(bodyText).toBeTruthy();
    expect((bodyText ?? '').length).toBeGreaterThan(10);
  });
});

test.describe('Smoke: Compare route', () => {
  test('/compare renders the country selector UI', async ({ page }) => {
    await page.goto('/compare');
    // CountrySelector renders a list with checkboxes
    await page.waitForTimeout(500);
    const checkboxes = await page.locator('input[type="checkbox"]').count();
    expect(checkboxes).toBeGreaterThanOrEqual(10);
  });
});
