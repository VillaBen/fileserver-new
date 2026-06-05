import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:3000/api';
let authToken;
let testUser;

test.describe('Dashboard and File Management Tests', () => {
  test.beforeAll(async ({ request }) => {
    testUser = {
      username: 'test-dashboard-' + Date.now(),
      email: 'test-dashboard-' + Date.now() + '@example.com',
      password: 'Test123456',
    };
    
    await request.post(`${API_BASE}/auth/register`, {
      data: testUser,
    });
    
    const loginRes = await request.post(`${API_BASE}/auth/login`, {
      data: { username: testUser.username, password: testUser.password },
    });
    const loginData = await loginRes.json();
    authToken = loginData.data.token;
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', testUser.username);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button:has-text("登录")');
    await page.waitForURL('/dashboard');
  });

  test('should load dashboard correctly', async ({ page }) => {
    await expect(page.locator('text=我的文件')).toBeVisible();
    await expect(page.locator('nav:has-text("仪表盘")')).toBeVisible();
    await expect(page.locator('nav:has-text("设置")')).toBeVisible();
  });

  test('should upload a file', async ({ page, request }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const filePath = '/tmp/test-file.txt';
    const fs = require('fs');
    fs.writeFileSync(filePath, 'Hello, Playwright Test!');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
    await page.waitForTimeout(3000);
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('should navigate to settings page', async ({ page }) => {
    await page.click('text=设置');
    await page.waitForURL('/settings');
    await expect(page).toHaveURL(/settings/);
  });

  test('should navigate to shares page', async ({ page }) => {
    await page.click('text=分享');
    await page.waitForURL('/shares');
    await expect(page).toHaveURL(/shares/);
  });

  test('should navigate to trash page', async ({ page }) => {
    await page.click('text=回收站');
    await page.waitForURL('/trash');
    await expect(page).toHaveURL(/trash/);
  });
});
