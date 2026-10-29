import { expect, type Page } from '@playwright/test';
import { model } from '../config/app-model';
import { locate } from '../utils/locators';

export class BasePage {
  constructor(readonly page: Page) {}
  async getThemeState(): Promise<ThemeState> {
    const root = locate(this.page, model.theme.stateRoot);
    await expect(root, 'Theme state root must be visible').toBeVisible();
    return root.evaluate((element, attribute) => {
      const style = getComputedStyle(element);
      return {
        attribute: attribute ? element.getAttribute(attribute) : null,
        className: element.className?.toString() ?? '',
        backgroundColor: style.backgroundColor,
        color: style.color,
        colorScheme: style.colorScheme,
      };
    }, model.theme.attribute);
  }
  async setTheme(name: string): Promise<void> {
    const option = model.theme.options.find(x => x.name === name);
    if (!option) throw new Error(`Unsupported configured theme: ${name}`);

    const current = await this.getThemeState();
    const isDark = current.colorScheme === 'dark';
    const wantsDark = name.toLowerCase() === 'dark';

    if (wantsDark !== isDark) {
      const toggle = this.page.locator('[data-hms-context="app-theme-toggle"]');
      if (await toggle.isVisible()) {
        await toggle.click();
      } else {
        await locate(this.page, model.theme.settingsTrigger).click();
        await locate(this.page, option.choice).click();
        if (model.theme.save) await locate(this.page, model.theme.save).click();
      }
      await this.page.waitForFunction(
        (targetDark) => {
          const scheme = getComputedStyle(document.body).colorScheme;
          return targetDark ? scheme === 'dark' : scheme !== 'dark';
        },
        wantsDark,
        { timeout: 5000 }
      );
    }
  }
}
export type ThemeState = {
  attribute: string | null;
  className: string;
  backgroundColor: string;
  color: string;
  colorScheme: string;
};
