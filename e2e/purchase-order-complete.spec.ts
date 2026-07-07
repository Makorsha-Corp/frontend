import { test, expect } from '@playwright/test';
import { seedAuthenticatedSession } from './helpers/auth';
import {
  confirmPoSection,
  finalizePoInvoice,
  getWorkspaceIdFromPage,
  markPoComplete,
  receiveAllPoItems,
  selectFirstSupplier,
  waitForPurchaseOrder,
} from './helpers/purchaseOrder';

test.describe('Purchase orders — full lifecycle', () => {
  test('creates a PO and completes it through receiving', async ({ page, request }) => {
    test.setTimeout(180_000);

    const { factoryId, factoryName } = await seedAuthenticatedSession(page, request);
    test.skip(!factoryId, 'No factory in workspace — create a factory first.');

    const description = `E2E complete PO ${Date.now()}`;
    const qtyOrdered = 3;
    const unitPrice = '12.50';
    const dialog = () => page.getByRole('dialog', { name: 'Add Purchase Order' });

    await page.goto('/orders/purchase');
    await expect(page.getByRole('button', { name: 'Add Purchase Order' })).toBeVisible({
      timeout: 15_000,
    });

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

    await selectFirstSupplier(page, 'Select supplier');
    await dialog().getByRole('textbox', { name: 'Optional' }).fill(description);

    await dialog().getByRole('combobox').filter({ hasText: 'Select item' }).click();
    const firstItem = page.getByRole('option').first();
    await expect(firstItem).toBeVisible({ timeout: 10_000 });
    await firstItem.click();

    await dialog().getByRole('spinbutton').first().fill(String(qtyOrdered));
    await dialog().getByPlaceholder('Optional').last().fill(unitPrice);
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

    await confirmPoSection(page, 'supplier');
    await confirmPoSection(page, 'details');
    await confirmPoSection(page, 'items');

    await waitForPurchaseOrder(
      request,
      created.id,
      workspaceId,
      (po) => po.invoice_id != null && po.supplier_confirmed && po.details_confirmed && po.items_confirmed,
    );

    await finalizePoInvoice(page);
    await receiveAllPoItems(page, qtyOrdered);
    await markPoComplete(page);

    const finalPo = await waitForPurchaseOrder(
      request,
      created.id,
      workspaceId,
      (po) =>
        Boolean(po.order_completed) ||
        po.current_status_name?.startsWith('Complete') === true,
    );

    expect(finalPo.order_completed || finalPo.current_status_name?.includes('Complete')).toBeTruthy();
    await expect(page.getByText(/Complete|Record payment/i).first()).toBeVisible({ timeout: 10_000 });
  });
});
