import type { Locator, Page } from '@playwright/test';
import type { Selector } from '../config/app-model';

export function locate(page: Page, spec: Selector): Locator {
  switch (spec.kind) {
    case 'role': return page.getByRole(spec.role, { name: spec.value, exact: true });
    case 'label': return page.getByLabel(spec.value, { exact: true });
    case 'testid': return page.getByTestId(spec.value);
    case 'css': return page.locator(spec.value);
  }
}
