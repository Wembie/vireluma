import { expect, test } from '@playwright/test';
import { expectAccessible } from './helpers';

/**
 * The emergency page works with or without a backend in the build: input
 * validation and the manual-entry form never need the network.
 */
test.use({ locale: 'en-US' });

test('without an identifier it offers manual entry, accessible and never indexed', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('p/');
  await expect(page.getByRole('heading', { name: 'Type the code' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  await expect(page.locator('meta[name="referrer"]')).toHaveAttribute('content', 'no-referrer');
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  await expectAccessible(page, 'p/');
  expect(errors).toEqual([]);
});

test('a malformed identifier is rejected without any request', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (r) => {
    if (r.url().includes('/rest/v1/')) requests.push(r.url());
  });
  await page.goto('p/#not-a-valid-code');
  await expect(page.getByRole('heading', { level: 1, name: 'Invalid code' })).toBeVisible();
  // Never invent emergency numbers: without verified data, show the generic advice.
  await expect(page.getByText('local emergency number').first()).toBeVisible();

  await page.getByLabel('Code').fill('ABC');
  await page.getByRole('button', { name: 'View profile' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Invalid code' })).toBeVisible();
  expect(requests).toEqual([]);
});

test('the helper can switch the page language', async ({ page }) => {
  await page.goto('p/');
  await page.getByLabel('Language').selectOption('fr');
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page.getByRole('heading', { level: 2 }).first()).not.toHaveText('Type the code');
});
