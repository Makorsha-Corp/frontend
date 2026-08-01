/**
 * Diagnostic color audit — compares computed backgrounds on PO hub/detail vs Accounts hub/detail.
 * Does not assert pass/fail on colors; attaches report + screenshots for human review.
 */
import { test, expect } from '@playwright/test';
import { apiURL } from '../playwright.config';
import { seedAuthenticatedSession } from './helpers/auth';
import {
  buildComparisonRows,
  ensureTheme,
  formatColorReport,
  sampleBackground,
  sampleScrollParentBackground,
  type ColorAuditRow,
  type ColorSample,
} from './helpers/colorAudit';
import {
  findAccountWithInvoices,
  getWorkspaceAuth,
  openAccountDetail,
  selectInvoiceInNavigator,
} from './helpers/accounts';

const REGION_META: Record<string, string> = {
  'Page shell': 'Tier 1',
  'Filter strip': 'Tier 2-ish',
  Navigator: 'Tier 2',
  'Detail scroll canvas': 'Tier 1/2',
  'Primary section block': 'Tier 2/3',
  'KPI tile (hub)': 'Tier 2',
};

type RegionSamples = Partial<Record<string, ColorSample | null>>;

async function listPurchaseOrders(
  request: Parameters<typeof getWorkspaceAuth>[1],
  token: string,
  workspaceId: number,
) {
  const res = await request.get(`${apiURL}purchase-orders/?skip=0&limit=10`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Workspace-ID': String(workspaceId),
    },
  });
  if (!res.ok()) return [];
  return res.json() as Promise<{ id: number; po_number: string }[]>;
}

async function samplePoHub(
  page: import('@playwright/test').Page,
  poNumber: string,
): Promise<RegionSamples> {
  await page.goto('/orders/purchase');
  await expect(page.getByRole('button', { name: 'Add Purchase Order' })).toBeVisible({
    timeout: 20_000,
  });

  const completeSwitch = page.getByLabel('Show complete orders');
  const poListButton = page.getByRole('button', { name: poNumber, exact: false });
  if ((await poListButton.count()) === 0) {
    await completeSwitch.click();
    await expect(poListButton.first()).toBeVisible({ timeout: 10_000 });
  }

  const filtersBtn = page.getByRole('button', { name: /^Filters/ });
  if (await filtersBtn.isVisible()) {
    const expanded = await filtersBtn.getAttribute('aria-expanded');
    if (expanded !== 'true') {
      await filtersBtn.click();
    }
  }

  await page.locator('#po-filters-bar').waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {});

  const pageShell = page.locator('div.flex.h-screen.bg-background.overflow-hidden').first();
  const filterStrip = page.locator('#po-filters-bar');
  const navigator = page
    .getByRole('heading', { name: /^Orders/ })
    .locator('xpath=ancestor::div[contains(@class,"bg-card")][1]');
  const kpiTile = page.getByText('Total orders').locator('xpath=ancestor::div[contains(@class,"rounded-lg")][1]');

  return {
    'Page shell': await sampleBackground(pageShell),
    'Filter strip': await sampleBackground(filterStrip),
    Navigator: await sampleBackground(navigator),
    'KPI tile (hub)': await sampleBackground(kpiTile),
  };
}

async function samplePoDetail(
  page: import('@playwright/test').Page,
  poNumber: string,
): Promise<RegionSamples> {
  await page.getByRole('button', { name: poNumber, exact: false }).first().click();
  await page.locator('#po-section-details').waitFor({ state: 'visible', timeout: 20_000 });

  const section = page.locator('#po-section-details');
  const scrollCanvas = await sampleScrollParentBackground(section);
  const sectionBlock = await sampleBackground(section);

  return {
    'Detail scroll canvas': scrollCanvas,
    'Primary section block': sectionBlock,
  };
}

async function sampleAccountsLanding(page: import('@playwright/test').Page): Promise<RegionSamples> {
  await page.goto('/accounts');
  await expect(page.getByRole('link', { name: 'Accounts' }).first()).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByText('Total Accounts Payable')).toBeVisible({ timeout: 15_000 });

  const pageShell = page.locator('div.flex.h-screen.overflow-hidden.bg-background').first();
  const kpiTile = page
    .getByText('Total Accounts Payable')
    .locator('xpath=ancestor::div[contains(@class,"rounded-lg")][1]');

  return {
    'Page shell': await sampleBackground(pageShell),
    'KPI tile (hub)': await sampleBackground(kpiTile),
  };
}

async function sampleAccountDetail(
  page: import('@playwright/test').Page,
  accountId: number,
  invoiceId: number,
): Promise<RegionSamples> {
  await openAccountDetail(page, accountId, invoiceId);
  await expect(page.getByTestId('account-invoice-detail-panel')).toBeVisible({ timeout: 15_000 });

  const pageShell = page.locator('div.flex.flex-1.min-h-0.overflow-hidden.bg-background').first();
  const filterStrip = page.locator('#account-invoice-toolbar');
  const navigator = page
    .getByRole('heading', { name: /^Invoices/ })
    .locator('xpath=ancestor::div[contains(@class,"bg-card")][1]');
  const scrollCanvas = page.getByTestId('account-invoice-detail-panel').locator('> div').first();
  const sectionBlock = page
    .getByTestId('account-invoice-detail-panel')
    .locator('.bg-card')
    .first();

  return {
    'Page shell': await sampleBackground(pageShell),
    'Filter strip': await sampleBackground(filterStrip),
    Navigator: await sampleBackground(navigator),
    'Detail scroll canvas': await sampleScrollParentBackground(sectionBlock),
    'Primary section block': await sampleBackground(sectionBlock),
  };
}

test.describe('Color scheme audit — PO vs Accounts', () => {
  test('samples backgrounds in light and dark (diagnostic report)', async ({ page, request }, testInfo) => {
    test.setTimeout(180_000);

    await seedAuthenticatedSession(page, request);
    const { token, workspaceId } = await getWorkspaceAuth(page, request);

    const purchaseOrders = await listPurchaseOrders(request, token, workspaceId);
    test.skip(purchaseOrders.length === 0, 'No purchase orders — create one first.');

    const accountMatch = await findAccountWithInvoices(request, token, workspaceId);
    test.skip(!accountMatch, 'No account with invoices — create a PO invoice first.');

    const { account, invoices } = accountMatch!;
    const firstInvoice = invoices[0];

    const allRows: ColorAuditRow[] = [];

    for (const theme of ['light', 'dark'] as const) {
      await ensureTheme(page, theme);

      const poHub = await samplePoHub(page, purchaseOrders[0].po_number);
      const poDetail = await samplePoDetail(page, purchaseOrders[0].po_number);
      const poSamples: RegionSamples = { ...poHub, ...poDetail };

      await page.screenshot({
        path: testInfo.outputPath(`po-${theme}.png`),
        fullPage: false,
      });

      const accountsLanding = await sampleAccountsLanding(page);
      const accountsDetail = await sampleAccountDetail(page, account.id, firstInvoice.id);
      const accountsSamples: RegionSamples = {
        ...accountsLanding,
        ...accountsDetail,
      };

      await page.screenshot({
        path: testInfo.outputPath(`accounts-detail-${theme}.png`),
        fullPage: false,
      });

      allRows.push(...buildComparisonRows(theme, poSamples, accountsSamples, REGION_META));
    }

    const report = formatColorReport(allRows);
    console.log(report);

    await testInfo.attach('color-audit-report.txt', {
      body: report,
      contentType: 'text/plain',
    });

    await testInfo.attach('color-audit-report.json', {
      body: JSON.stringify(allRows, null, 2),
      contentType: 'application/json',
    });

    expect(allRows.length).toBeGreaterThan(0);
  });
});
