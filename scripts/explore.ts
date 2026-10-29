import { chromium } from '@playwright/test';
import 'dotenv/config';
import { mkdirSync, writeFileSync } from 'node:fs';
import { model } from '../config/app-model';
import { LoginPage } from '../pages/LoginPage';

async function main() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await new LoginPage(page).signIn();
    console.log('Explore Dashboard and theme settings using the browser.');
    console.log('Script does not record passwords, network payloads, or screenshot contents.');
    console.log('Close browser window when finished.');
    mkdirSync('exploration-output', { recursive: true });
    // A sanitized map of interactive element roles/names; no form values or credentials.
    const map = await page.locator('button, a, [role="button"], [role="link"], [role="radio"]').evaluateAll(elements =>
      elements.map(el => ({ tag: el.tagName, role: el.getAttribute('role'),
        name: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 80) }))
        .filter(x => x.name && !/password|customer@|Customer@/i.test(x.name))
    );
    writeFileSync('exploration-output/dashboard-controls.json', JSON.stringify(map, null, 2));
    await page.pause();
  } finally { await context.close(); await browser.close(); }
}
main().catch(err => { console.error(err.message); process.exitCode = 1; });
