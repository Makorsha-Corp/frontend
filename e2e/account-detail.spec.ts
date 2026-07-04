/**
 * Account detail invoice workspace E2E — requires dev frontend + API with account(s) that have invoices.
 */
import { test, expect } from '@playwright/test';
import { seedAuthenticatedSession } from './helpers/auth';
import {
  findAccountWithInvoices,
  getWorkspaceAuth,
  openAccountDetail,
  selectInvoiceInNavigator,
  listAccountsViaApi,
} from './helpers/accounts';

test.describe('Account detail — invoice workspace', () => {
  test('loads workspace KPIs and selects invoice with URL sync', async ({ page, request }) => {
    test.setTimeout(90_000);
    await seedAuthenticatedSession(page, request);
    const { token, workspaceId } = await getWorkspaceAuth(page, request);

    const match = await findAccountWithInvoices(request, token, workspaceId);
    test.skip(!match, 'No account with invoices — create a PO invoice first.');

    const { account, invoices } = match!;
    const firstInvoice = invoices[0];

    await openAccountDetail(page, account.id);
    await expect(page.getByText(account.name).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('account-detail-kpi-outstanding')).toBeVisible();

    await selectInvoiceInNavigator(page, firstInvoice.id);
    await expect(page.getByTestId('account-invoice-detail-panel')).toBeVisible();
    expect(page.url()).toContain(`invoiceId=${firstInvoice.id}`);
  });

  test('deep link ?invoiceId= opens correct invoice', async ({ page, request }) => {
    test.setTimeout(90_000);
    await seedAuthenticatedSession(page, request);
    const { token, workspaceId } = await getWorkspaceAuth(page, request);

    const match = await findAccountWithInvoices(request, token, workspaceId);
    test.skip(!match, 'No account with invoices.');

    const { account, invoices } = match!;
    const target = invoices[0];

    await openAccountDetail(page, account.id, target.id);
    await expect(page.getByTestId(`account-invoice-nav-item-${target.id}`)).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId('account-invoice-detail-panel')).toBeVisible();
  });

  test('server-side invoice search finds invoice by number fragment', async ({ page, request }) => {
    test.setTimeout(90_000);
    await seedAuthenticatedSession(page, request);
    const { token, workspaceId } = await getWorkspaceAuth(page, request);

    const match = await findAccountWithInvoices(request, token, workspaceId);
    test.skip(!match, 'No account with invoices.');

    const { account, invoices } = match!;
    const target = invoices.find((inv) => inv.invoice_number && inv.invoice_number.length >= 3);
    test.skip(!target?.invoice_number, 'No invoice with a searchable invoice_number.');

    const searchTerm = target!.invoice_number!.slice(0, 6);

    await openAccountDetail(page, account.id);

    const searchInput = page.getByTestId('account-invoice-search');
    await searchInput.fill(searchTerm);
    await page.waitForTimeout(400);

    await expect(page.getByTestId(`account-invoice-nav-item-${target!.id}`)).toBeVisible({
      timeout: 15_000,
    });
  });

  test('account details dialog opens from header', async ({ page, request }) => {
    test.setTimeout(60_000);
    await seedAuthenticatedSession(page, request);
    const { token, workspaceId } = await getWorkspaceAuth(page, request);

    const accounts = await listAccountsViaApi(request, token, workspaceId, { limit: 1 });
    test.skip(accounts.length === 0, 'No accounts.');

    await openAccountDetail(page, accounts[0].id);
    await page.getByTestId('account-open-details-dialog').click();
    await expect(page.getByTestId('account-details-dialog')).toBeVisible();
    await expect(page.getByTestId('account-context-panel')).toBeVisible();
    await expect(page.getByTestId('account-details-edit')).toBeVisible();
  });
});
