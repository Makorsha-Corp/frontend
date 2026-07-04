import { expect, type APIRequestContext, type Page } from '@playwright/test';
import { apiURL } from '../../playwright.config';
import { loginViaApi } from './auth';

export async function getWorkspaceIdFromPage(page: Page): Promise<number> {
  const workspaceData = JSON.parse(
    (await page.evaluate(() => localStorage.getItem('workspace_data'))) ?? '{}',
  );
  return workspaceData.id as number;
}

export async function getPurchaseOrder(
  request: APIRequestContext,
  poId: number,
  workspaceId: number,
) {
  const login = await loginViaApi(request);
  const res = await request.get(`${apiURL}purchase-orders/${poId}/`, {
    headers: {
      Authorization: `Bearer ${login.access_token}`,
      'X-Workspace-ID': String(workspaceId),
    },
  });
  expect(res.ok()).toBeTruthy();
  return res.json() as Promise<{
    id: number;
    invoice_id: number | null;
    supplier_confirmed: boolean;
    details_confirmed: boolean;
    items_confirmed: boolean;
    order_completed?: boolean;
    current_status_name?: string | null;
    description?: string | null;
  }>;
}

export async function waitForPurchaseOrder(
  request: APIRequestContext,
  poId: number,
  workspaceId: number,
  predicate: (po: Awaited<ReturnType<typeof getPurchaseOrder>>) => boolean,
  timeoutMs = 30_000,
) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const po = await getPurchaseOrder(request, poId, workspaceId);
    if (predicate(po)) return po;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Timed out waiting for purchase order ${poId} condition`);
}

/** Pick the first account in AccountSelectorDialog (supplier picker). */
export async function selectFirstSupplier(page: Page, triggerLabel: string | RegExp) {
  await page.getByRole('button', { name: triggerLabel }).click();
  const dialog = page.getByRole('dialog', { name: /Select supplier/i });
  await expect(dialog).toBeVisible({ timeout: 10_000 });

  const accountRow = dialog.getByRole('button', { name: /#\d+/ }).first();
  await expect(accountRow).toBeVisible({ timeout: 15_000 });
  await accountRow.click();

  const selectBtn = dialog.getByRole('button', { name: 'Select account' });
  await expect(selectBtn).toBeEnabled({ timeout: 5_000 });
  await selectBtn.click();
  await expect(dialog).toBeHidden();
}

const SECTION_CONFIRM_TOAST: Record<'supplier' | 'details' | 'items', RegExp> = {
  supplier: /Supplier confirmed/i,
  details: /Order details confirmed/i,
  items: /Order items confirmed/i,
};

export async function confirmPoSection(
  page: Page,
  section: 'supplier' | 'details' | 'items',
) {
  const button = page.locator(`#po-confirm-${section}`);
  await expect(button).toBeVisible({ timeout: 10_000 });
  await expect(button).toHaveAttribute('aria-pressed', 'false');
  await button.click();
  await expect(page.getByText(SECTION_CONFIRM_TOAST[section]).first()).toBeVisible({
    timeout: 15_000,
  });
  await expect(button).toHaveAttribute('aria-pressed', 'true');
}

export async function approvePoIfRequired(page: Page) {
  const approveBtn = page.getByRole('button', { name: 'Approve', exact: true });
  if (!(await approveBtn.isVisible().catch(() => false))) return;
  if (!(await approveBtn.isEnabled())) return;
  await approveBtn.click();
  await expect(page.getByText(/approved/i).first()).toBeVisible({ timeout: 15_000 });
}

export async function finalizePoInvoice(page: Page) {
  await approvePoIfRequired(page);

  const finalizeBtn = page.locator('#po-finalize-invoice-btn');
  await expect(finalizeBtn).toBeVisible({ timeout: 20_000 });
  await finalizeBtn.click();

  const blockedPopover = page.getByText('Approvals required before confirming invoice');
  if (await blockedPopover.isVisible().catch(() => false)) {
    await approvePoIfRequired(page);
    await page.keyboard.press('Escape');
    await finalizeBtn.click();
  }

  const confirmDialog = page.getByRole('dialog', { name: 'Confirm Invoice' });
  await expect(confirmDialog).toBeVisible({ timeout: 10_000 });
  await confirmDialog.getByRole('button', { name: 'Confirm Invoice' }).click();
  await expect(page.getByText(/Invoice confirmed/i).first()).toBeVisible({ timeout: 15_000 });
}

export async function receiveAllPoItems(page: Page, qtyOrdered: number) {
  await page.locator('#po-manage-receiving-btn').click();
  const overviewDialog = page.getByRole('dialog', { name: 'Manage Receiving' });
  await expect(overviewDialog).toBeVisible();

  await overviewDialog.getByRole('button', { name: 'Receive Items' }).click();
  const receiveDialog = page.getByRole('dialog', { name: 'Receive Items' });
  await expect(receiveDialog).toBeVisible();

  const allButtons = receiveDialog.getByRole('button', { name: 'All' });
  const count = await allButtons.count();
  for (let i = 0; i < count; i += 1) {
    const btn = allButtons.nth(i);
    if (await btn.isEnabled()) await btn.click();
  }

  const confirmBtn = receiveDialog.getByRole('button', { name: 'Confirm Receipt' });
  await expect(confirmBtn).toBeEnabled({ timeout: 5_000 });
  await confirmBtn.click();

  await expect(page.getByText(new RegExp(`${qtyOrdered} / ${qtyOrdered} received`, 'i')).first()).toBeVisible({
    timeout: 15_000,
  });

  const closeDialog = page.getByRole('dialog', { name: /Manage Receiving|Receive Items/i });
  await closeDialog.getByRole('button', { name: 'Close' }).click().catch(async () => {
    await page.keyboard.press('Escape');
  });
}

export async function markPoComplete(page: Page) {
  await page.getByRole('button', { name: 'Mark order complete' }).click();
  await expect(page.getByText(/Purchase order complete|marked complete/i).first()).toBeVisible({
    timeout: 15_000,
  });
}
