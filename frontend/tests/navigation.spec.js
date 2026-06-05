import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:3000/api';
let testUser;

test.describe('Navigation Tests', () => {
  test.beforeAll(async ({ request }) => {
    testUser = {
      username: 'test-nav-' + Date.now(),
      email: 'test-nav-' + Date.now() + '@example.com',
      password: 'Test123456',
    };
    await request.post(`${API_BASE}/auth/register`, {
      data: testUser,
    });
  });

  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL('/login');
    await expect(page).toHaveURL(/login/);
  });

  test('should redirect authenticated users from login to dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', testUser.username);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button:has-text("登录")');
    await page.waitForURL('/dashboard');
    await page.goto('/login');
    await page.waitForURL('/dashboard');
    await expect(page).toHaveURL(/dashboard/);
  });

  test('should have working sidebar navigation', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', testUser.username);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button:has-text("登录")');
    await page.waitForURL('/dashboard');
    const navItems = ['仪表盘', '设置', '分享', '回收站'];
    for (const item of navItems) {
      await page.click(`text=${item}`);
      await page.waitForLoadState('networkidle');
    }
  });
});
