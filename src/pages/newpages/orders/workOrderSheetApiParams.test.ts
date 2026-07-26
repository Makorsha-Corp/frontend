import { describe, expect, it } from 'vitest';
import { API_LIMITS } from '@/constants/apiLimits';
import {
  buildWorkOrderSheetQueryParams,
  parseWorkOrderSheetPage,
  sheetPageCount,
} from './workOrderSheetApiParams';
import type { WorkOrderFilters } from './workOrdersOverviewData';

const baseFilters: WorkOrderFilters = {
  status: 'all',
  workType: 'all',
  priority: 'all',
  factoryId: 'all',
  machineId: 'all',
  searchQuery: '',
  showCompleteOrders: true,
};

describe('buildWorkOrderSheetQueryParams', () => {
  it('maps planned status to status_scope', () => {
    const params = buildWorkOrderSheetQueryParams(
      { ...baseFilters, status: 'planned' },
      { page: 2 },
      {},
    );
    expect(params.status_scope).toBe('planned');
    expect(params.status).toBeUndefined();
    expect(params.skip).toBe(50);
    expect(params.limit).toBe(API_LIMITS.WORK_ORDERS_SHEET_PAGE_SIZE);
  });

  it('maps hide-completed to exclude_completed', () => {
    const params = buildWorkOrderSheetQueryParams(
      { ...baseFilters, showCompleteOrders: false },
      { page: 1 },
      {},
    );
    expect(params.exclude_completed).toBe(true);
    expect(params.limit).toBe(50);
  });

  it('passes search and status filters', () => {
    const params = buildWorkOrderSheetQueryParams(
      { ...baseFilters, status: 'DRAFT', searchQuery: ' pump ' },
      { page: 1 },
      { factoryId: 3, machineId: 9 },
    );
    expect(params.status).toBe('DRAFT');
    expect(params.search).toBe('pump');
    expect(params.factory_id).toBe(3);
    expect(params.machine_id).toBe(9);
  });
});

describe('sheet pagination helpers', () => {
  it('parseWorkOrderSheetPage defaults invalid values to 1', () => {
    expect(parseWorkOrderSheetPage(null)).toBe(1);
    expect(parseWorkOrderSheetPage('0')).toBe(1);
    expect(parseWorkOrderSheetPage('3')).toBe(3);
  });

  it('sheetPageCount handles empty totals', () => {
    expect(sheetPageCount(0)).toBe(1);
    expect(sheetPageCount(51)).toBe(2);
  });
});
