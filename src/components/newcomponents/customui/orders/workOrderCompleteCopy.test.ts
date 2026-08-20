import { describe, expect, it } from 'vitest';
import { formatOtherActiveJobsWarning } from './workOrderCompleteCopy';

describe('formatOtherActiveJobsWarning', () => {
  it('formats a single sibling', () => {
    expect(formatOtherActiveJobsWarning(['WO-2026-048'])).toEqual({
      title: '1 other job still in progress on this machine',
      body: '(WO-2026-048). Your Idle/Off choice will apply to the machine now — other open jobs may still be active.',
    });
  });

  it('caps listed work order numbers at three', () => {
    expect(
      formatOtherActiveJobsWarning(['WO-1', 'WO-2', 'WO-3', 'WO-4', 'WO-5']),
    ).toEqual({
      title: '5 other jobs still in progress on this machine',
      body: '(WO-1, WO-2, WO-3, and 2 more). Your Idle/Off choice will apply to the machine now — other open jobs may still be active.',
    });
  });
});
