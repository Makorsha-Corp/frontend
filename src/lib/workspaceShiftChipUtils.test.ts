import { describe, expect, it } from 'vitest';

import type { WorkspaceShift } from '@/types/workspaceShift';
import { findShiftForDate, minutesInShiftWindow } from '@/lib/workspaceShiftChipUtils';

const night: WorkspaceShift = {
  id: 2,
  workspace_id: 1,
  name: 'Night',
  start_time: '22:00:00',
  end_time: '06:00:00',
  sort_order: 1,
  is_active: true,
  created_at: '',
  updated_at: '',
};

describe('workspaceShiftChipUtils', () => {
  it('matches overnight window', () => {
    expect(minutesInShiftWindow(23 * 60, 22 * 60, 6 * 60)).toBe(true);
    expect(findShiftForDate([night], new Date(2026, 2, 1, 23, 30))?.name).toBe('Night');
  });
});
