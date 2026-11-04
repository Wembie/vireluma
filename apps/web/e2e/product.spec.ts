import { expect, test, type Browser, type Page } from '@playwright/test';
import { expectAccessible, hydrated, registerAndConfirm } from './helpers';

/**
 * Core product end to end against the LOCAL Supabase stack: create a person,
 * add emergency information, issue a permanent code, scan it anonymously,
 * share access by invitation link, then revoke the code.
 * Requires E2E_AUTH=1 (see auth.spec.ts).
 */
test.skip(!process.env.E2E_AUTH, 'set E2E_AUTH=1 with the local Supabase stack running');
test.describe.configure({ mode: 'serial' });

const stamp = Date.now();
const owner = { email: `owner-${stamp}@example.test`, password: 'owner passphrase long enough' };
const carer = { email: `carer-${stamp}@example.test`, password: 'carer passphrase long enough' };

let personUrl = '';
let publicId = '';
let inviteLink = '';

async function anonymousPage(browser: Browser): Promise<Page> {
  const context = await browser.newContext({ locale: 'es-CO' });
  return context.newPage();
}

test('the owner creates a person and completes setup', async ({ page }) => {
  await registerAndConfirm(page, owner.email, owner.password);
  await expect(page.getByRole('heading', { name: 'Todavía no hay personas' })).toBeVisible();
  await expectAccessible(page, 'dashboard-empty');

  await page.getByRole('link', { name: 'Añadir persona' }).first().click();
  await hydrated(page);
  await page.getByRole('button', { name: 'Crear perfil' }).click();
  await expect(page.getByText('Este campo es obligatorio.')).toBeVisible();

  await page.getByLabel('Nombre para mostrar').fill('Elena');
  await page.getByLabel('Mensaje de emergencia').fill('Vivo con Alzheimer. Por favor, quédate conmigo.');
  await page.getByLabel('Nombre completo (opcional)').fill('Elena Ruiz Privada');
  await page.getByLabel(/Confirmo que esta persona me autorizó/).check();
  await page.getByRole('button', { name: 'Crear perfil' }).click();

  await expect(page).toHaveURL(/\/es\/app\/person\/\?id=[0-9a-f-]{36}&tab=contacts$/);
  personUrl = page.url().replace(/&tab=.*$/, '');
  await expect(page.getByRole('heading', { level: 1, name: 'Elena' })).toBeVisible();

  // Contacts: one public, one private.
  const addContact = async (name: string, phone: string, visibility: string) => {
    await page.getByRole('button', { name: 'Añadir contacto' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Nombre del contacto').fill(name);
    await dialog.getByLabel('Teléfono').fill(phone);
    await expect(dialog.getByText(/Se guardará como \+57/)).toBeVisible();
    await dialog.getByLabel(visibility).check();
    await dialog.getByRole('button', { name: 'Guardar' }).click();
    await expect(dialog).toBeHidden();
  };
  await addContact('María', '300 123 4567', 'Visible al escanear');
  await addContact('Pedro Privado', '+57 301 999 9999', 'Solo personas con acceso');
  await expect(page.getByRole('listitem').filter({ hasText: 'María' })).toContainText('+57 300 123 4567');
  await expectAccessible(page, 'contacts');

  // Health data needs explicit consent first.
  await page.getByRole('tab', { name: 'Ajustes' }).click();
  await page.getByLabel(/autoriza guardar sus datos de salud/).check();
  await page.getByRole('button', { name: 'Otorgar consentimiento de datos de salud' }).click();
  await expect(page.getByRole('button', { name: 'Retirar consentimiento' })).toBeVisible();

  await page.getByRole('tab', { name: 'Información' }).click();
  const addDetail = async (kind: string, title: string, visibility: string) => {
    await page.getByRole('button', { name: 'Añadir información' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Tipo').selectOption({ label: kind });
    await dialog.getByLabel('Título').fill(title);
    await dialog.getByLabel(visibility).check();
    await dialog.getByRole('button', { name: 'Guardar' }).click();
    await expect(dialog).toBeHidden();
  };
  await addDetail('Comunicación', 'Háblale despacio', 'Visible al escanear');
  await addDetail('Medicamento', 'Medicamento secreto', 'Solo personas con acceso');

  // Issue the permanent code.
  await page.getByRole('tab', { name: 'Resumen' }).click();
  await page.getByRole('button', { name: 'Activar código', exact: true }).click();
  await expect(page.getByTestId('public-id')).toHaveText(/^[0-9A-Z]{4}(-[0-9A-Z]{2,4}){6}$/);
  publicId = (await page.getByTestId('public-id').textContent())?.replace(/-/g, '') ?? '';
  expect(publicId).toHaveLength(26);
  await expectAccessible(page, 'overview');
});

test('the QR studio renders a code that decodes back to the profile URL', async ({ page }) => {
  await page.goto(`${personUrl.replace('/person/', '/qr/')}`);
  await expect(page).toHaveURL(/\/es\/app\/login\/$/); // new context: signed out
  await page.getByLabel('Correo electrónico').fill(owner.email);
  await page.getByLabel('Contraseña', { exact: true }).fill(owner.password);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page.getByTestId('account-email')).toBeVisible();

  await page.goto(`${personUrl.replace('/person/', '/qr/')}`);
  await expect(page.getByTestId('qr-check')).toContainText('Comprobado', { timeout: 15_000 });
  await page.getByLabel(/símbolo de VIRELUMA/).check();
  await expect(page.getByTestId('qr-check')).toContainText('Comprobado', { timeout: 15_000 });

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Descargar SVG' }).click();
  expect((await download).suggestedFilename()).toMatch(/^vireluma-[0-9a-z]{6}-card\.svg$/);
  await expectAccessible(page, 'qr');
});

test('anyone who scans sees only public emergency information', async ({ browser }) => {
  const page = await anonymousPage(browser);
  await page.goto(`p/#${publicId}`);
  await expect(page.getByRole('heading', { level: 1, name: 'Elena' })).toBeVisible();
  await expect(page.getByText('Vivo con Alzheimer')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Llamar a María' })).toHaveAttribute(
    'href',
    'tel:+573001234567',
  );
  await expect(page.getByText('Háblale despacio')).toBeVisible();

  const body = await page.locator('body').innerText();
  for (const secret of ['Pedro Privado', '3019999999', 'Medicamento secreto', 'Ruiz Privada']) {
    expect(body).not.toContain(secret);
  }
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  await expect(page.locator('meta[name="referrer"]')).toHaveAttribute('content', 'no-referrer');
  expect(await page.title()).not.toContain('Elena');
  await expectAccessible(page, 'emergency');

  // Helper switches language; printed codes typed by hand also work.
  await page.getByLabel('Idioma').selectOption('en');
  await expect(page.getByRole('link', { name: 'Call María' })).toBeVisible();
  await page.goto('p/');
  await page.getByLabel('Code').fill(publicId.toLowerCase().replace(/(.{4})/g, '$1 '));
  await page.getByRole('button', { name: 'View profile' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Elena' })).toBeVisible();
  await page.context().close();
});

test('access is shared with an invitation link bound to an email', async ({ page, browser }) => {
  await page.goto('es/app/login/');
  await page.getByLabel('Correo electrónico').fill(owner.email);
  await page.getByLabel('Contraseña', { exact: true }).fill(owner.password);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page.getByTestId('account-email')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Elena' })).toBeVisible();

  await page.goto(`${personUrl}&tab=sharing`);
  await page.getByRole('button', { name: 'Invitar a alguien' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Correo de la persona invitada').fill(carer.email);
  await dialog.getByRole('button', { name: 'Crear enlace' }).click();
  inviteLink = await dialog.getByTestId('invite-link').inputValue();
  expect(inviteLink).toMatch(/\/es\/app\/invite\/#[0-9a-f]{64}$/);
  await dialog.getByRole('button', { name: 'Cerrar' }).click();
  await expect(page.getByText(carer.email)).toBeVisible();

  const other = await anonymousPage(browser);
  await registerAndConfirm(other, carer.email, carer.password);
  await other.goto(inviteLink);
  await expect(other.getByText(/te invita a acceder al perfil de Elena/)).toBeVisible();
  await expect(other).not.toHaveURL(/#/); // token removed from the address bar
  await other.getByRole('button', { name: 'Aceptar invitación' }).click();
  await expect(other.getByRole('heading', { level: 1, name: 'Elena' })).toBeVisible();
  await expect(other.getByText('Tu rol: Cuidado')).toBeVisible();
  // Caregivers edit emergency information but cannot manage codes or settings.
  await expect(other.getByRole('tab', { name: 'Ajustes' })).toHaveCount(0);
  await expect(other.getByRole('button', { name: 'Desactivar código' })).toHaveCount(0);
  await other.goto(inviteLink);
  await expect(other.getByText('Esta invitación ya se usó.')).toBeVisible();
  await other.context().close();
});

test('a revoked code stops resolving immediately', async ({ page, browser }) => {
  await page.goto('es/app/login/');
  await page.getByLabel('Correo electrónico').fill(owner.email);
  await page.getByLabel('Contraseña', { exact: true }).fill(owner.password);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page.getByTestId('account-email')).toBeVisible();
  await page.goto(personUrl);
  await page.getByRole('button', { name: 'Desactivar código' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Desactivar código' }).click();
  await expect(page.getByRole('button', { name: 'Activar código', exact: true })).toBeVisible();

  const scan = await anonymousPage(browser);
  await scan.goto(`p/#${publicId}`);
  await expect(scan.getByRole('heading', { level: 1, name: 'Código desactivado' })).toBeVisible();
  await expect(scan.getByText('Elena')).toHaveCount(0);
  await scan.context().close();
});
