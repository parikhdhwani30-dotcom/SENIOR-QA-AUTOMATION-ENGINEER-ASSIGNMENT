import { chromium } from '@playwright/test';
import 'dotenv/config';
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { model } from '../config/app-model';

async function main() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    const sessionFile = path.resolve(__dirname, '../.auth/session.json');
    if (existsSync(sessionFile)) {
      const session = JSON.parse(readFileSync(sessionFile, 'utf-8'));
      await page.addInitScript((data) => {
        for (const [k, v] of Object.entries(data)) {
          window.sessionStorage.setItem(k, v as string);
        }
      }, session);
    }
    await page.goto(model.routes.dashboard);
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
