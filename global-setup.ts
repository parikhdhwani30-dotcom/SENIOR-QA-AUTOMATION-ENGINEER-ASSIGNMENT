import { chromium, type FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '.env') });

async function globalSetup(config: FullConfig) {
  const storagePath = path.resolve(__dirname, './.auth/session.json');

  /* Clean Allure folders */
  try {
    if (fs.existsSync('allure-results')) {
      fs.rmSync('allure-results', { recursive: true, force: true });
    }
    if (fs.existsSync('allure-report')) {
      fs.rmSync('allure-report', { recursive: true, force: true });
    }
  } catch (err) {
    console.warn('Allure cleanup warning:', err);
  }

  /* Launch browser for fast initial login */
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const baseURL = process.env.BASE_URL ?? 'https://base-application-stage.oomnieye.com/';
  await page.goto(baseURL, { waitUntil: 'domcontentloaded' });

  // Sign in using environment credentials
  await page.getByLabel('Email address', { exact: true }).fill(process.env.OOMNI_USERNAME!);
  await page.getByLabel('Password', { exact: true }).fill(process.env.OOMNI_PASSWORD!);
  await page.getByRole('button', { name: 'Sign in' }).click();

  // Wait for Dashboard to confirm successful login
  await page.getByRole('link', { name: 'Dashboard' }).waitFor({ state: 'visible', timeout: 15000 });

  /* Save session storage */
  const sessionData = await page.evaluate(() => {
    const map: Record<string, string> = {};
    for (let i = 0; i < window.sessionStorage.length; i++) {
      const k = window.sessionStorage.key(i);
      if (k) map[k] = window.sessionStorage.getItem(k) ?? '';
    }
    return map;
  });

  fs.mkdirSync(path.dirname(storagePath), { recursive: true });
  fs.writeFileSync(storagePath, JSON.stringify(sessionData, null, 2), 'utf-8');

  await browser.close();
}

export default globalSetup;

