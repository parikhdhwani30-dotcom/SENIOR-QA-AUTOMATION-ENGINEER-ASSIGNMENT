import { expect, type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { model } from '../config/app-model';
import { locate } from '../utils/locators';

export class DashboardPage extends BasePage {
  readonly dashboardLink: Locator;
  readonly reportBuilderLink: Locator;
  readonly themeToggleBtn: Locator;

  constructor(page: Page) {
    super(page);
    this.dashboardLink = locate(page, model.dashboard.ready);
    this.reportBuilderLink = locate(page, model.dashboard.reportNavigation);
    this.themeToggleBtn = locate(page, model.theme.settingsTrigger);
  }

  async assertLoaded() {
    await expect(this.dashboardLink).toBeVisible();
  }

  async openReport() {
    await this.reportBuilderLink.click();
  }
}
