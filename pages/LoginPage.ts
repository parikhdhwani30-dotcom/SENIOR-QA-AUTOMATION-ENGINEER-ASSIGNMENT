import { expect, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { model } from '../config/app-model';
import { locate } from '../utils/locators';
import * as fs from 'node:fs';
import * as path from 'node:path';

const SESSION_FILE = path.resolve(__dirname, '../.auth/session.json');

type SessionMap = Record<string, string>;

export class LoginPage extends BasePage {
  constructor(page: Page) { super(page); }

  private static loadStoredSession(): SessionMap | null {
    try {
      if (fs.existsSync(SESSION_FILE)) {
        const raw = fs.readFileSync(SESSION_FILE, 'utf-8');
        return JSON.parse(raw) as SessionMap;
      }
    } catch {
      // Ignore read errors
    }
    return null;
  }

  private static saveSession(session: SessionMap): void {
    try {
      fs.mkdirSync(path.dirname(SESSION_FILE), { recursive: true });
      fs.writeFileSync(SESSION_FILE, JSON.stringify(session, null, 2), 'utf-8');
    } catch (err) {
      console.warn('Could not save session to disk:', err);
    }
  }

  async signIn(): Promise<void> {
    const username = process.env.OOMNI_USERNAME;
    const password = process.env.OOMNI_PASSWORD;
    if (!username || !password) throw new Error('Set OOMNI_USERNAME and OOMNI_PASSWORD in an ignored .env file.');

    // 1. Check if a cached session exists and inject it before page loads
    const cachedSession = LoginPage.loadStoredSession();
    if (cachedSession && Object.keys(cachedSession).length > 0) {
      await this.page.addInitScript((data) => {
        for (const [k, v] of Object.entries(data)) {
          window.sessionStorage.setItem(k, v);
        }
      }, cachedSession);

      await this.page.goto(model.routes.dashboard);

      // Verify that session was valid and landed on Dashboard
      const ready = locate(this.page, model.dashboard.ready);
      const isReady = await ready.isVisible().catch(() => false);
      if (isReady) {
        return;
      }
    } else {
      await this.page.goto(model.routes.dashboard);
      if (await locate(this.page, model.dashboard.ready).isVisible().catch(() => false)) {
        return;
      }
    }

    // 2. Perform manual login if no cached session or session expired
    await locate(this.page, model.login.username).fill(username);
    await locate(this.page, model.login.password).fill(password);
    await locate(this.page, model.login.submit).click();
    await expect(locate(this.page, model.dashboard.ready), 'Login should land on Dashboard').toBeVisible();

    // 3. Capture sessionStorage and save to .auth/session.json for subsequent tests
    const sessionData = await this.page.evaluate(() => {
      const map: Record<string, string> = {};
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const key = window.sessionStorage.key(i);
        if (key) {
          const val = window.sessionStorage.getItem(key);
          if (val !== null) map[key] = val;
        }
      }
      return map;
    });

    if (Object.keys(sessionData).length > 0) {
      LoginPage.saveSession(sessionData);
    }
  }
}
