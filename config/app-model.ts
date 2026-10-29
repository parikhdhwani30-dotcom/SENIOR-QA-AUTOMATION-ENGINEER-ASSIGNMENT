/**
 * PLACEHOLDERS, NOT VERIFIED SELECTORS. Inspect the application first.
 * Prefer accessible roles/names, labels or app-owned test IDs when observed.
 * Keep real supported themes and theme-state signals here, not in tests.
 */
export const model = {
  routes: { dashboard: '/#/dashboard/overview', report: process.env.REPORT_PATH ?? '/#/dashboard/reports' },
  login: {
    username: { kind: 'label', value: 'Email address' },
    password: { kind: 'label', value: 'Password' },
    submit: { kind: 'role', role: 'button', value: 'Sign in' }
  },
  dashboard: {
    ready: { kind: 'role', role: 'link', value: 'Dashboard' },
    reportNavigation: { kind: 'role', role: 'link', value: 'Report Builder' }
  },
  report: {
    ready: { kind: 'role', role: 'heading', value: 'Reports' },
    root: { kind: 'css', value: 'main' },
    table: { kind: 'css', value: 'table, [role="grid"]' },
    interactive: { kind: 'css', value: 'button, input, select, textarea' },
    dialogTrigger: null as Selector | null,
  },
  theme: {
    settingsTrigger: { kind: 'css', value: '[data-hms-context="app-theme-toggle"]' },
    // Choose a stable root, e.g. body or app root that changes when theme changes.
    stateRoot: { kind: 'css', value: 'body' },
    options: [
      { name: 'Light', choice: { kind: 'css', value: '[data-hms-context="app-theme-toggle"]' } },
      { name: 'Dark', choice: { kind: 'css', value: '[data-hms-context="app-theme-toggle"]' } }
    ],
    // When observed, supply a stable selector AND an expected DOM/class/style token.
    // For style changes without tokens, computed-style snapshots are also compared.
    attribute: null as string | null,
    expectedAttributeValues: {} as Record<string, string>,
    save: null as Selector | null
  }
} as const satisfies Record<string, unknown>;

export type Selector =
  | { kind: 'role'; role: 'button' | 'link' | 'heading' | 'menuitem' | 'radio'; value: string }
  | { kind: 'label'; value: string }
  | { kind: 'testid'; value: string }
  | { kind: 'css'; value: string };
