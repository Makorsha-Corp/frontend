import type { Locator, Page } from '@playwright/test';

export type ColorSample = {
  rgb: string;
  hex: string;
  alpha: number;
};

export type ColorAuditRow = {
  region: string;
  tier: string;
  po: ColorSample | null;
  accounts: ColorSample | null;
  theme: 'light' | 'dark';
};

function parseRgb(rgb: string): { r: number; g: number; b: number; alpha: number } | null {
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!match) return null;
  return {
    r: Number(match[1]),
    g: Number(match[2]),
    b: Number(match[3]),
    alpha: match[4] != null ? Number(match[4]) : 1,
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

export function colorFromRgbString(rgb: string): ColorSample {
  const parsed = parseRgb(rgb);
  if (!parsed) {
    return { rgb, hex: rgb, alpha: 1 };
  }
  return {
    rgb,
    hex: rgbToHex(parsed.r, parsed.g, parsed.b),
    alpha: parsed.alpha,
  };
}

export async function sampleBackground(locator: Locator): Promise<ColorSample | null> {
  const visible = await locator.first().isVisible().catch(() => false);
  if (!visible) return null;

  const rgb = await locator.first().evaluate((el) => getComputedStyle(el).backgroundColor);
  if (!rgb || rgb === 'rgba(0, 0, 0, 0)' || rgb === 'transparent') {
    return null;
  }
  return colorFromRgbString(rgb);
}

export async function sampleScrollParentBackground(
  locator: Locator,
): Promise<ColorSample | null> {
  const rgb = await locator.first().evaluate((el) => {
    let node: HTMLElement | null = el as HTMLElement;
    while (node) {
      const style = getComputedStyle(node);
      const overflowY = style.overflowY;
      if (overflowY === 'auto' || overflowY === 'scroll') {
        let bgNode: HTMLElement | null = node;
        while (bgNode) {
          const bg = getComputedStyle(bgNode).backgroundColor;
          if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
            return bg;
          }
          bgNode = bgNode.parentElement;
        }
        return style.backgroundColor;
      }
      node = node.parentElement;
    }
    return null;
  });
  if (!rgb || rgb === 'rgba(0, 0, 0, 0)' || rgb === 'transparent') {
    return null;
  }
  return colorFromRgbString(rgb);
}

export async function getTheme(page: Page): Promise<'light' | 'dark'> {
  return page.evaluate(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light',
  );
}

export async function ensureTheme(page: Page, theme: 'light' | 'dark'): Promise<void> {
  const current = await getTheme(page);
  if (current === theme) return;

  const title =
    theme === 'dark' ? 'Switch to dark mode' : 'Switch to light mode';
  await page.getByTitle(title).click();
  await page.waitForFunction(
    (expectedDark) =>
      document.documentElement.classList.contains('dark') === expectedDark,
    theme === 'dark',
    { timeout: 5_000 },
  );
  await page.waitForTimeout(450);
}

export async function toggleDarkMode(page: Page): Promise<'light' | 'dark'> {
  const before = await getTheme(page);
  await page
    .getByTitle(before === 'light' ? 'Switch to dark mode' : 'Switch to light mode')
    .click();
  await page.waitForFunction(
    (expectedDark) =>
      document.documentElement.classList.contains('dark') === expectedDark,
    before === 'light',
    { timeout: 5_000 },
  );
  await page.waitForTimeout(450);
  return before === 'light' ? 'dark' : 'light';
}

export function colorsMatch(a: ColorSample | null, b: ColorSample | null): boolean {
  if (!a || !b) return a === b;
  return a.rgb === b.rgb;
}

export function formatColorSample(sample: ColorSample | null): string {
  if (!sample) return '—';
  const alphaSuffix = sample.alpha < 1 ? ` α${sample.alpha.toFixed(2)}` : '';
  return `${sample.hex} (${sample.rgb})${alphaSuffix}`;
}

export function formatColorReport(rows: ColorAuditRow[]): string {
  const lines: string[] = [];
  lines.push('');
  lines.push('Color scheme audit — PO vs Accounts');
  lines.push('='.repeat(100));

  for (const theme of ['light', 'dark'] as const) {
    const themeRows = rows.filter((r) => r.theme === theme);
    if (themeRows.length === 0) continue;

    lines.push('');
    lines.push(`Theme: ${theme.toUpperCase()}`);
    lines.push('-'.repeat(100));
    lines.push(
      padRight('Region', 22) +
        padRight('Tier', 8) +
        padRight('PO', 36) +
        padRight('Accounts', 36) +
        'Match?',
    );

    for (const row of themeRows) {
      lines.push(
        padRight(row.region, 22) +
          padRight(row.tier, 8) +
          padRight(formatColorSample(row.po), 36) +
          padRight(formatColorSample(row.accounts), 36) +
          (colorsMatch(row.po, row.accounts) ? 'yes' : 'NO'),
      );
    }
  }

  lines.push('');
  return lines.join('\n');
}

function padRight(value: string, width: number): string {
  return value.length >= width ? value : value + ' '.repeat(width - value.length);
}

export function buildComparisonRows(
  theme: 'light' | 'dark',
  po: Partial<Record<string, ColorSample | null>>,
  accounts: Partial<Record<string, ColorSample | null>>,
  meta: Record<string, string>,
): ColorAuditRow[] {
  const regions = new Set([...Object.keys(po), ...Object.keys(accounts)]);
  return [...regions].map((region) => ({
    region,
    tier: meta[region] ?? '',
    po: po[region] ?? null,
    accounts: accounts[region] ?? null,
    theme,
  }));
}
