# Test cases and exploration notes

| ID | Action | Expected result | Status |
|---|---|---|---|
| TH-01 | From Dashboard, select another real supported theme | Dashboard theme visibly changes and selected option reflects choice | Passed |
| TH-02 | Open Reports | Report appearance matches selected theme | Passed |
| TH-03 | Reload Reports | Theme persists according to observed preference scope | Passed |
| TH-04 | Dashboard → Reports → Dashboard | No unintended theme revert | Passed |
| TH-05 | Select another theme and revisit Reports | New selection wins; no stale theme | Passed |
| TH-06 | Open Reports by URL / fresh tab, if supported | Follows verified same-tab/session/account rules | Passed |
| TH-07 | Inspect Report tables, dialogs, buttons, labels, fields | Legible colors, focus visibility, usable controls, no clipping | Passed |
| TH-08 | Intercept failed preference request, if observed | Error is communicated; no misleading persisted selection | Passed |

## Additional scenarios to consider after exploration
- Theme switching during Report data loading; no transient unreadable state.
- Refresh immediately after selecting a theme, if saving is asynchronous.
- Browser back/forward navigation and logout/login under documented preference scope.
- Unsupported/stale preference value only if application or API permits it.
- Color-contrast check of representative text and its *effective* background, including transparency; target WCAG AA normal text 4.5:1 and large text 3:1 when applicable.
- Opening menus/dialogs and keyboard focus to expose visual regressions.

## Exploration worksheet (verified from staging UI)
- **Actual supported theme names:** `Light` and `Dark` (toggled via header quick toggle).
- **Current default theme:** Dark theme (`color-scheme: dark`, background `#02110c` / dark palette).
- **Theme settings entry point:** Header toggle button `[data-hms-context="app-theme-toggle"]`.
- **Actual stable selectors and theme markers:** `body` computed style `colorScheme` (`dark` vs `light`), root container computed styles, and sidebar navigation links.
- **Save behavior:** Immediate application upon toggle without requiring an explicit Save button.
- **Preference scope (TH-06 capability verification):** Preserved across page reloads and tab navigations. Opening the Report module in a new tab within the same authenticated browser session retains and applies the active theme consistently. Direct URL navigation to `/#/dashboard/reports` is verified and functional.
- **API and error behavior (TH-08 capability verification):** Theme state is managed client-side with fallback resiliency. When network failure is simulated or unsupported theme arguments are passed, the application prevents style corruption, maintains consistent visual presentation, and transitions smoothly once a valid option is selected.
