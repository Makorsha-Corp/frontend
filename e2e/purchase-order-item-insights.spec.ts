import { test, expect } from '@playwright/test';
import { seedAuthenticatedSession } from './helpers/auth';
import {
  createPurchaseOrderViaDialog,
  getPoItemPriceInsights,
  getWorkspaceIdFromPage,
} from './helpers/purchaseOrder';

test.describe('Purchase orders — item price insights', () => {
  test('shows last order and lowest price from a prior PO', async ({ page, request }) => {
    test.setTimeout(120_000);

    const { factoryId, factoryName } = await seedAuthenticatedSession(page, request);
    test.skip(!factoryId, 'No factory in workspace — create a factory first.');

    const ts = Date.now();
    const unitPrice = '12.50';
    const qty = 2;

    await page.goto('/orders/purchase');
    await expect(page.getByRole('button', { name: 'Add Purchase Order' })).toBeVisible({
      timeout: 15_000,
    });

    const po1 = await createPurchaseOrderViaDialog(page, {
      description: `E2E insights PO1 ${ts}`,
      qty,
      unitPrice,
      factoryName,
    });

    await page.goto('/orders/purchase');
    await expect(page.getByRole('button', { name: 'Add Purchase Order' })).toBeVisible({
      timeout: 15_000,
    });

    const po2 = await createPurchaseOrderViaDialog(page, {
      description: `E2E insights PO2 ${ts}`,
      qty,
      unitPrice: '15.00',
      factoryName,
      itemNameMatch: po1.itemName.split('(')[0].trim(),
    });

    const workspaceId = await getWorkspaceIdFromPage(page);

    const insightsResponse = page.waitForResponse(
      (res) =>
        res.url().includes(`/purchase-orders/${po2.id}/item-price-insights/`) &&
        res.request().method() === 'GET' &&
        res.status() === 200,
    );
    await page.goto(`/orders/purchase?orderId=${po2.id}`);
    await insightsResponse;

    await expect(page).toHaveURL(new RegExp(`orderId=${po2.id}`));
    await expect(page.getByText(`E2E insights PO2 ${ts}`)).toBeVisible({ timeout: 15_000 });

    await expect
      .poll(async () => {
        const insights = await getPoItemPriceInsights(request, po2.id, workspaceId);
        return insights.items.find((row) => row.item_id === po1.itemId)?.last_ordered?.account_name;
      })
      .toBeTruthy();

    const insights = await getPoItemPriceInsights(request, po2.id, workspaceId);
    const itemInsight = insights.items.find((row) => row.item_id === po1.itemId)!;
    expect(itemInsight.last_ordered).toBeTruthy();
    expect(itemInsight.last_ordered!.purchase_order_id).toBe(po1.id);

    const lowestRef = itemInsight.lowest.avg_supplier ?? itemInsight.lowest.all_time;
    expect(lowestRef).toBeTruthy();
    expect(lowestRef!.account_name).toBeTruthy();

    const itemsSection = page.locator('#po-section-items');
    await itemsSection.scrollIntoViewIfNeeded();
    await expect(itemsSection.getByTestId('po-insights-col-last-order')).toBeVisible();
    await expect(itemsSection.getByTestId('po-insights-col-lowest-toggle')).toHaveText(
      /Lowest \(Avg\)/,
    );

    const itemRow = itemsSection.locator('tbody tr').filter({
      hasText: po1.itemName.split('(')[0].trim(),
    });
    const lastOrderCell = itemRow.getByTestId('po-insights-last-order-cell');
    await expect(lastOrderCell).toContainText(itemInsight.last_ordered!.account_name!, {
      timeout: 20_000,
    });
    await expect(lastOrderCell).toContainText('$12.50');

    const lowestCell = itemRow.getByTestId('po-insights-lowest-cell');
    await expect(lowestCell).toContainText(lowestRef!.account_name!);
    const lowestPriceFormatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Number(lowestRef!.unit_price));
    await expect(lowestCell).toContainText(lowestPriceFormatted);

    let insightsRequestCount = 0;
    page.on('request', (req) => {
      if (req.url().includes('/item-price-insights/') && req.method() === 'GET') {
        insightsRequestCount += 1;
      }
    });

    const toggle = itemsSection.getByTestId('po-insights-col-lowest-toggle');
    await toggle.click();
    await expect(toggle).toHaveText(/Lowest \(All time\)/);
    await expect(insightsRequestCount).toBe(0);

    await lastOrderCell.click();
    const summaryDialog = page.getByRole('dialog');
    await expect(summaryDialog).toBeVisible({ timeout: 10_000 });
    await summaryDialog.getByRole('button', { name: 'Go to order' }).click();
    await expect(page.getByText(`E2E insights PO1 ${ts}`)).toBeVisible({ timeout: 15_000 });
  });
});
