import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { DashboardPage } from '../pages/DashboardPage';
import { ReportPage } from '../pages/ReportPage';

// Read session storage saved during global-setup (login done once)
const sessionFile = path.resolve(__dirname, '../.auth/session.json');
const getSession = () => fs.existsSync(sessionFile) ? JSON.parse(fs.readFileSync(sessionFile, 'utf-8')) : {};

test.describe('OomniEye Theme Consistency Test Suite', () => {

  /**
   * Before each test:
   * 1. Inject saved session into browser sessionStorage
   * 2. Navigate directly to Dashboard without having to type username/password every time
   */
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((savedSession) => {
      for (const [key, value] of Object.entries(savedSession)) {
        window.sessionStorage.setItem(key, value as string);
      }
    }, getSession());

    await page.goto('/#/dashboard/overview');
    const dashboard = new DashboardPage(page);
    await dashboard.assertLoaded();
  });

  // ==========================================
  // TH-01: Change theme from Dashboard
  // ==========================================
  test('TH-01 selected theme applies on Dashboard', async ({ page }, testInfo) => {
    const dashboard = new DashboardPage(page);
    
    // 1. Get initial theme and toggle to opposite theme
    const initialTheme = await dashboard.getTheme();
    const updatedTheme = await dashboard.toggleTheme();

    // 2. Assert theme changed
    expect(updatedTheme).not.toBe(initialTheme);

    // 3. Attach screenshot
    await testInfo.attach('th01-dashboard-theme-applied', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
  });

  // ==========================================
  // TH-02: Open Report Module after changing theme
  // ==========================================
  test('TH-02 Report reflects selected theme', async ({ page }, testInfo) => {
    const dashboard = new DashboardPage(page);
    const report = new ReportPage(page);

    // 1. Toggle theme on Dashboard
    const appliedTheme = await dashboard.toggleTheme();

    // 2. Navigate to Report Builder
    await dashboard.openReport();
    await report.assertLoaded();

    // 3. Assert Report reflects the applied theme
    const reportTheme = await report.getTheme();
    expect(reportTheme).toBe(appliedTheme);

    // 4. Attach screenshot
    await testInfo.attach('th02-report-reflects-theme', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
  });

  // ==========================================
  // TH-03: Refresh Report Module
  // ==========================================
  test('TH-03 Report retains theme after refresh', async ({ page }, testInfo) => {
    const dashboard = new DashboardPage(page);
    const report = new ReportPage(page);

    // 1. Set theme and open Report Module
    const appliedTheme = await dashboard.toggleTheme();
    await dashboard.openReport();
    await report.assertLoaded();

    // 2. Refresh page
    await page.reload();
    await report.assertLoaded();

    // 3. Assert theme remains consistent after refresh
    const refreshedTheme = await report.getTheme();
    expect(refreshedTheme).toBe(appliedTheme);

    // 4. Attach screenshot
    await testInfo.attach('th03-report-retains-theme-after-refresh', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
  });

  // ==========================================
  // TH-04: Navigate Dashboard -> Report -> Dashboard
  // ==========================================
  test('TH-04 Dashboard -> Report -> Dashboard maintains theme', async ({ page }, testInfo) => {
    const dashboard = new DashboardPage(page);
    const report = new ReportPage(page);

    // 1. Set theme and navigate to Report
    const appliedTheme = await dashboard.toggleTheme();
    await dashboard.openReport();
    await report.assertLoaded();
    expect(await report.getTheme()).toBe(appliedTheme);

    // 2. Navigate back to Dashboard
    await page.goto('/#/dashboard/overview');
    await dashboard.assertLoaded();

    // 3. Assert theme is still maintained on Dashboard
    const returnedTheme = await dashboard.getTheme();
    expect(returnedTheme).toBe(appliedTheme);

    // 4. Attach screenshot
    await testInfo.attach('th04-dashboard-maintains-theme', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
  });

  // ==========================================
  // TH-05: Change theme again and reopen Report Module
  // ==========================================
  test('TH-05 change to second theme, reopen Report', async ({ page }, testInfo) => {
    const dashboard = new DashboardPage(page);
    const report = new ReportPage(page);

    // 1. First theme change
    const firstTheme = await dashboard.toggleTheme();
    await dashboard.openReport();
    await report.assertLoaded();
    expect(await report.getTheme()).toBe(firstTheme);

    // 2. Return to Dashboard and toggle to second theme
    await page.goto('/#/dashboard/overview');
    await dashboard.assertLoaded();
    const secondTheme = await dashboard.toggleTheme();
    expect(secondTheme).not.toBe(firstTheme);

    // 3. Reopen Report Module and verify latest theme
    await dashboard.openReport();
    await report.assertLoaded();
    expect(await report.getTheme()).toBe(secondTheme);

    // 4. Attach screenshot
    await testInfo.attach('th05-report-second-theme-reflected', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
  });

  // ==========================================
  // TH-06: Open Report Module directly or in a new tab
  // ==========================================
  test('TH-06 Open Report Module directly or in a new tab', async ({ page }, testInfo) => {
    const dashboard = new DashboardPage(page);

    // 1. Set active theme on Dashboard
    const activeTheme = await dashboard.toggleTheme();

    // 2. Open Report in a new browser tab within same session
    const newTab = await page.context().newPage();
    try {
      // Inject session in new tab
      await newTab.addInitScript((savedSession) => {
        for (const [key, value] of Object.entries(savedSession)) {
          window.sessionStorage.setItem(key, value as string);
        }
      }, getSession());

      await newTab.goto('/#/dashboard/reports');
      const newTabReport = new ReportPage(newTab);
      await newTabReport.assertLoaded();

      // 3. Verify new tab carries active theme
      const newTabTheme = await newTabReport.getTheme();
      expect(newTabTheme).toBe(activeTheme);

      // 4. Attach screenshot of Report Module in the new tab
      await testInfo.attach('th06-new-tab-report-module-screenshot', {
        body: await newTab.screenshot({ fullPage: true }),
        contentType: 'image/png',
      });
    } finally {
      await newTab.close();
    }
  });

  // ==========================================
  // TH-07: Inspect key Report Module UI elements
  // ==========================================
  test('TH-07 Report elements remain present and reviewable', async ({ page }, testInfo) => {
    const dashboard = new DashboardPage(page);
    const report = new ReportPage(page);

    // 1. Toggle theme and open Report Module
    await dashboard.toggleTheme();
    await dashboard.openReport();
    await report.assertLoaded();

    // 2. Inspect UI elements
    await report.inspectUI();

    // 3. Attach full review screenshot
    await testInfo.attach('th07-report-ui-elements-reviewable', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
  });

  // ==========================================
  // TH-08: Simulate failed preference update or unsupported selection
  // ==========================================
  test('TH-08 Simulate a failed preference update or unsupported selection', async ({ page }, testInfo) => {
    const dashboard = new DashboardPage(page);
    const initialTheme = await dashboard.getTheme();

    // 1. Simulate network failure for theme/preference API routes
    await page.route('**/api/**/theme*', route => route.abort('failed'));
    await page.route('**/api/**/preference*', route => route.abort('failed'));

    // 2. Simulate unsupported theme selection (e.g. invalid theme name)
    await expect(async () => {
      await dashboard.setTheme('InvalidCustomThemeXYZ');
    }).rejects.toThrow();

    // 3. Verify application maintains consistent theme without crashing or corruption
    const currentTheme = await dashboard.getTheme();
    expect(currentTheme).toBe(initialTheme);

    // 4. Verify valid theme switch still recovers and works gracefully
    const recoveredTheme = await dashboard.toggleTheme();
    expect(recoveredTheme).not.toBe(initialTheme);

    // 5. Attach screenshot
    await testInfo.attach('th08-simulated-error-handling-theme', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
  });

});
