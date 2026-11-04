import { test } from '@playwright/test';

/**
 * Captures full-page screenshots of key pages at the breakpoints from the
 * brand spec, in light and dark. Output goes to test-results/screens for
 * human review (and CI artifacts). Pixel-diff baselines are added once the
 * visual design is approved, to avoid locking in unreviewed output.
 */
const WIDTHS = [320, 390, 768, 1024, 1440, 1920];
const PAGES = ['es/', 'en/how-it-works/', 'fr/qr-et-nfc/'];

test.describe('visual capture', () => {
  test.skip(({ browserName }) => browserName !== 'chromium');
  test.skip(() => !process.env.CAPTURE_SCREENS, 'set CAPTURE_SCREENS=1 to capture');

  for (const theme of ['light', 'dark'] as const) {
    for (const path of PAGES) {
      test(`${theme} ${path}`, async ({ page }, info) => {
        test.skip(info.project.name !== 'desktop', 'desktop project drives viewport sizes');
        await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
        for (const width of WIDTHS) {
          await page.setViewportSize({ width, height: 900 });
          await page.goto(path);
          await page.waitForLoadState('networkidle');
          const name = `${path.replace(/\//g, '_')}${width}-${theme}.png`;
          await page.screenshot({ path: `test-results/screens/${name}`, fullPage: true });
        }
      });
    }
  }
});
