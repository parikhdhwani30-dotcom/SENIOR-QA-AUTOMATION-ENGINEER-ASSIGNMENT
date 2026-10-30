import { expect, type Page, type Locator } from '@playwright/test';

/**
 * BasePage provides shared functionality for all pages:
 * - Page reference
 * - Reading current theme ('dark' or 'light')
 * - Toggling theme via the header button
 */
export class BasePage {
  readonly page: Page;
  readonly themeToggleBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.themeToggleBtn = page.locator('[data-hms-context="app-theme-toggle"]');
  }

  /**
   * Reads the current theme ('dark' or 'light') from the document body computed style.
   */
  async getTheme(): Promise<string> {
    await expect(this.page.locator('body')).toBeVisible();
    return await this.page.locator('body').evaluate((el) => {
      return getComputedStyle(el).colorScheme || 'dark';
    });
  }

  /**
   * Toggles between Dark and Light theme by clicking the theme toggle button.
   * Returns the new active theme.
   */
  async toggleTheme(): Promise<string> {
    await this.themeToggleBtn.click();
    // Short wait for CSS color-scheme transition to apply
    await this.page.waitForTimeout(500);
    return await this.getTheme();
  }

  /**
   * Sets a specific theme by name ('Dark' or 'Light').
   * Throws an error if an unsupported theme name is provided.
   */
  async setTheme(themeName: string): Promise<void> {
    const validThemes = ['Dark', 'Light'];
    if (!validThemes.includes(themeName)) {
      throw new Error(`Unsupported theme requested: ${themeName}`);
    }

    const current = await this.getTheme();
    const wantsDark = themeName.toLowerCase() === 'dark';
    const isDark = current.toLowerCase() === 'dark';

    if (wantsDark !== isDark) {
      await this.toggleTheme();
    }
  }
}
