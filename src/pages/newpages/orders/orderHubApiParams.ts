import { API_LIMITS } from '@/constants/apiLimits';

export const ORDER_HUB_PAGE_SIZE = API_LIMITS.ORDER_HUB_PAGE_SIZE;

export const ORDER_HUB_PAGE_PARAMS = {
  purchase: 'poPage',
  expense: 'eoPage',
  transfer: 'trPage',
} as const;

export function parseOrderHubPage(raw: string | null): number {
  const parsed = Number(raw ?? '1');
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.floor(parsed);
}

export function orderHubPageCount(
  total: number,
  pageSize: number = ORDER_HUB_PAGE_SIZE,
): number {
  if (total <= 0) return 1;
  return Math.max(1, Math.ceil(total / pageSize));
}
