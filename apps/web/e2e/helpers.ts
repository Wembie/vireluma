import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

/** Local Mailpit inbox of the Supabase stack (never production). */
export const MAILPIT = process.env.MAILPIT_URL ?? 'http://127.0.0.1:54324';

interface MailpitMessage {
  ID: string;
  Subject: string;
}

/** Waits for the newest email to `to` matching `subject`, returns the first auth link in it. */
export async function latestLink(to: string, subject: RegExp): Promise<string> {
  for (let attempt = 0; attempt < 40; attempt++) {
    const list = (await (
      await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`)
    ).json()) as { messages: MailpitMessage[] };
    const message = list.messages.find((m) => subject.test(m.Subject));
    if (message) {
      const detail = (await (await fetch(`${MAILPIT}/api/v1/message/${message.ID}`)).json()) as {
        Text: string;
      };
      const link = /https?:\/\/\S+\/auth\/v1\/verify\S+/.exec(detail.Text)?.[0];
      if (link) return link.replace(/&amp;/g, '&');
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`No email for ${to} matching ${subject}`);
}

/** React islands must hydrate before they react to input. */
export async function hydrated(page: Page) {
  await expect(page.locator('astro-island').first()).not.toHaveAttribute('ssr', '');
}

/** Registers and confirms an account through the real UI; ends signed in on the dashboard. */
export async function registerAndConfirm(page: Page, email: string, password: string) {
  await page.goto('es/app/register/');
  await hydrated(page);
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await expect(page).toHaveURL(/\/es\/app\/check-email\/$/);
  await page.goto(await latestLink(email, /confirm/i));
  await expect(page.getByTestId('account-email')).toHaveText(email);
}

export async function signIn(page: Page, email: string, password: string, next = '') {
  await page.goto(`es/app/login/${next}`);
  await hydrated(page);
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
}

export async function expectAccessible(page: Page, label: string) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, `${label} horizontal overflow`).toBeLessThanOrEqual(0);
  const axe = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(axe.violations.map((v) => `${label} ${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`)).toEqual(
    [],
  );
}
