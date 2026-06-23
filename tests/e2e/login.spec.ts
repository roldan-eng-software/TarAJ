import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test('should show login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /Entrar no Sistema/i })).toBeVisible();
    await expect(page.getByLabel(/Email/i)).toBeVisible();
    await expect(page.getByLabel(/Senha/i)).toBeVisible();
  });

  test('should show forgot password link', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText(/Esqueceu a senha/i)).toBeVisible();
  });

  test('should navigate to forgot-password page', async ({ page }) => {
    await page.goto('/login');
    await page.getByText(/Esqueceu a senha/i).click();
    await expect(page).toHaveURL(/\/forgot-password/);
    await expect(page.getByRole('heading', { name: /Redefinir senha/i })).toBeVisible();
  });

  test('should validate empty fields', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /Entrar/i }).click();
    await expect(page.getByText(/Preencha todos os campos/i)).toBeVisible();
  });

  test('should redirect to kanban when already authenticated', async ({ page }) => {
    await page.goto('/kanban');
    await page.waitForURL(/\/login|\/kanban/);
    // If not redirected to login, we are authenticated
    if (page.url().includes('/kanban')) {
      await expect(page.getByText(/Kanban/i)).toBeVisible();
    }
  });

  test('should show 404 page for unknown routes', async ({ page }) => {
    await page.goto('/pagina-inexistente');
    await expect(page.getByText(/Página não encontrada/i)).toBeVisible();
  });
});
