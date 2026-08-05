import { test, expect } from '@playwright/test';
import { apiURL } from '../playwright.config';
import { loginViaApi, listWorkspaces, listFactories, seedAuthenticatedSession } from './helpers/auth';

type ItemIncomingSummary = {
  factory_id: number;
  item_id: number;
  total_pending_qty: number | string;
  order_count: number;
};

type InventoryListResponse = {
  items: InventoryRow[];
  total: number;
};

type InventoryRow = {
  factory_id: number;
  item_id: number;
  item_name?: string | null;
  inventory_type: string;
  qty?: number | string;
};

const INCOMING_OPENAPI_FRAGMENT = 'incoming-summary';

test.describe('Storage incoming column', () => {
  test.describe.configure({ mode: 'serial' });

  test('OpenAPI lists incoming-summary route', async ({ request }) => {
    const res = await request.get(`${apiURL}openapi.json`);
    expect(res.ok(), `openapi.json failed (${res.status()})`).toBeTruthy();

    const openapi = (await res.json()) as { paths?: Record<string, unknown> };
    const paths = Object.keys(openapi.paths ?? {});
    const inventoryPaths = paths.filter((p) => p.includes('/inventory'));
    const hasRoute = paths.some((p) => p.includes(INCOMING_OPENAPI_FRAGMENT));

    if (!hasRoute) {
      await test.info().attach('openapi-inventory-paths', {
        body: JSON.stringify(inventoryPaths, null, 2),
        contentType: 'application/json',
      });
    }

    expect(
      hasRoute,
      'OpenAPI missing /api/v1/inventory/incoming-summary/ — backend worker likely stale. Stop uvicorn, restart, verify /api/v1/docs.',
    ).toBe(true);
  });

  test('authenticated incoming-summary returns 200', async ({ request }) => {
    const login = await loginViaApi(request);
    const workspaces = await listWorkspaces(request, login.access_token);
    expect(workspaces.length, 'Test user needs at least one workspace').toBeGreaterThan(0);
    const workspaceId = workspaces[0].id;

    const res = await request.get(`${apiURL}inventory/incoming-summary/`, {
      headers: {
        Authorization: `Bearer ${login.access_token}`,
        'X-Workspace-ID': String(workspaceId),
      },
    });

    const bodyText = await res.text();
    if (!res.ok()) {
      throw new Error(
        `incoming-summary failed (${res.status()}): ${bodyText.slice(0, 500)}. ` +
          'If 422, route not loaded — restart local backend.',
      );
    }

    const rows = JSON.parse(bodyText) as InventoryListResponse | ItemIncomingSummary[];
    const incomingRows = Array.isArray(rows) ? rows : rows.items;
    expect(Array.isArray(incomingRows)).toBe(true);

    await test.info().attach('incoming-summary-sample', {
      body: JSON.stringify(
        {
          rowCount: incomingRows.length,
          sample: incomingRows.slice(0, 5),
        },
        null,
        2,
      ),
      contentType: 'application/json',
    });

    const withPending = incomingRows.filter((r) => Number(r.total_pending_qty) > 0 && r.order_count > 0);
    test.info().annotations.push({
      type: 'diagnostic',
      description: `${incomingRows.length} incoming rows; ${withPending.length} with pending qty > 0`,
    });
  });

  test('storage page shows Incoming column without error banner', async ({ page, request }) => {
    test.setTimeout(60_000);

    await seedAuthenticatedSession(page, request);

    const incomingResponse = page.waitForResponse(
      (res) =>
        res.url().includes('inventory/incoming-summary') && res.request().method() === 'GET',
      { timeout: 30_000 },
    );

    await page.goto('/storage');

    const incomingRes = await incomingResponse;
    expect(
      incomingRes.status(),
      `incoming-summary network status was ${incomingRes.status()}`,
    ).toBe(200);

    await expect(page.getByRole('heading', { name: 'Storage', level: 1 })).toBeVisible({
      timeout: 15_000,
    });

    const incomingHeader = page.getByTestId('storage-incoming-header');
    await expect(incomingHeader).toBeVisible({ timeout: 15_000 });

    const headers = page.getByRole('columnheader');
    await expect(headers.nth(0)).toHaveText(/Item/i);
    await expect(headers.nth(1)).toHaveText(/Incoming/i);

    await expect(page.getByText('Incoming summary route not loaded')).toBeHidden();
    await expect(page.getByText('Incoming order quantities unavailable')).toBeHidden();
  });

  test('existing PO data renders +qty when API has pending rows', async ({ page, request }) => {
    test.setTimeout(60_000);

    const login = await loginViaApi(request);
    const workspaces = await listWorkspaces(request, login.access_token);
    const workspaceId = workspaces[0].id;
    const authHeaders = {
      Authorization: `Bearer ${login.access_token}`,
      'X-Workspace-ID': String(workspaceId),
    };

    const incomingRes = await request.get(`${apiURL}inventory/incoming-summary/`, {
      headers: authHeaders,
    });
    expect(incomingRes.ok()).toBeTruthy();
    const incomingPayload = (await incomingRes.json()) as InventoryListResponse | ItemIncomingSummary[];
    const incomingRows = Array.isArray(incomingPayload) ? incomingPayload : incomingPayload.items;
    const pendingRows = incomingRows.filter(
      (r) => Number(r.total_pending_qty) > 0 && r.order_count > 0,
    );

    if (pendingRows.length === 0) {
      test.info().annotations.push({
        type: 'diagnostic',
        description:
          'API OK but no rows with pending qty — open storage POs (PFS) or inbound transfers may be absent, terminal, or fully received.',
      });
      return;
    }

    const inventoryRes = await request.get(
      `${apiURL}inventory/?skip=0&limit=500&include_zero_qty=true`,
      {
        headers: authHeaders,
      },
    );
    expect(inventoryRes.ok()).toBeTruthy();
    const inventoryPayload = (await inventoryRes.json()) as InventoryListResponse | InventoryRow[];
    const inventory = Array.isArray(inventoryPayload) ? inventoryPayload : inventoryPayload.items;
    expect(Array.isArray(inventory)).toBe(true);

    const target = pendingRows.find((row) =>
      inventory.some(
        (inv) =>
          inv.factory_id === row.factory_id &&
          inv.item_id === row.item_id &&
          inv.inventory_type === 'STORAGE',
      ),
    );

    if (!target) {
      test.info().annotations.push({
        type: 'diagnostic',
        description:
          'Incoming API has pending qty but no matching STORAGE inventory row — item may not exist in storage snapshot yet.',
      });
      return;
    }

    const invMatch = inventory.find(
      (inv) =>
        inv.factory_id === target.factory_id &&
        inv.item_id === target.item_id &&
        inv.inventory_type === 'STORAGE',
    );
    const itemLabel = invMatch?.item_name?.trim() || `Item #${target.item_id}`;
    const showEmptyRows = Number(invMatch?.qty ?? 0) <= 0;

    const factories = await listFactories(request, login.access_token, workspaceId);
    const targetFactory = factories.find((f) => f.id === target.factory_id);

    await seedAuthenticatedSession(page, request);
    await page.evaluate(
      ({ factory }) => {
        if (factory) {
          localStorage.setItem('selected_factory', JSON.stringify(factory));
        } else {
          localStorage.removeItem('selected_factory');
        }
      },
      { factory: targetFactory ?? { id: target.factory_id, name: `Factory #${target.factory_id}`, abbreviation: '' } },
    );

    const storageQuery = new URLSearchParams({
      factoryId: String(target.factory_id),
      itemId: String(target.item_id),
      inventoryType: 'STORAGE',
    });
    if (showEmptyRows) storageQuery.set('storageEmpty', '1');

    const inventoryPageResponse = page.waitForResponse(
      (res) => res.url().includes('inventory/?') && res.request().method() === 'GET',
      { timeout: 30_000 },
    );

    await page.goto(`/storage?${storageQuery.toString()}`);
    await inventoryPageResponse;

    await expect(page.getByTestId('storage-incoming-header')).toBeVisible({ timeout: 15_000 });

    const itemRow = page.getByRole('row').filter({ hasText: itemLabel });
    await expect(itemRow.first()).toBeVisible({ timeout: 15_000 });

    const pendingQty = Number(target.total_pending_qty);
    await expect(itemRow.first()).toContainText(`+${pendingQty}`);
    await expect(itemRow.first()).toContainText(/\d+ orders?/);
  });
});
