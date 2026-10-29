import { test, expect, type Page } from '@playwright/test';
import { model } from '../config/app-model';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ReportPage } from '../pages/ReportPage';
import type { ThemeState } from '../pages/BasePage';

const options = model.theme.options.map(o => o.name);
const verified = process.env.APP_MODEL_VERIFIED === 'true';

test.describe('OomniEye theme consistency', () => {
  test.skip(!verified, 'Exploratory mapping required: update config/app-model.ts and APP_MODEL_VERIFIED=true.');
  test.beforeEach(async ({ page }) => { await new LoginPage(page).signIn(); });

  async function applyDistinctTheme(page: Page) {
    const dashboard = new DashboardPage(page);
    const original = await dashboard.getThemeState();
    for (const name of options) {
      await dashboard.setTheme(name);
      const next = await dashboard.getThemeState();
      if (JSON.stringify(next) !== JSON.stringify(original)) return { name, state: next, original };
    }
    throw new Error('No configured theme changed the observed DOM/computed-style signature. Check config and baseline.');
  }
  function assertSameTheme(actual: ThemeState, expected: ThemeState, context: string) {
    expect(actual.colorScheme, `${context}: color scheme should match`).toBe(expected.colorScheme);
    expect(actual.color, `${context}: text color should match`).toBe(expected.color);
  }

  test('TH-01 selected theme applies on Dashboard', async ({ page }, testInfo) => {
    await applyDistinctTheme(page);
    await testInfo.attach('th01-dashboard-selected-theme', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
  });
  test('TH-02 Report reflects selected theme', async ({ page }, testInfo) => {
    const dashboard = new DashboardPage(page);
    const { state } = await applyDistinctTheme(page);
    await dashboard.openReport();
    const report = new ReportPage(page);
    await report.assertLoaded();
    assertSameTheme(await report.getThemeState(), state, 'Report navigation');
    await testInfo.attach('th02-report-module-selected-theme', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
  });
  test('TH-03 Report retains theme after refresh', async ({ page }, testInfo) => {
    const dashboard = new DashboardPage(page);
    const { state } = await applyDistinctTheme(page);
    await dashboard.openReport();
    const report = new ReportPage(page);
    await report.assertLoaded();
    await page.reload();
    await report.assertLoaded();
    assertSameTheme(await report.getThemeState(), state, 'Report refresh');
    await testInfo.attach('th03-report-retains-theme-after-refresh', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
  });
  test('TH-04 Dashboard → Report → Dashboard maintains theme', async ({ page }, testInfo) => {
    const dashboard = new DashboardPage(page);
    const { state } = await applyDistinctTheme(page);
    await dashboard.openReport();
    const report = new ReportPage(page);
    await report.assertLoaded();
    assertSameTheme(await report.getThemeState(), state, 'Report');
    await testInfo.attach('th04-report-module-before-return', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
    await page.goto(model.routes.dashboard);
    await dashboard.assertLoaded();
    assertSameTheme(await dashboard.getThemeState(), state, 'Return to Dashboard');
    await testInfo.attach('th04-dashboard-returned-maintains-theme', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
  });
  test('TH-05 change to second theme, reopen Report', async ({ page }, testInfo) => {
    test.skip(options.length < 2, 'Only one verified theme is supported.');
    const dashboard = new DashboardPage(page);
    const first = await applyDistinctTheme(page);
    const secondName = options.find(name => name !== first.name)!;
    await dashboard.setTheme(secondName);
    const second = await dashboard.getThemeState();
    expect(second, 'Second theme should differ from first').not.toEqual(first.state);
    await dashboard.openReport();
    const report = new ReportPage(page);
    await report.assertLoaded();
    assertSameTheme(await report.getThemeState(), second, 'Report after second update');
    await testInfo.attach('th05-report-second-theme-reflected', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
  });
  test('TH-06 Open Report Module directly or in a new tab', async ({ page }, testInfo) => {
    const { state } = await applyDistinctTheme(page);
    await new DashboardPage(page).openReport();

    // Open Report Module in a new tab within the same authenticated context
    const newTab = await page.context().newPage();
    try {
      await new LoginPage(newTab).signIn();
      const dashboard = new DashboardPage(newTab);
      await dashboard.openReport();
      const report = new ReportPage(newTab);
      await report.assertLoaded();
      assertSameTheme(await report.getThemeState(), state, 'New tab Report module');

      // Explicitly attach screenshot of the NEW TAB showing the Report Module in the selected theme
      await testInfo.attach('th06-new-tab-report-module-screenshot', {
        body: await newTab.screenshot({ fullPage: true }),
        contentType: 'image/png',
      });
    } finally {
      await newTab.close();
    }
  });
  test('TH-07 Report elements remain present and reviewable', async ({ page }, testInfo) => {
    const dashboard = new DashboardPage(page);
    await applyDistinctTheme(page);
    await dashboard.openReport();
    const report = new ReportPage(page);
    await report.assertLoaded();
    await report.inspectUI();
    await testInfo.attach('th07-report-ui-elements-reviewable', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
  });
  test('TH-08 Simulate a failed preference update or unsupported selection', async ({ page }, testInfo) => {
    // 1. Simulate network failure for preference API endpoints
    await page.route('**/api/**/theme*', route => route.abort('failed'));
    await page.route('**/api/**/preference*', route => route.abort('failed'));

    const dashboard = new DashboardPage(page);
    const original = await dashboard.getThemeState();

    // 2. Simulate unsupported theme selection
    await expect(async () => {
      await dashboard.setTheme('NonExistentThemeXYZ');
    }).rejects.toThrow();

    // 3. Verify application maintains consistent state without crashing or corrupted styles
    const consistentState = await dashboard.getThemeState();
    expect(consistentState.colorScheme).toBe(original.colorScheme);

    // 4. Verify valid theme switch still works properly
    const targetTheme = original.colorScheme === 'dark' ? 'Light' : 'Dark';
    await dashboard.setTheme(targetTheme);
    const next = await dashboard.getThemeState();
    expect(next.colorScheme, 'Theme changes gracefully without an inconsistent state').not.toBe(original.colorScheme);
    await testInfo.attach('th08-simulated-error-handling-theme', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
  });
});
