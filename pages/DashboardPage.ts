import { expect, type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * DashboardPage represents the OomniEye Dashboard view.
 * Contains locators and actions specific to the Dashboard.
 */
export class DashboardPage extends BasePage {
  // 1. Locators defined at top (Page Factory / Page Object pattern)
  readonly dashboardLink: Locator;
  readonly reportBuilderLink: Locator;

  constructor(page: Page) {
    super(page);
    this.dashboardLink = page.getByRole('link', { name: 'Dashboard' });
    this.reportBuilderLink = page.getByRole('link', { name: 'Report Builder' });
  }

  /**
   * Asserts that the Dashboard page has successfully loaded.
   */
  async assertLoaded(): Promise<void> {
    await expect(this.dashboardLink).toBeVisible();
  }

  /**
   * Clicks on the Report Builder link in the sidebar navigation.
   */
  async openReport(): Promise<void> {
    await this.reportBuilderLink.click();
  }
}
