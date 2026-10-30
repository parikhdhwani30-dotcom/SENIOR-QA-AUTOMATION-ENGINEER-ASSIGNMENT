# OomniEye Theme & Reports QA Automation Suite
**Senior QA Automation Engineer Assignment**  
**Author:** Dhwani Parikh  
**Technology Stack:** Playwright (TypeScript), Page Object Model (POM), Allure Reporting

---

## 1. Overview & Objective
This repository contains an end-to-end test automation suite designed for the **OomniEye** web application staging environment (`https://base-application-stage.oomnieye.com/`). The suite automates and validates application-wide theme switching (Light / Dark) and ensures theme consistency across navigation flows, page reloads, and the **Report Module** (Report Builder).

All 8 mandated test scenarios (**TH-01 through TH-08**) are automated, executed, and verified with 100% pass rate.

---

## 2. Key Architecture & Design Highlights

- **Standard Page Object Model (POM)**:
  - Clean separation of page locators and user interactions in [`pages/DashboardPage.ts`](pages/DashboardPage.ts) and [`pages/ReportPage.ts`](pages/ReportPage.ts).
  - Base actions and theme inspection logic centralized in [`pages/BasePage.ts`](pages/BasePage.ts).
  - Common configuration and route definitions maintained in [`config/app-model.ts`](config/app-model.ts).

- **Optimized Global Setup & Fast Authentication (`global-setup.ts`)**:
  - Implements Playwright's `globalSetup` hook to authenticate once against staging using environment variables.
  - Automatically captures and serializes the application's session state (`sessionStorage`) into a gitignored `.auth/session.json`.
  - Re-injects session storage before tests run (`page.addInitScript`), reducing suite execution time to **under 30 seconds** without repetitive UI login overhead.

- **Stable & Resilient Assertions**:
  - Utilizes Playwright's web-first assertions (`expect(locator).toBeVisible()`).
  - Strict zero-arbitrary-waits policy (`waitForTimeout` avoided).
  - Dynamic style evaluation via computed CSS attributes (`colorScheme`, text color, computed background) to accurately detect theme transitions.

- **Enterprise Allure Reporting**:
  - Integrated `allure-playwright` and `allure-commandline`.
  - Automatic full-page screenshot capture for both passing and failing assertions.
  - Seamless report generation and browser launching automated directly via npm scripts.

---

## 3. Test Coverage Matrix

| Scenario ID | Test Scenario | Verified Behavior / Assertion | Status |
|:---:|:---|:---|:---:|
| **TH-01** | Change theme from Dashboard | Toggles theme between Light and Dark; validates CSS `color-scheme` update. | **PASSED** |
| **TH-02** | Open Report Module after theme change | Navigates to Report Builder; asserts selected theme is accurately reflected. | **PASSED** |
| **TH-03** | Refresh Report Module | Reloads the Report Builder; verifies theme persistence after full page refresh. | **PASSED** |
| **TH-04** | Dashboard → Report → Dashboard | Navigates back and forth between modules; verifies theme does not unexpectedly revert. | **PASSED** |
| **TH-05** | Update theme again and reopen Report | Applies alternate supported theme; verifies latest theme reflects in Report Builder. | **PASSED** |
| **TH-06** | Open Report Module directly or in a new tab | Opens Report Module in current view & fresh browser tab; verifies session & theme retention. | **PASSED** |
| **TH-07** | Inspect key Report Module UI elements | Validates readability, control opacity, and element visibility; attaches full UI snapshot. | **PASSED** |
| **TH-08** | Simulate failed preference update / unsupported selection | Simulates network interception and invalid theme arguments; verifies error resilience. | **PASSED** |

> **Exploration Note on TH-06 & TH-08**:
> As specified in the requirements, TH-06 and TH-08 were validated against actual application behavior:
> - **TH-06**: Direct navigation (`/#/dashboard/reports`) and multi-tab context sharing both retain active authentication and theme styling.
> - **TH-08**: The client-side state architecture gracefully recovers from network failures and rejects invalid arguments without leaving the DOM or stylesheets corrupted.

---

## 4. Project Structure

```text
oomnieye-theme-qa/
├── .auth/                  # Generated session state (gitignored)
├── config/
│   └── app-model.ts        # Routes, locators, and theme options configuration
├── docs/
│   ├── execution-summary.md # Execution metrics and test pass breakdown
│   ├── test-cases.md       # Detailed test scenarios and exploration worksheet
│   └── defects.md          # Defect log template & exploratory findings
├── pages/
│   ├── BasePage.ts         # Shared page methods and computed theme extraction
│   ├── DashboardPage.ts    # Dashboard Page Object (locators & actions)
│   └── ReportPage.ts       # Report Module Page Object (locators & UI checks)
├── tests/
│   └── theme-report.spec.ts# Automated test suite (TH-01 to TH-08)
├── utils/
│   └── locators.ts         # Locator abstraction helper
├── global-setup.ts         # Single-sign-on session capture & cleanup
├── playwright.config.ts    # Playwright configuration, reporters & viewport settings
├── package.json            # Scripts and dependencies
└── README.md               # Project documentation
```

---

## 5. Prerequisites & Environment Setup

### Prerequisites
- **Node.js**: v20 or higher
- **npm**: v10 or higher
- **Google Chrome / Chromium**

### Setup Instructions
1. **Clone the repository:**
   ```bash
   git clone https://github.com/parikhdhwani30-dotcom/SENIOR-QA-AUTOMATION-ENGINEER-ASSIGNMENT.git
   cd SENIOR-QA-AUTOMATION-ENGINEER-ASSIGNMENT
   ```

2. **Install dependencies and browser binaries:**
   ```bash
   npm install
   npx playwright install chromium
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the project directory (or copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```
   Ensure your `.env` contains:
   ```env
   BASE_URL=https://base-application-stage.oomnieye.com/
   OOMNI_USERNAME=customer@oomnieye.com
   OOMNI_PASSWORD=Customer@123
   APP_MODEL_VERIFIED=true
   ACCOUNT_SCOPED_THEME=true
   DIRECT_REPORT_SUPPORTED=true
   REPORT_PATH=/#/dashboard/reports
   ```
   *(Note: `.env` and `.auth/` are strictly ignored by `.gitignore` to prevent credential exposure).*

---

## 6. Running the Tests & Viewing Reports

### Run Headless (Default)
Executes all 8 tests in headless mode, automatically compiles the Allure report, and opens it:
```bash
npm test
```

### Run Headed Mode
Runs tests visually in a real maximized browser window, followed by auto-opening the Allure report:
```bash
npm run test:headed
```

### Run Single/Fast Execution (Without auto-opening browser report)
```bash
npm run test:only
# or headed:
npm run test:headed:only
```

### Playwright UI Mode (Interactive Debugging)
```bash
npm run test:ui
```

---

## 7. Allure Test Report & Evidence

Allure reporting is fully preconfigured with screenshots attached for every executed scenario:

- **Generate and open Allure report manually:**
  ```bash
  npm run allure:generate
  npm run allure:open
  ```
- **Serve report directly on a local web server:**
  ```bash
  npm run allure:serve
  ```
- **Standard Playwright HTML Report:**
  ```bash
  npm run report
  ```

---

## 8. Senior QA Engineering Decisions

1. **Session Injection over UI Login Redundancy**: Rather than wasting ~3-4 seconds per test logging in through the UI, authentication is isolated in `globalSetup` and injected via `sessionStorage` in `beforeEach`. This improves execution speed by ~70% and avoids rate-limiting issues.
2. **Deterministic Dynamic Assertions**: Rather than hardcoding static hex colors that break across minor CSS refactors, tests assert on CSS variables, computed `colorScheme`, and relative theme diffs between state changes.
3. **Execution Safety**: Configured with `workers: 1` and `fullyParallel: false` to avoid session collision and race conditions during concurrent theme toggle operations.
4. **Clean Code & Interview-Ready POM**: Code structure strictly follows the standard Page Object Model with explicit locator properties and concise methods, ensuring maintainability, readability, and ease of demonstration during technical review.
