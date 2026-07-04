import type { APIRequestContext, Page } from '@playwright/test';
import { loginViaApi } from './auth';
import { apiURL } from '../../playwright.config';

type Account = { id: number; name: string };
type AccountInvoice = { id: number; account_id: number; invoice_number: string | null };

export async function getWorkspaceAuth(
  page: Page,
  request: APIRequestContext,
): Promise<{ token: string; workspaceId: number }> {
  const login = await loginViaApi(request);
  const workspaceId = await page.evaluate(() => {
    const raw = localStorage.getItem('workspace_id');
    return raw ? parseInt(raw, 10) : null;
  });
  if (!workspaceId) {
    throw new Error('workspace_id missing from page localStorage after seed');
  }
  return { token: login.access_token, workspaceId };
}

function authHeaders(token: string, workspaceId: number) {
  return {
    Authorization: `Bearer ${token}`,
    'X-Workspace-ID': String(workspaceId),
  };
}

export async function listAccountsViaApi(
  request: APIRequestContext,
  token: string,
  workspaceId: number,
  params?: { skip?: number; limit?: number; search?: string },
): Promise<Account[]> {
  const qs = new URLSearchParams({
    skip: String(params?.skip ?? 0),
    limit: String(params?.limit ?? 100),
  });
  if (params?.search) qs.set('search', params.search);
  const res = await request.get(`${apiURL}accounts/?${qs}`, {
    headers: authHeaders(token, workspaceId),
  });
  if (!res.ok()) {
    throw new Error(`List accounts failed (${res.status()}): ${await res.text()}`);
  }
  return res.json();
}

export async function listAccountInvoicesViaApi(
  request: APIRequestContext,
  token: string,
  workspaceId: number,
  accountId: number,
  params?: { skip?: number; limit?: number; invoice_number_search?: string },
): Promise<AccountInvoice[]> {
  const qs = new URLSearchParams({
    account_id: String(accountId),
    skip: String(params?.skip ?? 0),
    limit: String(params?.limit ?? 100),
  });
  if (params?.invoice_number_search) {
    qs.set('invoice_number_search', params.invoice_number_search);
  }
  const res = await request.get(`${apiURL}account-invoices/?${qs}`, {
    headers: authHeaders(token, workspaceId),
  });
  if (!res.ok()) {
    throw new Error(`List account invoices failed (${res.status()}): ${await res.text()}`);
  }
  return res.json();
}

/** Find first account that has at least one invoice (via API). */
export async function findAccountWithInvoices(
  request: APIRequestContext,
  token: string,
  workspaceId: number,
): Promise<{ account: Account; invoices: AccountInvoice[] } | null> {
  const accounts = await listAccountsViaApi(request, token, workspaceId, { limit: 100 });
  for (const account of accounts) {
    const invoices = await listAccountInvoicesViaApi(request, token, workspaceId, account.id, {
      limit: 5,
    });
    if (invoices.length > 0) {
      return { account, invoices };
    }
  }
  return null;
}

export async function openAccountsHub(page: Page, section: 'aggregated' | 'payable' | 'receivable' = 'aggregated') {
  await page.goto(section === 'aggregated' ? '/accounts' : `/accounts/${section}`);
  await page.getByRole('link', { name: 'Accounts' }).first().waitFor({ timeout: 15_000 });
}

export async function openFirstAccountFromHubTable(page: Page): Promise<string | null> {
  const firstRow = page.locator('table tbody tr').first();
  await firstRow.waitFor({ timeout: 15_000 });
  const name = await firstRow.locator('td').nth(1).textContent();
  await firstRow.click();
  await page.waitForURL(/\/accounts\/\d+/, { timeout: 15_000 });
  return name?.trim() ?? null;
}

export async function openAccountDetail(page: Page, accountId: number, invoiceId?: number) {
  const qs = invoiceId != null ? `?invoiceId=${invoiceId}` : '';
  await page.goto(`/accounts/${accountId}${qs}`);
  await page.waitForURL(new RegExp(`/accounts/${accountId}`), { timeout: 15_000 });
}

export async function selectInvoiceInNavigator(page: Page, invoiceId: number) {
  const item = page.getByTestId(`account-invoice-nav-item-${invoiceId}`);
  await item.click();
  await expectInvoiceSelected(page, invoiceId);
}

async function expectInvoiceSelected(page: Page, invoiceId: number) {
  await page.waitForURL(new RegExp(`invoiceId=${invoiceId}`), { timeout: 10_000 });
  await page.getByTestId('account-invoice-detail-panel').waitFor({ timeout: 10_000 });
}

export { expectInvoiceSelected };
