import { useEffect } from 'react';
import type { SetURLSearchParams } from 'react-router-dom';
import { orderHubPageCount } from './orderHubApiParams';

/** Clamp hub page URL when filter shrink drops total below current page. */
export function useOrderHubPageClamp(
  page: number,
  total: number,
  pageParamKey: string,
  setSearchParams: SetURLSearchParams,
) {
  useEffect(() => {
    const maxPage = orderHubPageCount(total);
    if (page <= maxPage) return;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (maxPage <= 1) next.delete(pageParamKey);
        else next.set(pageParamKey, String(maxPage));
        return next;
      },
      { replace: true },
    );
  }, [page, total, pageParamKey, setSearchParams]);
}
