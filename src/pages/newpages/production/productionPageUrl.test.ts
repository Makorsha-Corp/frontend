import { describe, expect, it } from 'vitest';

import {
  DEFAULT_BATCH_STATUS_FILTER,
} from '@/components/newcomponents/customui/production/ProductionContextFilters';

import {
  deriveProductionBatchDateViewMode,
  isDefaultBatchStatuses,
  parseProductionPageParams,
  parseProductionPageTab,
  pruneProductionCatalogParams,
  resolveBatchStatusFilterFromSearchParams,
  stripInvalidProductionUrlParams,
  writeProductionPageParams,
} from './productionPageUrl';

describe('parseProductionPageTab', () => {
  it('accepts valid tabs', () => {
    expect(parseProductionPageTab('batches')).toBe('batches');
    expect(parseProductionPageTab('overview')).toBe('overview');
    expect(parseProductionPageTab('schedule')).toBe('batches');
    expect(parseProductionPageTab('runs')).toBe('batches');
  });

  it('rejects invalid tabs', () => {
    expect(parseProductionPageTab('foo')).toBeNull();
  });
});

describe('parseProductionPageParams', () => {
  it('defaults to overview', () => {
    const p = parseProductionPageParams(new URLSearchParams());
    expect(p.tab).toBe('overview');
    expect(p.batchId).toBeNull();
    expect(p.statuses).toBeNull();
  });

  it('coerces batchId to batches tab', () => {
    const p = parseProductionPageParams(new URLSearchParams('batchId=12'));
    expect(p.tab).toBe('batches');
    expect(p.batchId).toBe(12);
  });

  it('parses statuses comma list', () => {
    const p = parseProductionPageParams(new URLSearchParams('statuses=draft,in_progress'));
    expect(p.statuses).toEqual(['draft', 'in_progress']);
  });

  it('parses empty statuses as absent (default all)', () => {
    const p = parseProductionPageParams(new URLSearchParams('statuses='));
    expect(p.statuses).toBeNull();
  });

  it('parses batches toolbar params in toolbar order', () => {
    const p = parseProductionPageParams(
      new URLSearchParams('batchDate=2026-10-25&batchDateScope=day&batchLines=2,1&batchMachine=9'),
    );
    expect(p.batchDate).toBe('2026-10-25');
    expect(p.batchDateScope).toBe('day');
    expect(p.batchLineIds).toEqual([2, 1]);
    expect(p.batchMachine).toBe('9');
  });

  it('does not keep unshipped runs* params', () => {
    const next = stripInvalidProductionUrlParams(
      new URLSearchParams('tab=batches&runsDate=2026-10-25&runsLines=1'),
    );
    expect(next?.get('runsDate')).toBeNull();
    expect(next?.get('runsLines')).toBeNull();
    expect(next?.get('tab')).toBe('batches');
  });

  it('treats batchDateScope=all as all dates', () => {
    const p = parseProductionPageParams(new URLSearchParams('batchDateScope=all&batchDate=2026-10-25'));
    expect(p.batchDate).toBeNull();
    expect(p.batchDateScope).toBe('all');
  });

  it('parses batchGrid hours and defaults to lines', () => {
    expect(parseProductionPageParams(new URLSearchParams('batchGrid=hours')).batchGrid).toBe('hours');
    expect(parseProductionPageParams(new URLSearchParams()).batchGrid).toBe('lines');
  });
});

describe('deriveProductionBatchDateViewMode', () => {
  it('maps date + scope to view mode', () => {
    expect(deriveProductionBatchDateViewMode(null, 'all')).toBe('all');
    expect(deriveProductionBatchDateViewMode(null, null)).toBe('all');
    expect(deriveProductionBatchDateViewMode('2026-10-25', null)).toBe('week');
    expect(deriveProductionBatchDateViewMode('2026-10-25', 'day')).toBe('day');
  });
});

describe('writeProductionPageParams', () => {
  it('omits default tab and statuses', () => {
    const next = writeProductionPageParams(new URLSearchParams('tab=batches'), {
      tab: 'overview',
      statuses: [],
    });
    expect(next.get('tab')).toBeNull();
    expect(next.get('statuses')).toBeNull();
  });

  it('round-trips overview filters and drops batches keys', () => {
    const next = writeProductionPageParams(
      new URLSearchParams('tab=batches&batchId=5&batchDate=2026-10-25'),
      {
        tab: 'overview',
        factoryId: 4,
        lineId: 2,
        q: 'yarn',
        statuses: ['draft'],
        batchDateFrom: '2026-01-01',
        batchDateTo: '2026-01-31',
      },
    );
    expect([...next.keys()]).toEqual([
      'factoryId',
      'lineId',
      'q',
      'statuses',
      'batchFrom',
      'batchTo',
    ]);
    expect(next.get('tab')).toBeNull();
    expect(next.get('batchId')).toBeNull();
    expect(next.get('batchDate')).toBeNull();
  });

  it('setup write keeps only setup keys and factoryId', () => {
    const next = writeProductionPageParams(new URLSearchParams('q=yarn&batchLines=1'), {
      tab: 'setup',
      factoryId: 4,
      formulaId: 8,
      setupQ: 'cotton',
    });
    expect([...next.keys()]).toEqual(['tab', 'factoryId', 'formulaId', 'setupQ']);
  });

  it('writes batches toolbar params in left-to-right order', () => {
    const next = writeProductionPageParams(new URLSearchParams('q=yarn&statuses=draft&formulaId=3'), {
      tab: 'batches',
      factoryId: 4,
      batchId: 5,
      batchDate: '2026-10-25',
      batchDateScope: 'day',
      batchLineIds: [2, 1],
      batchMachine: '5',
      showCompletedBatches: true,
    });
    expect([...next.keys()]).toEqual([
      'tab',
      'factoryId',
      'batchId',
      'batchDate',
      'batchDateScope',
      'batchLines',
      'q',
      'showCompleted',
      'batchMachine',
      'statuses',
    ]);
    expect(next.get('formulaId')).toBeNull();
    expect(next.get('batchDate')).toBe('2026-10-25');
    expect(next.get('batchDateScope')).toBe('day');
    expect(next.get('batchLines')).toBe('1,2');
    expect(next.get('batchMachine')).toBe('5');

    const weekOnly = writeProductionPageParams(new URLSearchParams('tab=batches'), {
      batchDate: '2026-10-25',
      batchDateScope: null,
    });
    expect(weekOnly.get('batchDate')).toBe('2026-10-25');
    expect(weekOnly.get('batchDateScope')).toBeNull();

    const allDates = writeProductionPageParams(new URLSearchParams('tab=batches&batchDate=2026-10-25'), {
      batchDateScope: 'all',
    });
    expect(allDates.get('batchDate')).toBeNull();
    expect(allDates.get('batchDateScope')).toBe('all');

    const allLines = writeProductionPageParams(new URLSearchParams('tab=batches'), {
      batchLineIds: [1, 2, 3],
      batchLinesAllLineIds: [1, 2, 3],
    });
    expect(allLines.get('batchLines')).toBeNull();

    const noneLines = writeProductionPageParams(new URLSearchParams('tab=batches'), {
      batchLineIds: [],
    });
    expect(noneLines.get('batchLines')).toBe('none');
  });

  it('seeds the week anchor in the same batches write when no date is set', () => {
    const next = writeProductionPageParams(new URLSearchParams('tab=overview&lineId=2'), {
      tab: 'batches',
      factoryId: 4,
      batchWeekAnchor: '2026-10-25',
    });
    expect([...next.keys()]).toEqual(['tab', 'factoryId', 'batchDate']);
    expect(next.get('batchDate')).toBe('2026-10-25');
    expect(next.get('lineId')).toBeNull();
  });

  it('does not seed over all dates', () => {
    const next = writeProductionPageParams(new URLSearchParams('tab=batches&batchDateScope=all'), {
      tab: 'batches',
      batchWeekAnchor: '2026-10-25',
    });
    expect(next.get('batchDate')).toBeNull();
    expect(next.get('batchDateScope')).toBe('all');
  });
});

describe('stripInvalidProductionUrlParams', () => {
  it('drops a bad scope, day without a date, and unknown status tokens', () => {
    const next = stripInvalidProductionUrlParams(
      new URLSearchParams('tab=batches&batchDateScope=month&statuses=draft,nope&batchId=0'),
    );
    expect(next?.get('batchDateScope')).toBeNull();
    expect(next?.get('statuses')).toBe('draft');
    expect(next?.get('batchId')).toBeNull();
  });

  it('drops a foreign setup key from a batches link', () => {
    const next = stripInvalidProductionUrlParams(
      new URLSearchParams('tab=batches&batchDate=2026-10-25&formulaId=3'),
    );
    expect(next?.get('formulaId')).toBeNull();
    expect(next?.get('batchDate')).toBe('2026-10-25');
  });

  it('drops invalid batchGrid values', () => {
    const next = stripInvalidProductionUrlParams(
      new URLSearchParams('tab=batches&batchDate=2026-10-25&batchGrid=lanes'),
    );
    expect(next?.get('batchGrid')).toBeNull();
  });
});

describe('writeProductionPageParams batchGrid', () => {
  it('writes hours and omits lines default', () => {
    const hours = writeProductionPageParams(new URLSearchParams('tab=batches'), {
      batchGrid: 'hours',
    });
    expect(hours.get('batchGrid')).toBe('hours');

    const lines = writeProductionPageParams(hours, { batchGrid: 'lines' });
    expect(lines.get('batchGrid')).toBeNull();
  });
});

describe('legacy batchHourRows URL param', () => {
  it('stripInvalidProductionUrlParams removes batchHourRows', () => {
    const next = stripInvalidProductionUrlParams(
      new URLSearchParams('tab=batches&batchHourRows=expanded'),
    );
    expect(next?.get('batchHourRows')).toBeNull();
  });
});

describe('pruneProductionCatalogParams', () => {
  it('removes unknown line and machine ids after catalogs load', () => {
    const next = pruneProductionCatalogParams(
      new URLSearchParams('tab=batches&batchDate=2026-10-25&batchLines=1,9&batchMachine=4'),
      { lineIds: [1, 2], machineIds: [8] },
    );
    expect(next?.get('batchLines')).toBe('1');
    expect(next?.get('batchMachine')).toBeNull();
  });

  it('does not prune before catalogs load', () => {
    const next = pruneProductionCatalogParams(
      new URLSearchParams('tab=batches&batchLines=9'),
      { lineIds: null, machineIds: null },
    );
    expect(next).toBeNull();
  });
});

describe('resolveBatchStatusFilterFromSearchParams', () => {
  it('uses URL when statuses param is set', () => {
    const params = new URLSearchParams('statuses=draft');
    const resolved = resolveBatchStatusFilterFromSearchParams(params, () => ['in_progress']);
    expect(resolved).toEqual(['draft']);
  });

  it('falls back to storage when statuses param is absent', () => {
    const resolved = resolveBatchStatusFilterFromSearchParams(
      new URLSearchParams(),
      () => ['in_progress', 'cancelled'],
    );
    expect(resolved).toEqual(['in_progress', 'cancelled']);
  });

  it('maps legacy planned status token to recurring', () => {
    const params = new URLSearchParams('statuses=planned');
    const resolved = resolveBatchStatusFilterFromSearchParams(params, () => []);
    expect(resolved).toEqual(['recurring']);
  });
});

describe('production factory scope URL', () => {
  it('strips factoryId=all from the URL (all factories scope)', () => {
    const next = stripInvalidProductionUrlParams(new URLSearchParams('factoryId=all&tab=batches'));
    expect(next?.get('factoryId')).toBeNull();
    expect(next?.get('tab')).toBe('batches');
  });

  it('omits factoryId when writing all-factories scope', () => {
    const ordered = writeProductionPageParams(new URLSearchParams('tab=overview'), {
      tab: 'overview',
      factoryId: null,
    });
    expect(ordered.get('factoryId')).toBeNull();
  });
});

describe('isDefaultBatchStatuses', () => {
  it('true for empty (default) and default three', () => {
    expect(isDefaultBatchStatuses([])).toBe(true);
    expect(isDefaultBatchStatuses([...DEFAULT_BATCH_STATUS_FILTER])).toBe(true);
  });

  it('false when cancelled included or subset', () => {
    expect(isDefaultBatchStatuses(['draft', 'in_progress', 'cancelled'])).toBe(false);
    expect(isDefaultBatchStatuses(['draft'])).toBe(false);
  });

  it('treats recurring-inclusive default as the week and day default, not all dates', () => {
    const weekDefault = ['draft', 'recurring', 'in_progress'] as const;
    expect(isDefaultBatchStatuses([...weekDefault], 'week')).toBe(true);
    expect(isDefaultBatchStatuses([...weekDefault], 'day')).toBe(true);
    expect(isDefaultBatchStatuses([...weekDefault], 'all')).toBe(false);
  });
});
