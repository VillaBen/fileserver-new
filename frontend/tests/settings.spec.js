import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:3000/api';
let testUser;

test.describe('Settings Page Tests', () => {
  test.beforeAll(async ({ request }) => {
    testUser = {
      username: 'test-settings-' + Date.now(),
      email: 'test-settings-' + Date.now() + '@example.com',
      password: 'Test123456',
    };
    await request.post(`${API_BASE}/auth/register`, {
      data: testUser,
    });
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', testUser.username);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button:has-text("登录")');
    await page.waitForURL('/dashboard');
    await page.click('text=设置');
    await page.waitForURL('/settings');
  });

  test('should load settings page', async ({ page }) => {
    await expect(page.locator('text=用户设置').or(page.locator('text=个人信息'))).toBeVisible();
  });

  test('should show user profile information', async ({ page }) => {
    await expect(page.locator('text=用户名').or(page.locator('text=' + testUser.username))).toBeVisible();
  });

  test('should have password change section', async ({ page }) => {
    await expect(page.locator('text=修改密码').or(page.locator('input[name="currentPassword"]'))).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    await page.click('text=退出登录');
    await page.waitForURL('/login');
    await expect(page).toHaveURL(/login/);
  });
});
