import { expect, type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { model } from '../config/app-model';
import { locate } from '../utils/locators';

export class ReportPage extends BasePage {
  readonly reportHeading: Locator;
  readonly reportRoot: Locator;

  constructor(page: Page) {
    super(page);
    this.reportHeading = locate(page, model.report.ready);
    this.reportRoot = locate(page, model.report.root);
  }

  async assertLoaded() {
    await expect(this.reportHeading).toBeVisible();
  }
  async inspectUI(): Promise<void> {
    const root = locate(this.page, model.report.root);
    await expect(root).toBeVisible();
    const sample = async (selector: string) => this.page.locator(selector).evaluateAll(elements =>
      elements.slice(0, 30).filter(el => {
        const rect = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        return rect.width > 0 && rect.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0;
      }).map(el => {
        const s = getComputedStyle(el);
        return { tag: el.tagName, color: s.color, background: s.backgroundColor,
          visibility: s.visibility, opacity: s.opacity };
      })
    );
    const controls = await sample('button, input, select, textarea, [role="button"]');
    for (const element of controls) {
      expect(element.visibility, `${element.tag} should not be hidden`).not.toBe('hidden');
      expect(Number(element.opacity), `${element.tag} should not be transparent`).toBeGreaterThan(0);
    }
    // Readability requires manual screenshot review and/or verified color contrast
    // against effective (possibly inherited/translucent) backgrounds.
    await this.page.screenshot({ path: 'test-results/report-ui-review.png', fullPage: true });
  }
}
