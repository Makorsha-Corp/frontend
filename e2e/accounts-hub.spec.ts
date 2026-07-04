/**
 * Accounts hub E2E — requires dev frontend + API (PLAYWRIGHT_API_URL, default localhost:8000).
 * Uses seeded auth via localStorage; needs at least one account in workspace.
 */
import { test, expect } from '@playwright/test';
import { seedAuthenticatedSession } from './helpers/auth';
import { openAccountsHub, openFirstAccountFromHubTable } from './helpers/accounts';

test.describe('Accounts hub', () => {
  test('aggregated tab opens account detail with account name in header', async ({ page, request }) => {
    test.setTimeout(60_000);
    await seedAuthenticatedSession(page, request);

    await openAccountsHub(page, 'aggregated');

    const tableRows = page.locator('table tbody tr');
    const rowCount = await tableRows.count();
    test.skip(rowCount === 0, 'No accounts in workspace — add an account first.');

    const accountName = await openFirstAccountFromHubTable(page);
    expect(page.url()).toMatch(/\/accounts\/\d+/);

    if (accountName) {
      await expect(page.getByText(accountName, { exact: false }).first()).toBeVisible({ timeout: 10_000 });
    }

    await expect(page.getByTestId('account-invoice-search')).toBeVisible();
    await expect(page.getByTestId('account-detail-kpi-invoiced')).toBeVisible();
  });

  test('payable tab navigates to account detail workspace', async ({ page, request }) => {
    test.setTimeout(60_000);
    await seedAuthenticatedSession(page, request);

    await openAccountsHub(page, 'aggregated');
    await page.getByRole('button', { name: 'Payable' }).click();
    await expect(page).toHaveURL(/\/accounts\/payable/);

    const tableRows = page.locator('table tbody tr');
    const rowCount = await tableRows.count();
    test.skip(rowCount === 0, 'No payable accounts in view — skip payable navigation test.');

    await openFirstAccountFromHubTable(page);
    await expect(page.getByTestId('account-invoice-search')).toBeVisible();

    const typeTrigger = page.getByRole('combobox', { name: 'Invoice type' });
    await expect(typeTrigger).toContainText('Payable');
  });
});
