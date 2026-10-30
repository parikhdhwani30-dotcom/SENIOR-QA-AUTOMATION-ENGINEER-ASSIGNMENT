# Senior QA Automation Interview Guide: OomniEye Theme Consistency

This document explains the architecture, flow, design patterns, and business rationale behind the automation suite. Use this as your personal talking points during your technical interview.

---

## 1. High-Level Executive Summary (The "Elevator Pitch")

> *"In this assignment, I designed and implemented an enterprise-grade, end-to-end automation framework using **Playwright with TypeScript** and the **Page Object Model (POM)** pattern. The project validates theme consistency (Light/Dark mode) across the OomniEye application and ensures that UI states persist across navigation, page reloads, and multi-tab workflows in the Report Module.*
> 
> *To optimize test execution speed, I engineered a **Global Setup single-sign-on (SSO) session capture** that logs into the application once and serializes the authenticated `sessionStorage`. Each test re-injects this state in milliseconds, cutting total execution time to ~30 seconds without redundant UI logins. All 8 required scenarios pass reliably with 0 flakes, and test evidence is compiled into an interactive **Allure Report** with full-page screenshots attached to every step."*

---

## 2. Core Architecture & Concepts (How It Works Under the Hood)

### A. Global Setup (`global-setup.ts`) — Single Login Architecture
- **Business Problem:** Logging in through the UI before every single test scenario (8 times) wastes 35-40 seconds of execution time, creates unnecessary server load, and risks test failure if rate-limiting is triggered.
- **Solution:**
  1. Playwright runs `globalSetup` **once** before any tests start.
  2. It launches a headless browser, navigates to the staging URL, inputs the username/password from `.env`, and clicks Sign In.
  3. Once the Dashboard is visible, it extracts the browser's `window.sessionStorage` (where OomniEye stores auth tokens like `omnieye_auth_session` and `omnieye_auth_role`).
  4. It saves this JSON data into `.auth/session.json`.
  5. The browser closes.

### B. Fast Test Precondition (`tests/theme-report.spec.ts -> beforeEach`)
- **How each test runs:**
  1. In `beforeEach`, we read `.auth/session.json`.
  2. We call `page.addInitScript(...)` to inject the session keys into the browser's `sessionStorage` **before the web page even loads**.
  3. We navigate straight to `/#/dashboard/overview`.
  4. The application recognizes the session immediately—**we are already logged in within 500ms**!
  5. When the test finishes, Playwright's test runner automatically destroys the isolated browser context, ensuring clean isolation between tests.

### C. Clean Page Object Model (POM)
We separated test logic from UI locators using standard POM classes:
1. **`BasePage.ts`**:
   - Represents the shared layout.
   - Holds the header theme toggle locator: `page.locator('[data-hms-context="app-theme-toggle"]')`.
   - `getTheme()`: Evaluates `getComputedStyle(body).colorScheme` to return `'dark'` or `'light'`.
   - `toggleTheme()`: Clicks the theme switch button and returns the new theme.
   - `setTheme(themeName)`: Ensures the app is in the requested theme; throws an error if an invalid theme is given.
2. **`DashboardPage.ts`**:
   - Extends `BasePage`.
   - Locators: `dashboardLink`, `reportBuilderLink`.
   - Actions: `assertLoaded()`, `openReport()`.
3. **`ReportPage.ts`**:
   - Extends `BasePage`.
   - Locators: `reportHeading` (`getByRole('heading', { name: 'Reports', exact: true })`), `tableContainer`.
   - Actions: `assertLoaded()`, `inspectUI()`.

---

## 3. Explaining the 8 Test Scenarios (TH-01 to TH-08)

Here is how to explain what each test does in simple terms:

| Scenario | What It Tests | How We Automated & Verified It |
|---|---|---|
| **TH-01** | Change theme on Dashboard | Read initial theme, toggle theme via header button, assert the new theme does not equal the initial theme. |
| **TH-02** | Report Module reflects theme | Toggle theme on Dashboard, navigate to Report Builder (`openReport()`), assert `report.getTheme() === appliedTheme`. |
| **TH-03** | Refresh Report Module | Apply theme, open Report Builder, trigger `page.reload()`, assert theme is still the same after reload. |
| **TH-04** | Dashboard → Report → Dashboard | Apply theme, go to Report, go back to Dashboard (`/#/dashboard/overview`), assert theme didn't revert back. |
| **TH-05** | Second theme switch | Toggle to first theme, go to Report; return to Dashboard, toggle to second theme, return to Report; assert latest theme is applied. |
| **TH-06** | Open Report in a new tab | Apply theme on Tab 1. Open a new tab (`context.newPage()`), inject session, navigate straight to Report Module URL (`/#/dashboard/reports`), assert new tab carries the active theme. Attach new tab screenshot. |
| **TH-07** | Inspect UI elements | Navigate to Report Module and verify key visual containers (`reportHeading`, `tableContainer`) are visible and ready. |
| **TH-08** | Error resilience & negative testing | 1) Simulate API network failure with `page.route` to mock backend errors.<br>2) Pass an invalid theme name (`InvalidCustomThemeXYZ`) to verify the code rejects it.<br>3) Assert application did not crash or enter an inconsistent state.<br>4) Verify subsequent valid theme switch recovers cleanly. |

---

## 4. Key Questions & Answers for Technical Interviewers

### Q1: *"Why did you use `addInitScript` and `sessionStorage` instead of standard Playwright `storageState`?"*
> **Answer:** *"Playwright's built-in `storageState` primarily captures cookies and `localStorage`. During my initial exploratory testing of the OomniEye staging application, I discovered that authentication tokens (`omnieye_auth_session`, `omnieye_auth_role`) are maintained strictly inside `sessionStorage`. To make authentication fast and repeatable without repetitive UI logins, I captured `sessionStorage` in `globalSetup` and used `addInitScript` to pre-seed the storage before page navigation. This reduced test run duration by over 70%."*

### Q2: *"How do you test theme consistency without using brittle hardcoded colors?"*
> **Answer:** *"Instead of asserting on static hex codes like `#02110c` which break if a frontend developer modifies padding or minor shades, I inspect the standard CSS `colorScheme` property on the document body (`getComputedStyle(el).colorScheme`). This cleanly evaluates whether the active rendering engine is in `dark` or `light` mode. Furthermore, tests assert relative changes (e.g. `expect(newTheme).not.toBe(oldTheme)`), making the tests deterministic and resilient to design tweaks."*

### Q3: *"How do you avoid flaky tests and arbitrary waits?"*
> **Answer:** *"I adhere strictly to Playwright's web-first assertions such as `expect(locator).toBeVisible()`. Web-first assertions automatically retry until the DOM settles or the timeout threshold is reached. I avoided arbitrary sleeps like `page.waitForTimeout()` throughout the page objects and assertions."*

### Q4: *"How did you handle TH-06 (deep linking / new tab) and TH-08 (error handling)?"*
> **Answer:** *"The assignment noted that TH-06 and TH-08 depended on actual application behavior. During exploratory testing:
> - For **TH-06**, I validated that opening a new browser tab within the authenticated context and loading `/#/dashboard/reports` successfully retains the active theme and user session.
> - For **TH-08**, I used `page.route()` to intercept and simulate network failure for theme endpoints, and asserted that invalid theme parameters throw an explicit exception while keeping the UI in a consistent, recoverable state."*

### Q5: *"How is test evidence and reporting delivered?"*
> **Answer:** *"I integrated **Allure Reporting**. Every scenario automatically captures and attaches a full-page screenshot upon completion. I configured npm scripts so that executing `npm test` or `npm run test:headed` automatically generates the Allure HTML report and launches it in the browser."*

---

## 5. Cheat Sheet: Commands to Demonstrate in Interview

- **Run all tests (headless) & view Allure report:**
  ```powershell
  npm test
  ```
- **Run all tests with live browser (headed) & view Allure report:**
  ```powershell
  npm run test:headed
  ```
- **Run tests only (fastest, console output):**
  ```powershell
  npm run test:only
  ```
- **Open interactive Playwright UI mode:**
  ```powershell
  npm run test:ui
  ```
- **View Allure report anytime:**
  ```powershell
  npm run allure:open
  ```
