import { expect, type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * ReportPage represents the OomniEye Report Module (Report Builder).
 * Contains locators and actions specific to the Report Module.
 */
export class ReportPage extends BasePage {
  // 1. Locators defined at top (Page Factory / Page Object pattern)
  readonly reportHeading: Locator;
  readonly tableContainer: Locator;

  constructor(page: Page) {
    super(page);
    this.reportHeading = page.getByRole('heading', { name: 'Reports', exact: true });
    this.tableContainer = page.locator('table, [role="grid"], main');
  }

  /**
   * Asserts that the Report Module has successfully loaded.
   */
  async assertLoaded(): Promise<void> {
    await expect(this.reportHeading).toBeVisible();
  }

  /**
   * Inspects key Report UI elements (heading and table/content) for visibility and readiness.
   */
  async inspectUI(): Promise<void> {
    await expect(this.reportHeading).toBeVisible();
    await expect(this.tableContainer.first()).toBeVisible();
  }
}
