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

export type PoItemPriceInsightRef = {
  purchase_order_id: number;
  po_number: string;
  account_id: number | null;
  account_name: string | null;
  unit_price: number | string | null;
  order_date: string | null;
};

export type PoItemPriceInsightsResponse = {
  items: Array<{
    item_id: number;
    last_ordered: PoItemPriceInsightRef | null;
    lowest: {
      avg_supplier: PoItemPriceInsightRef | null;
      all_time: PoItemPriceInsightRef | null;
      days_30: PoItemPriceInsightRef | null;
      days_90: PoItemPriceInsightRef | null;
    };
  }>;
};

export async function getPoItemPriceInsights(
  request: APIRequestContext,
  poId: number,
  workspaceId: number,
) {
  const login = await loginViaApi(request);
  const res = await request.get(`${apiURL}purchase-orders/${poId}/item-price-insights/`, {
    headers: {
      Authorization: `Bearer ${login.access_token}`,
      'X-Workspace-ID': String(workspaceId),
    },
  });
  expect(res.ok()).toBeTruthy();
  return res.json() as Promise<PoItemPriceInsightsResponse>;
}

export async function getPurchaseOrderItems(
  request: APIRequestContext,
  poId: number,
  workspaceId: number,
) {
  const login = await loginViaApi(request);
  const res = await request.get(`${apiURL}purchase-orders/${poId}/items/`, {
    headers: {
      Authorization: `Bearer ${login.access_token}`,
      'X-Workspace-ID': String(workspaceId),
    },
  });
  expect(res.ok()).toBeTruthy();
  return res.json() as Promise<
    Array<{
      id: number;
      item_id: number;
      item_name: string | null;
      unit_price: number | string | null;
      quantity_ordered: number | string;
    }>
  >;
}

export type CreatePurchaseOrderViaDialogOptions = {
  description: string;
  qty: number;
  unitPrice: string;
  factoryName?: string | null;
  itemOptionIndex?: number;
  itemNameMatch?: string;
  withSupplier?: boolean;
};

export type CreatedPurchaseOrderViaDialog = {
  id: number;
  itemName: string;
  itemId: number;
};

export async function createPurchaseOrderViaDialog(
  page: Page,
  options: CreatePurchaseOrderViaDialogOptions,
): Promise<CreatedPurchaseOrderViaDialog> {
  const {
    description,
    qty,
    unitPrice,
    factoryName,
    itemOptionIndex = 0,
    itemNameMatch,
    withSupplier = true,
  } = options;

  const dialog = () => page.getByRole('dialog', { name: 'Add Purchase Order' });

  await page.getByRole('button', { name: 'Add Purchase Order' }).click();
  await expect(dialog()).toBeVisible();

  const factoryTrigger = dialog().getByRole('combobox').nth(1);
  const factoryLabel = await factoryTrigger.textContent();
  if (factoryLabel?.includes('Select factory')) {
    await factoryTrigger.click();
    if (factoryName) {
      await page.getByRole('option', { name: new RegExp(factoryName, 'i') }).click();
    } else {
      await page.getByRole('option').nth(1).click();
    }
  }

  if (withSupplier) {
    await selectFirstSupplier(page, 'Select supplier');
  }

  await dialog().getByRole('textbox', { name: 'Optional' }).fill(description);

  await dialog().getByRole('combobox').filter({ hasText: 'Select item' }).click();
  const itemOption = itemNameMatch
    ? page.getByRole('option', { name: new RegExp(itemNameMatch, 'i') }).first()
    : page.getByRole('option').nth(itemOptionIndex);
  await expect(itemOption).toBeVisible({ timeout: 10_000 });
  const itemName = (await itemOption.textContent())?.trim() ?? '';
  await itemOption.click();

  await dialog().getByRole('spinbutton').first().fill(String(qty));
  if (unitPrice) {
    await dialog().getByPlaceholder('Optional').last().fill(unitPrice);
  }
  await dialog().getByRole('button', { name: 'Add line item' }).click();
  await expect(dialog().getByText('1 added')).toBeVisible();

  const createResponse = page.waitForResponse(
    (res) =>
      res.url().includes('/purchase-orders/') &&
      res.request().method() === 'POST' &&
      res.status() >= 200 &&
      res.status() < 300,
  );
  await dialog().getByRole('button', { name: 'Create', exact: true }).click();
  const res = await createResponse;
  const created = (await res.json()) as { id: number };

  await expect(page.getByText('Purchase order created').first()).toBeVisible({ timeout: 10_000 });
  await expect(dialog()).toBeHidden();
  await expect(page.getByText(description)).toBeVisible({ timeout: 15_000 });

  const workspaceId = await getWorkspaceIdFromPage(page);
  const items = await getPurchaseOrderItems(page.request, created.id, workspaceId);
  expect(items.length).toBeGreaterThan(0);

  return {
    id: created.id,
    itemName: items[0].item_name ?? itemName.split('(')[0].trim(),
    itemId: items[0].item_id,
  };
}
