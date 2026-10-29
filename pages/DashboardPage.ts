import { expect, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { model } from '../config/app-model';
import { locate } from '../utils/locators';

export class DashboardPage extends BasePage {
  constructor(page: Page) { super(page); }
  async assertLoaded() { await expect(locate(this.page, model.dashboard.ready)).toBeVisible(); }
  async openReport() {
    await locate(this.page, model.dashboard.reportNavigation).click();
  }
}
