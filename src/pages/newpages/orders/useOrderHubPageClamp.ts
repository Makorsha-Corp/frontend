import { useEffect } from 'react';
import type { SetURLSearchParams } from 'react-router-dom';
import { ORDER_HUB_PAGE_SIZE, resolveClampedPage } from './orderHubApiParams';

/** Clamp hub page URL when filter shrink drops total below current page. */
export function useOrderHubPageClamp(
  page: number,
  total: number | undefined,
  pageParamKey: string,
  setSearchParams: SetURLSearchParams,
  pageSize: number = ORDER_HUB_PAGE_SIZE,
) {
  useEffect(() => {
    const clamped = resolveClampedPage(page, total, pageSize);
    if (clamped === null) return;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (clamped <= 1) next.delete(pageParamKey);
        else next.set(pageParamKey, String(clamped));
        return next;
      },
      { replace: true },
    );
  }, [page, total, pageParamKey, setSearchParams, pageSize]);
}
