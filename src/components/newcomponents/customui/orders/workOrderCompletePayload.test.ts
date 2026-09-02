import { describe, expect, it } from 'vitest';

import { buildWorkOrderCompletePayload } from './workOrderCompletePayload';

describe('buildWorkOrderCompletePayload', () => {
  it('includes completed_by names and user ids in submit payload', () => {
    expect(
      buildWorkOrderCompletePayload({
        notes: 'Done',
        machineStatus: 'IDLE',
        hasMachineTarget: true,
        completedByNames: 'Jane Worker, Bob',
        completedByUserIds: [42],
      }),
    ).toEqual({
      completion_notes: 'Done',
      machine_status: 'IDLE',
      completed_by_names: 'Jane Worker, Bob',
      completed_by_user_ids: [42],
    });
  });

  it('omits machine_status when order has no machine target', () => {
    expect(
      buildWorkOrderCompletePayload({
        notes: '',
        machineStatus: '',
        hasMachineTarget: false,
        completedByNames: 'Jane Worker',
        completedByUserIds: [7],
      }),
    ).toEqual({
      completed_by_names: 'Jane Worker',
      completed_by_user_ids: [7],
    });
  });
});
