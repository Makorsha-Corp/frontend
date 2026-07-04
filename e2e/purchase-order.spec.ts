import { test, expect } from '@playwright/test';
import { apiURL } from '../playwright.config';
import { loginViaApi, seedAuthenticatedSession } from './helpers/auth';

test.describe('Purchase orders', () => {
  test('creates a new purchase order', async ({ page, request }) => {
    test.setTimeout(60_000);

    const { factoryId, factoryName } = await seedAuthenticatedSession(page, request);
    test.skip(!factoryId, 'No factory in workspace — create a factory first.');

    const description = `E2E PO ${Date.now()}`;
    const dialog = () => page.getByRole('dialog', { name: 'Add Purchase Order' });

    await page.goto('/orders/purchase');
    await expect(page.getByRole('button', { name: 'Add Purchase Order' })).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole('button', { name: 'Add Purchase Order' }).click();
    await expect(dialog()).toBeVisible();

    // Factory destination (default). Ensure a factory is selected.
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

    await dialog().getByRole('textbox', { name: 'Optional' }).fill(description);

    // Line item: first available product.
    await dialog().getByRole('combobox').filter({ hasText: 'Select item' }).click();
    const firstItem = page.getByRole('option').first();
    await expect(firstItem).toBeVisible({ timeout: 10_000 });
    const itemName = (await firstItem.textContent())?.trim() ?? '';
    await firstItem.click();

    await dialog().getByRole('spinbutton').first().fill('3');
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
    if (itemName) {
      await expect(
        page.getByText(itemName.split('(')[0].trim(), { exact: false }),
      ).toBeVisible();
    }

    const login = await loginViaApi(request);
    const workspaceData = JSON.parse(
      (await page.evaluate(() => localStorage.getItem('workspace_data'))) ?? '{}',
    );
    const detailRes = await request.get(`${apiURL}purchase-orders/${created.id}/`, {
      headers: {
        Authorization: `Bearer ${login.access_token}`,
        'X-Workspace-ID': String(workspaceData.id),
      },
    });
    expect(detailRes.ok()).toBeTruthy();
    const detail = await detailRes.json();
    expect(detail.description).toBe(description);
  });
});
