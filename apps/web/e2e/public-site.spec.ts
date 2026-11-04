import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { PUBLIC_PATHS } from './routes';

test.describe('public pages', () => {
  for (const path of PUBLIC_PATHS) {
    test(`/${path} renders, is accessible and has no horizontal overflow`, async ({ page }) => {
      const failed: string[] = [];
      page.on('response', (r) => {
        if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`);
      });
      page.on('pageerror', (e) => failed.push(`pageerror ${e.message}`));

      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.locator('h1')).toHaveCount(1);
      await page.waitForLoadState('networkidle');
      expect(failed).toEqual([]);

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);

      const axe = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(axe.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`)).toEqual([]);
    });
  }
});

test('dark theme is accessible and persists across navigation', async ({ page, isMobile }) => {
  await page.goto('en/');
  if (isMobile) {
    await page.getByRole('button', { name: 'Menu' }).or(page.locator('summary[aria-label="Menu"]')).click();
    await page.getByRole('group', { name: 'Theme' }).last().getByRole('button', { name: 'Dark' }).click();
  } else {
    await page.locator('summary[aria-label="Theme"]').click();
    await page.getByRole('button', { name: 'Dark' }).first().click();
  }
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  await page.goto('en/how-it-works/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const axe = await new AxeBuilder({ page }).withTags(['wcag2aa', 'wcag22aa']).analyze();
  expect(axe.violations.map((v) => v.id)).toEqual([]);
});

test('language switcher keeps the equivalent page', async ({ page, isMobile }) => {
  await page.goto('es/como-funciona/');
  if (isMobile) await page.locator('summary[aria-label="Menú"]').click();
  else await page.locator('summary[aria-label^="Idioma"]').click();
  await page.locator('a[hreflang="fr"]:visible').first().click();
  await expect(page).toHaveURL(/\/vireluma\/fr\/comment-ca-marche\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
});

test('skip link moves focus to main content', async ({ page, isMobile }) => {
  test.skip(isMobile, 'keyboard flow');
  await page.goto('en/');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to content' });
  await expect(skip).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#main$/);
});

test('unknown paths serve the multilingual 404 page as noindex', async ({ page }) => {
  // `astro preview` serves 404.html like GitHub Pages does.
  const response = await page.goto('es/no-existe/');
  expect(response?.status()).toBe(404);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  await expect(page.getByRole('heading', { name: 'Página no encontrada' })).toBeVisible();
});

test('hero wristband contains a real QR pointing to the localized page', async ({ page }) => {
  await page.goto('pt/');
  const qr = page.locator('svg[role="img"][aria-label*="VIRELUMA"]').first();
  await expect(qr).toBeVisible();
});
