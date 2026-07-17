import { test, expect } from '@playwright/test';
import { apiURL } from '../playwright.config';
import { loginViaApi, seedAuthenticatedSession } from './helpers/auth';

function templateFieldButton(page: import('@playwright/test').Page) {
  return page.getByRole('button', { name: /^(Select template|Change template)/i });
}

async function openSheetTemplatePicker(page: import('@playwright/test').Page) {
  const closeNotifications = page.getByRole('button', { name: 'Close' }).filter({ hasText: 'Close' });
  if (await closeNotifications.isVisible().catch(() => false)) {
    await closeNotifications.click();
  }
  const trigger = templateFieldButton(page);
  await expect(trigger).toBeVisible({ timeout: 15_000 });
  await trigger.click();
  const picker = page.getByRole('dialog', { name: 'Select template' });
  await expect(picker).toBeVisible({ timeout: 10_000 });
  return picker;
}

test.describe('Work order templates', () => {
  test('sheet picker, apply template, save from form', async ({ page, request }) => {
    test.setTimeout(90_000);

    const { factoryId } = await seedAuthenticatedSession(page, request);
    test.skip(!factoryId, 'No factory in workspace — create a factory first.');

    await page.goto('/machines');
    await page.getByRole('tab', { name: 'Work Orders' }).click();
    await expect(page.getByText('Log maintenance')).toBeVisible({ timeout: 15_000 });

    const picker = await openSheetTemplatePicker(page);
    await expect(picker.getByText('No template', { exact: true })).toBeVisible();
    await expect(picker.getByRole('button', { name: 'Save current' })).toBeVisible();
    await expect(picker.getByRole('button', { name: 'New template' })).toBeVisible();
    await expect(picker.getByRole('button', { name: 'Continue without template' })).toBeVisible();

    const templateRows = picker.locator('[role="option"]').filter({ hasNotText: 'No template' });
    const rowCount = await templateRows.count();

    if (rowCount > 0) {
      await templateRows.first().click();
      await picker.getByRole('button', { name: 'Use template' }).click();
      await expect(picker).toBeHidden();
    } else {
      await picker.getByRole('button', { name: 'Continue without template' }).click();
      await expect(picker).toBeHidden();
    }

    const pickerAgain = await openSheetTemplatePicker(page);
    await pickerAgain.getByRole('button', { name: 'Save current' }).click();

    const uniqueName = `E2E Template ${Date.now()}`;
    const savePopover = page.locator('[data-radix-popper-content-wrapper]').last();
    await expect(savePopover.getByPlaceholder('Template name')).toBeVisible({ timeout: 5_000 });
    await savePopover.getByPlaceholder('Template name').fill(uniqueName);

    const createResponse = page.waitForResponse(
      (res) =>
        res.url().includes('/work-order-templates') &&
        res.request().method() === 'POST' &&
        res.status() >= 200 &&
        res.status() < 300,
    );
    await savePopover.getByRole('button', { name: 'Save template' }).click();
    const res = await createResponse;
    expect(res.ok()).toBeTruthy();

    await expect(page.getByText('Template saved').first()).toBeVisible({ timeout: 10_000 });

    const login = await loginViaApi(request);
    const workspaceData = JSON.parse(
      (await page.evaluate(() => localStorage.getItem('workspace_data'))) ?? '{}',
    );
    const listRes = await request.get(`${apiURL}work-order-templates/?is_active=true&limit=100`, {
      headers: {
        Authorization: `Bearer ${login.access_token}`,
        'X-Workspace-ID': String(workspaceData.id),
      },
    });
    expect(listRes.ok()).toBeTruthy();
    const templates = (await listRes.json()) as { template_name: string }[];
    expect(templates.some((t) => t.template_name === uniqueName)).toBeTruthy();
  });

  test('full new template dialog from picker', async ({ page, request }) => {
    test.setTimeout(60_000);

    const { factoryId } = await seedAuthenticatedSession(page, request);
    test.skip(!factoryId, 'No factory in workspace — create a factory first.');

    await page.goto('/machines');
    await page.getByRole('tab', { name: 'Work Orders' }).click();
    await expect(page.getByText('Log maintenance')).toBeVisible({ timeout: 15_000 });

    const picker = await openSheetTemplatePicker(page);
    await picker.getByRole('button', { name: 'New template' }).click();

    const editor = page.getByRole('dialog', { name: 'New template' });
    await expect(editor).toBeVisible();

    const name = `E2E Full ${Date.now()}`;
    await editor.getByPlaceholder('e.g. Monthly Oil Change').fill(name);

    const typeTrigger = editor.getByRole('combobox').first();
    const typeLabel = (await typeTrigger.textContent()) ?? '';
    if (typeLabel.includes('Select')) {
      await typeTrigger.click();
      await page.getByRole('option').nth(1).click();
    }

    await expect(editor.getByRole('button', { name: 'Create template' })).toBeEnabled({ timeout: 10_000 });

    const createResponse = page.waitForResponse(
      (res) =>
        res.url().includes('/work-order-templates') &&
        res.request().method() === 'POST' &&
        res.status() >= 200 &&
        res.status() < 300,
    );
    await editor.getByRole('button', { name: 'Create template' }).click();
    await createResponse;

    await expect(page.getByText('Template created').first()).toBeVisible({ timeout: 10_000 });
    await expect(editor).toBeHidden();
  });
});
