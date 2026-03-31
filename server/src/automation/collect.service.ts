import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { createRequire } from 'module';
import { chromium, Frame, Page } from 'playwright';

type SiteAction = {
  selector?: string;
  selectors?: string[];
  type?: 'fill' | 'click' | 'check' | 'press';
  key?: string;
  optional?: boolean;
  timeoutMs?: number;
  afterActionDelayMs?: number;
};

type SiteConfig = {
  siteName: string;
  loginUrl: string;
  loginFrame?: {
    urlIncludes: string;
    timeoutMs?: number;
  };
  loginPageMarkers?: string[];
  loggedInCheck?: {
    urlIncludes?: string;
    urlExcludes?: string;
    selectors?: string[];
  };
  preLoginWaitFor?: SiteAction;
  preLoginActions?: SiteAction[];
  preFillActions?: SiteAction[];
  preSubmitActions?: SiteAction[];
  loginFormRetry?: {
    attempts?: number;
    delayMs?: number;
  };
  loginForm: {
    username: SiteAction;
    password: SiteAction;
    submit: SiteAction;
  };
  switchAccount?: {
    logout?: SiteAction;
    postLogoutWaitFor?: SiteAction;
  };
  navigation?: {
    waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' | 'commit';
    timeoutMs?: number;
    afterSubmitTimeoutMs?: number;
  };
  browserContext?: Record<string, unknown>;
  browser?: {
    headless?: boolean;
    slowMo?: number;
  };
};

type RuntimeAccount = {
  id: number;
  name: string;
  username: string;
  password: string;
};

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

@Injectable()
export class CollectService {
  private readonly workspaceRoot = path.resolve(process.cwd(), '..');
  private readonly collectRoot = path.join(this.workspaceRoot, 'collect');
  private readonly authDir = path.join(this.collectRoot, '.auth');
  private readonly requireFromCollect = createRequire(path.join(this.collectRoot, 'package.json'));

  private loadSiteConfig(): SiteConfig {
    const sitePath = path.join(this.collectRoot, 'config', 'site.js');
    delete this.requireFromCollect.cache[this.requireFromCollect.resolve(sitePath)];
    return this.requireFromCollect(sitePath) as SiteConfig;
  }

  private getExecutablePath() {
    return (
      process.env.COLLECT_CHROME_EXECUTABLE ||
      '/Users/dusiyuan/Library/Caches/ms-playwright/chromium-1208/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'
    );
  }

  private getStoragePath(siteName: string, accountName: string) {
    fs.mkdirSync(this.authDir, { recursive: true });
    return path.join(this.authDir, `${siteName || 'site'}-${accountName}.json`);
  }

  private toArray<T>(value?: T | T[]) {
    if (Array.isArray(value)) {
      return value.filter(Boolean);
    }

    if (value == null) {
      return [];
    }

    return [value];
  }

  private async getLoginTarget(page: Page, siteConfig: SiteConfig): Promise<Page | Frame> {
    const loginFrame = siteConfig.loginFrame;

    if (!loginFrame?.urlIncludes) {
      return page;
    }

    const timeoutMs = loginFrame.timeoutMs || 30000;
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeoutMs) {
      const frame = page.frames().find((item) => item.url().includes(loginFrame.urlIncludes));
      if (frame) {
        return frame;
      }

      await page.waitForTimeout(300);
    }

    throw new Error(`Login frame not found: ${loginFrame.urlIncludes}`);
  }

  private async findLocator(target: Page | Frame, action?: SiteAction, preferVisible = true) {
    const selectors = [...this.toArray(action?.selector), ...this.toArray(action?.selectors)];

    assert(selectors.length > 0, 'Action selector is missing in config');

    for (const selector of selectors) {
      const locator = target.locator(selector).first();
      if (!(await locator.count())) {
        continue;
      }

      if (!preferVisible) {
        return locator;
      }

      try {
        if (await locator.isVisible({ timeout: action?.timeoutMs || 500 })) {
          return locator;
        }
      } catch {}
    }

    throw new Error(`No matching selector found: ${selectors.join(' | ')}`);
  }

  private async tryFindLocator(target: Page | Frame, action?: SiteAction) {
    try {
      return await this.findLocator(target, action);
    } catch {
      return null;
    }
  }

  private async performAction(target: Page | Frame, action: SiteAction, value?: string) {
    const locator = await this.findLocator(target, action);

    if (action.type === 'check') {
      await locator.check({ timeout: action.timeoutMs });
      return;
    }

    if (action.type === 'press') {
      await locator.press(action.key || 'Enter', { timeout: action.timeoutMs });
      return;
    }

    if (action.type === 'click') {
      await locator.click({ timeout: action.timeoutMs });
      if (action.afterActionDelayMs) {
        await new Promise((resolve) => setTimeout(resolve, action.afterActionDelayMs));
      }
      return;
    }

    await locator.fill(value || '', { timeout: action.timeoutMs });
    if (action.afterActionDelayMs) {
      await new Promise((resolve) => setTimeout(resolve, action.afterActionDelayMs));
    }
  }

  private async runActions(page: Page, siteConfig: SiteConfig, actions?: SiteAction[]) {
    for (const action of actions || []) {
      const loginTarget = await this.getLoginTarget(page, siteConfig);
      try {
        await this.performAction(loginTarget, action);
      } catch (error) {
        if (!action.optional) {
          throw error;
        }
      }
    }
  }

  private async hasAnyVisibleSelector(target: Page | Frame, selectors?: string[]) {
    for (const selector of this.toArray(selectors)) {
      const locator = target.locator(selector).first();
      if (!(await locator.count())) {
        continue;
      }

      try {
        if (await locator.isVisible({ timeout: 300 })) {
          return true;
        }
      } catch {}
    }

    return false;
  }

  private async isLoggedIn(page: Page, siteConfig: SiteConfig) {
    const loginTarget = await this.getLoginTarget(page, siteConfig).catch(() => page);

    if (await this.hasAnyVisibleSelector(loginTarget, siteConfig.loginPageMarkers)) {
      return false;
    }

    if (siteConfig.loggedInCheck?.urlIncludes && page.url().includes(siteConfig.loggedInCheck.urlIncludes)) {
      return true;
    }

    if (siteConfig.loggedInCheck?.urlExcludes && !page.url().includes(siteConfig.loggedInCheck.urlExcludes)) {
      return true;
    }

    for (const selector of siteConfig.loggedInCheck?.selectors || []) {
      if ((await page.locator(selector).count()) > 0) {
        return true;
      }
    }

    return false;
  }

  private async waitForLoggedIn(page: Page, siteConfig: SiteConfig) {
    const timeoutMs = siteConfig.navigation?.afterSubmitTimeoutMs || 30000;
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeoutMs) {
      if (await this.isLoggedIn(page, siteConfig)) {
        return;
      }
      await page.waitForTimeout(500);
    }

    throw new Error('Login did not complete. Please verify URL, selectors, and credentials.');
  }

  private async ensureLoginFormReady(page: Page, siteConfig: SiteConfig) {
    const attempts = siteConfig.loginFormRetry?.attempts || 4;
    const delayMs = siteConfig.loginFormRetry?.delayMs || 1200;

    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const loginTarget = await this.getLoginTarget(page, siteConfig);
      const usernameInput = await this.tryFindLocator(loginTarget, siteConfig.loginForm.username);
      const passwordInput = await this.tryFindLocator(loginTarget, siteConfig.loginForm.password);

      if (usernameInput && passwordInput) {
        return loginTarget;
      }

      await this.runActions(page, siteConfig, siteConfig.preLoginActions);
      await this.runActions(page, siteConfig, siteConfig.preFillActions);
      await page.waitForTimeout(delayMs);
    }

    return this.getLoginTarget(page, siteConfig);
  }

  private async loginWithAccount(account: RuntimeAccount, options?: { headless?: boolean }) {
    const siteConfig = this.loadSiteConfig();
    const storageStatePath = this.getStoragePath(siteConfig.siteName, account.name);

    const browser = await chromium.launch({
      executablePath: this.getExecutablePath(),
      headless: options?.headless ?? siteConfig.browser?.headless ?? false,
      slowMo: siteConfig.browser?.slowMo || 0,
    });

    try {
      const context = await browser.newContext({
        ...(siteConfig.browserContext || {}),
        storageState: fs.existsSync(storageStatePath) ? storageStatePath : undefined,
      });
      const page = await context.newPage();

      await page.goto(siteConfig.loginUrl, {
        waitUntil: siteConfig.navigation?.waitUntil || 'domcontentloaded',
        timeout: siteConfig.navigation?.timeoutMs || 30000,
      });

      if (!(await this.isLoggedIn(page, siteConfig))) {
        await this.ensureLoginFormReady(page, siteConfig);
        const loginTarget = await this.getLoginTarget(page, siteConfig);

        await this.performAction(loginTarget, siteConfig.loginForm.username, account.username);
        await this.performAction(loginTarget, siteConfig.loginForm.password, account.password);

        for (const action of siteConfig.preSubmitActions || []) {
          try {
            await this.performAction(loginTarget, action);
          } catch (error) {
            if (!action.optional) {
              throw error;
            }
          }
        }

        await this.performAction(loginTarget, siteConfig.loginForm.submit);
        await this.waitForLoggedIn(page, siteConfig);
      }

      await context.storageState({ path: storageStatePath });
    } finally {
      await browser.close();
    }
  }

  async favoriteItem(account: RuntimeAccount, itemUrl: string, options?: { headless?: boolean }) {
    const siteConfig = this.loadSiteConfig();
    const storageStatePath = this.getStoragePath(siteConfig.siteName, account.name);

    if (!fs.existsSync(storageStatePath)) {
      await this.loginWithAccount(account, options);
    }

    const browser = await chromium.launch({
      executablePath: this.getExecutablePath(),
      headless: options?.headless ?? siteConfig.browser?.headless ?? false,
    });

    try {
      const context = await browser.newContext({
        ...(siteConfig.browserContext || {}),
        storageState: storageStatePath,
      });
      const page = await context.newPage();

      await page.goto(itemUrl, {
        waitUntil: siteConfig.navigation?.waitUntil || 'domcontentloaded',
        timeout: siteConfig.navigation?.timeoutMs || 30000,
      });
      await page.waitForTimeout(8000);

      if (await page.locator('text=已收藏').count()) {
        return {
          accountId: account.id,
          accountName: account.name,
          status: 'already_favorited',
        };
      }

      const favoriteButton = page.locator('span.icon-text', { hasText: '收藏' }).first();
      await favoriteButton.click({ force: true });
      await page.waitForTimeout(3000);

      const hasCollectedText = await page.locator('text=已收藏').count();
      const hasSuccessToast = await page.locator('text=收藏成功').count();

      if (!hasCollectedText && !hasSuccessToast) {
        throw new Error('Favorite action may not have completed.');
      }

      return {
        accountId: account.id,
        accountName: account.name,
        status: 'favorited',
      };
    } finally {
      await browser.close();
    }
  }
}
