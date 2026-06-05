import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:3000/api';
const TEST_USER = {
  username: 'test-playwright-' + Date.now(),
  email: 'test-playwright-' + Date.now() + '@example.com',
  password: 'Test123456',
};

test.describe('Authentication Tests', () => {
  test.beforeAll(async ({ request }) => {
    await request.post(`${API_BASE}/auth/register`, {
      data: TEST_USER,
    });
  });

  test('should load login page correctly', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/FileCloud/);
    await expect(page.locator('text=登录')).toBeVisible();
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test('should register a new user', async ({ page }) => {
    const uniqueUser = {
      username: 'test-reg-' + Date.now(),
      email: 'test-reg-' + Date.now() + '@example.com',
      password: 'Test123456',
    };
    
    await page.goto('/register');
    await page.fill('input[name="username"]', uniqueUser.username);
    await page.fill('input[name="email"]', uniqueUser.email);
    await page.fill('input[name="password"]', uniqueUser.password);
    await page.fill('input[name="confirmPassword"]', uniqueUser.password);
    await page.click('button:has-text("注册")');
    await page.waitForURL('/dashboard', { timeout: 10000 });
    await expect(page).toHaveURL(/dashboard/);
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', TEST_USER.username);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button:has-text("登录")');
    await page.waitForURL('/dashboard', { timeout: 10000 });
    await expect(page).toHaveURL(/dashboard/);
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'invalid-user');
    await page.fill('input[name="password"]', 'wrong-password');
    await page.click('button:has-text("登录")');
    await page.waitForTimeout(2000);
    await expect(page.locator('text=用户名或密码错误').or(page.locator('.el-message'))).toBeVisible();
  });
});
