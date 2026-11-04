import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/** Scrolls an island into view and waits until Astro has hydrated it. */
async function hydrated(page: Page, selector: string) {
  const island = page.locator('astro-island', { has: page.locator(selector) });
  await island.scrollIntoViewIfNeeded();
  await expect(island).not.toHaveAttribute('ssr', '');
}

test.describe('design system showcase', () => {
  for (const scheme of ['light', 'dark'] as const) {
    test(`is accessible in ${scheme} mode`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto('design-system/');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
      const axe = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(axe.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`)).toEqual([]);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  test('dialog opens modally, closes with Escape and returns focus', async ({ page }) => {
    await page.goto('design-system/');
    const opener = page.getByRole('button', { name: 'Open dialog' });
    await opener.click();
    const dialog = page.getByRole('dialog', { name: 'Revoke this code?' });
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
  });

  test('tabs support arrow-key navigation', async ({ page }) => {
    await page.goto('design-system/');
    await hydrated(page, '[role="tablist"]');
    const first = page.getByRole('tab', { name: 'Public' });
    await first.click();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { name: 'Protected' })).toBeFocused();
    await expect(page.getByRole('tab', { name: 'Protected' })).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('End');
    await expect(page.getByRole('tab', { name: 'Private' })).toHaveAttribute('aria-selected', 'true');
  });

  test('toasts are announced and dismissible', async ({ page }) => {
    await page.goto('design-system/');
    await hydrated(page, 'button:text("Show toast")');
    await page.getByRole('button', { name: 'Show toast' }).click();
    const status = page.getByRole('status').filter({ hasText: 'Profile saved.' });
    await expect(status).toBeVisible();
    await page.getByRole('button', { name: 'Dismiss' }).click();
    await expect(page.getByText('Profile saved.')).toBeHidden();
  });
});
