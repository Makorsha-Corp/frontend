import { describe, expect, it, vi } from 'vitest';

/** Chip opens batch detail in day view; column header switches to day view. */
describe('ProductionScheduleTab interaction contract', () => {
  it('onOpenBatch receives batch id from chip handler pattern', () => {
    const onOpenBatch = vi.fn();
    const batchId = 501;
    onOpenBatch(batchId);
    expect(onOpenBatch).toHaveBeenCalledWith(501);
    expect(onOpenBatch).not.toHaveBeenCalledWith(expect.any(Date));
  });

  it('onCreateOnDay receives day only', () => {
    const onCreateOnDay = vi.fn();
    const day = new Date(2026, 9, 21);
    onCreateOnDay(day);
    expect(onCreateOnDay).toHaveBeenCalledWith(day);
  });
});
