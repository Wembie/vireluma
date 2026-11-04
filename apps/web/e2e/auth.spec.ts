import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * Account flows against the LOCAL Supabase stack (never production).
 * Requires: `pnpm db:start`, a build with PUBLIC_SUPABASE_URL/KEY pointing at
 * it, and E2E_AUTH=1. Emails are read from the local Mailpit inbox.
 */
const MAILPIT = process.env.MAILPIT_URL ?? 'http://127.0.0.1:54324';

test.skip(!process.env.E2E_AUTH, 'set E2E_AUTH=1 with the local Supabase stack running');
test.describe.configure({ mode: 'serial' });

interface MailpitMessage {
  ID: string;
  Subject: string;
}

/** Waits for the newest email to `to` matching `subject`, returns the first auth link in it. */
async function latestLink(to: string, subject: RegExp): Promise<string> {
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

async function hydrated(page: Page) {
  await expect(page.locator('astro-island').first()).not.toHaveAttribute('ssr', '');
}

const email = `e2e-${Date.now()}@example.test`;
const password = 'correct horse battery staple';
const newPassword = 'another long passphrase 2026';

test('register, confirm email and land on the account page', async ({ page }) => {
  await page.goto('es/app/register/');
  await hydrated(page);
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill('short');
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await expect(page.getByRole('alert')).toContainText('12 y 72 caracteres');

  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await expect(page).toHaveURL(/\/es\/app\/check-email\/$/);

  await page.goto(await latestLink(email, /confirm/i));
  await expect(page).toHaveURL(/\/es\/app\/$/);
  await expect(page.getByTestId('account-email')).toHaveText(email);
  await expect(page).not.toHaveURL(/code=/);
});

test('sign out, reject a wrong password, sign back in', async ({ page }) => {
  await page.goto('en/app/login/');
  await hydrated(page);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill('wrong password but long');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('alert')).toHaveText('The email or password is not correct.');

  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByTestId('account-email')).toHaveText(email);

  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page).toHaveURL(/\/en\/app\/login\/$/);
  await page.goto('en/app/');
  await expect(page).toHaveURL(/\/en\/app\/login\/$/);
});

test('reset the password through the emailed link', async ({ page }) => {
  await page.goto('pt/app/forgot-password/');
  await hydrated(page);
  await page.getByLabel('E-mail').fill(email);
  await page.getByRole('button', { name: 'Enviar link' }).click();
  await expect(page.getByRole('status')).toContainText('Se existir uma conta');

  await page.goto(await latestLink(email, /reset|password/i));
  await expect(page).toHaveURL(/\/pt\/app\/reset-password\/$/);
  await hydrated(page);
  await page.getByLabel('Nova senha', { exact: true }).fill(newPassword);
  await page.getByRole('button', { name: 'Salvar senha' }).click();
  await expect(page.getByRole('status')).toHaveText('Sua senha foi atualizada.');

  await page.goto('pt/app/');
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha', { exact: true }).fill(newPassword);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByTestId('account-email')).toHaveText(email);
});

test('request account deletion with confirmation', async ({ page }) => {
  await page.goto('fr/app/login/');
  await hydrated(page);
  await page.getByLabel('Adresse e-mail').fill(email);
  await page.getByLabel('Mot de passe', { exact: true }).fill(newPassword);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page.getByTestId('account-email')).toHaveText(email);

  await page.getByRole('button', { name: 'Demander la suppression' }).click();
  await expect(page.getByText('Demander la suppression de votre compte ?')).toBeVisible();
  await page.getByRole('button', { name: 'Demander la suppression' }).click();
  await expect(page.getByRole('status')).toHaveText('Nous avons bien reçu votre demande de suppression.');
});

test('account pages are accessible and never indexed', async ({ page }) => {
  for (const path of ['es/app/login/', 'en/app/register/', 'fr/app/forgot-password/']) {
    await page.goto(path);
    await hydrated(page);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    const axe = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(axe.violations.map((v) => `${path} ${v.id}`)).toEqual([]);
  }
});
