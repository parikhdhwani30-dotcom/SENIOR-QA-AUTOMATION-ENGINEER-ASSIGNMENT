# OomniEye Theme / Reports — Senior QA Automation Assessment

Playwright + TypeScript + Page Object Model scaffold for TH-01 through TH-08.

> **Verification status:** This project has NOT been calibrated or run against the authenticated OomniEye staging UI. Themes, selectors, route and persistence behavior in `config/app-model.ts` are **explicit examples**, not verified facts. The verification gate intentionally skips automation until exploration is complete. Never claim a pass or confirmed defect from this scaffold.

## 1. Prerequisites
- Node.js 20+
- Git, VS Code
- Staging credentials supplied by the hiring team (never commit them)

## 2. Setup (Windows PowerShell)
```powershell
npm install
npx playwright install chromium
Copy-Item .env.example .env
```
Edit `.env` with your local credentials; `.env` is gitignored. **Never paste credentials into GitHub, test logs or screenshots.**

## 3. Explore and map the actual application
1. Start with `.env` and run `npm run explore` (requires the actual Login selectors to be configured).
2. Inspect login, Dashboard, Report navigation, settings and theme controls using Playwright Inspector (`npx playwright codegen <URL>` is also useful, but avoid exposing secrets in saved scripts).
3. Record actual themes, initial Report appearance, accessible locators and the real theme signal(s) in `docs/test-cases.md`.
4. Replace all `config/app-model.ts` example selectors with verified ones, including login/ready locators, report path and theme options. Verify theme marker (`class`, attribute, or reliable computed styles), plus whether there is a Save action.
5. Observe whether theme preference is browser-tab, browser storage, session, or account-scoped. Use DevTools to inspect *non-sensitive* storage/network requests if needed; do not capture auth tokens.
6. Set `APP_MODEL_VERIFIED=true` only after mapping. Set `DIRECT_REPORT_SUPPORTED` and `ACCOUNT_SCOPED_THEME` only with observed evidence.

**Important assertion design:** `getThemeState` samples the theme-root DOM attribute/class and computed `backgroundColor`, `color`, and `colorScheme`. A theme rooted in descendant CSS variables may require extending this snapshot with the actual app-specific marker, selected option, and relevant Report surface styles. Raw equality across pages may be inappropriate if the theme is intentionally represented differently per module; update tests to assert equivalent semantics with verified expected tokens. Do not assume `data-theme` exists.

## 4. Execute
```powershell
npm run typecheck
npm test
npm run test:headed
npm run report
```
Test results: `playwright-report/` (HTML), `test-results/results.json` (machine-readable), and on failures screenshots/traces/video in `test-results/`. Gitignore protects local evidence and secrets; only include sanitized evidence in submissions.

## 5. Structure
- `config/app-model.ts`: selectors, routes, verified theme options
- `pages/`: Login, Dashboard, Report and shared theme state/actions
- `tests/theme-report.spec.ts`: TH-01 to TH-08
- `utils/locators.ts`: selector abstraction
- `scripts/explore.ts`: optional inspector + restricted control inventory
- `docs/`: scenarios, execution summary and defect log

## 6. Test isolation and stability
- Each test gets a fresh Playwright browser context and logs in via environment variables.
- Worker count is 1 to prevent concurrent server-side theme updates using a shared account.
- **Remaining limitation:** An account-scoped setting may persist between tests. For genuine independent execution, capture the app's selected preference at the start and restore it in `finally` after each test, once the preference can be read reliably. Alternatively use dedicated test accounts with isolated preferences. The current scaffold does not yet guarantee this restoration.
- Prefer accessible role/name and app-owned test IDs over brittle CSS paths.
- Web-first assertions replace arbitrary sleeps. `TH-08` needs an actual observed preference endpoint before implementing safe network interception.
- `TH-07` only checks some visible/opaque controls and captures a review image; **it is not yet a validated accessibility contrast audit**.

## 7. Known gaps
- Authenticated exploration unavailable to this scaffold's author, so no verified locators, theme names, or Report screenshot.
- No actual execution results, defects, RCA or HTML report are claimed.
- `TH-06` and `TH-08` are conditional, as required by the assignment.
- Theme changes may be async; the actual selected preference or theme state should be asserted after every change once mapped.

## 8. AI use disclosure (edit to match your actual work)
AI assistance was used to propose the initial Playwright TypeScript project architecture, example Page Objects, test scenario coverage and README outline. The candidate must personally inspect staging, validate and correct generated code/selectors, run all tests, review evidence and verify any defect findings. Remove any statement that does not accurately describe how AI was used.

## 9. Submission checklist
- [ ] Real application exploration and requirements documented
- [ ] Verified locators and theme-state assertions; gate enabled
- [ ] Isolation and restore logic implemented based on actual preference behavior
- [ ] Executed scenarios and verified pass/fail/skip counts
- [ ] HTML report, sanitized failure evidence and defect reports included
- [ ] No credentials, tokens, personal data or sensitive network payloads in Git
- [ ] GitHub repository with complete README, plus transparent AI disclosure
