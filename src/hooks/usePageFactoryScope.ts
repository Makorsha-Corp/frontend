import { useCallback, useEffect, useState } from 'react';
import { useGlobalFactory } from '@/hooks/useGlobalFactoryContext';
import { sliceToFactoryFilter } from '@/lib/machinesLocationFilterAdapters';
import type { MachinesLocationFilterSlice } from '@/lib/machinesLocationFilters';

/** `'all'` or numeric factory id as string. */
export type PageFactoryFilter = 'all' | string;

export function globalFactoryToPageFilter(
  globalFactoryId: number | null | undefined,
): PageFactoryFilter {
  if (globalFactoryId != null && Number.isFinite(globalFactoryId)) {
    return String(globalFactoryId);
  }
  return 'all';
}

export function resolveEffectivePageFactoryFilter(
  globalFactoryId: number | null | undefined,
  override: PageFactoryFilter | null,
): PageFactoryFilter {
  if (override != null) return override;
  return globalFactoryToPageFilter(globalFactoryId);
}

export function pageFactoryFilterToId(filter: PageFactoryFilter): number | null {
  if (filter === 'all') return null;
  const id = Number(filter);
  return Number.isFinite(id) ? id : null;
}

export function parsePageFactoryFilterParam(raw: string | null): PageFactoryFilter | undefined {
  if (raw === 'all') return 'all';
  if (raw == null || raw === '') return undefined;
  const id = Number(raw);
  return Number.isFinite(id) ? String(id) : undefined;
}

export interface UsePageFactoryScopeOptions {
  /** Deep-link seed for this visit only; cleared when global factory changes. */
  initialOverride?: PageFactoryFilter;
}

/**
 * Visit-local factory scope for factory-scoped pages.
 * Defaults to navbar global factory (or All); page picks do not mutate global.
 */
export function usePageFactoryScope(options?: UsePageFactoryScopeOptions) {
  const globalFactory = useGlobalFactory();
  const globalFactoryId = globalFactory?.id ?? null;

  const [override, setOverride] = useState<PageFactoryFilter | null>(() =>
    options?.initialOverride ?? null,
  );
  const [isPageOverride, setIsPageOverride] = useState(
    () => options?.initialOverride != null,
  );

  useEffect(() => {
    setOverride(null);
    setIsPageOverride(false);
  }, [globalFactoryId]);

  const factoryFilter = resolveEffectivePageFactoryFilter(globalFactoryId, override);

  const setPageFactory = useCallback((value: PageFactoryFilter) => {
    setOverride(value);
    setIsPageOverride(true);
  }, []);

  const setLocationSlice = useCallback(
    (slice: MachinesLocationFilterSlice) => {
      setPageFactory(sliceToFactoryFilter(slice));
    },
    [setPageFactory],
  );

  return {
    factoryFilter,
    isPageOverride,
    setPageFactory,
    setLocationSlice,
  };
}

/** Numeric variant for pages that store `number | null` instead of `'all' | id`. */
export function usePageFactoryScopeId(options?: UsePageFactoryScopeOptions) {
  const { factoryFilter, isPageOverride, setPageFactory, setLocationSlice } =
    usePageFactoryScope(options);

  const factoryId = pageFactoryFilterToId(factoryFilter);

  const setFactoryId = useCallback(
    (id: number | null) => {
      setPageFactory(id == null ? 'all' : String(id));
    },
    [setPageFactory],
  );

  return {
    factoryId,
    factoryFilter,
    isPageOverride,
    setFactoryId,
    setPageFactory,
    setLocationSlice,
  };
}
