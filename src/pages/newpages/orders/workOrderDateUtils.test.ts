import { startOfDay } from 'date-fns';

import { describe, expect, it } from 'vitest';



import {

  getWorkOrderSheetDateAttention,

  getWorkOrderSheetDisplayDate,

  getWorkOrderStartVarianceTone,

} from './workOrderDateUtils';



const TODAY = startOfDay(new Date('2026-07-24'));



function row(

  overrides: Partial<{

    status: string;

    plannedDate: string | null;

    calendarDate: string;

    startedAt: string | null;

    completedAt: string | null;

  }> = {},

) {

  return {

    status: 'DRAFT',

    plannedDate: '2026-07-23',

    calendarDate: '2026-07-23',

    startedAt: null,

    completedAt: null,

    ...overrides,

  };

}



describe('getWorkOrderSheetDateAttention', () => {

  it('does not flag DRAFT with past planned date as overdue', () => {

    const attention = getWorkOrderSheetDateAttention(row(), TODAY);

    expect(attention.kind).toBe('none');

    expect(attention.overdueHeadline).toBeNull();

  });



  it('flags IN_PROGRESS with started_at and past planned date as overdue in progress', () => {

    const attention = getWorkOrderSheetDateAttention(

      row({

        status: 'IN_PROGRESS',

        startedAt: '2026-07-23T09:00:00Z',

      }),

      TODAY,

    );

    expect(attention.kind).toBe('overdue_in_progress');

    expect(attention.ariaLabel).toBe('Overdue — in progress');

    expect(attention.popoverLines?.lifecycleNotes.some((n) => n.text.startsWith('Started'))).toBe(

      true,

    );

  });



  it('treats IN_PROGRESS without started_at as overdue in progress', () => {

    const attention = getWorkOrderSheetDateAttention(

      row({ status: 'IN_PROGRESS', startedAt: null }),

      TODAY,

    );

    expect(attention.kind).toBe('overdue_in_progress');

  });



  it('COMPLETED with start early gets green badge with blue underline tone', () => {

    const attention = getWorkOrderSheetDateAttention(

      row({

        status: 'COMPLETED',

        plannedDate: '2026-07-26',

        calendarDate: '2026-07-26',

        startedAt: '2026-07-23T09:00:00Z',

        completedAt: '2026-07-25T17:00:00Z',

      }),

      TODAY,

    );

    expect(attention.kind).toBe('completed');

    expect(attention.startVarianceTone).toBe('early');

    expect(attention.varianceHeadline).toBe('Started early');

    expect(attention.popoverLines?.lifecycleNotes.some((n) => n.text.includes(' early'))).toBe(

      true,

    );

  });



  it('COMPLETED on-plan start stays green badge without start underline tone', () => {

    const attention = getWorkOrderSheetDateAttention(

      row({

        status: 'COMPLETED',

        plannedDate: '2026-07-24',

        calendarDate: '2026-07-24',

        startedAt: '2026-07-24T09:00:00Z',

        completedAt: '2026-07-26T17:00:00Z',

      }),

      TODAY,

    );

    expect(attention.kind).toBe('completed');

    expect(attention.startVarianceTone).toBeNull();

    expect(attention.popoverLines?.lifecycleNotes.some((n) => n.text.includes(' late'))).toBe(

      true,

    );

  });



  it('COMPLETED with start late gets green badge with late underline tone', () => {

    const attention = getWorkOrderSheetDateAttention(

      row({

        status: 'COMPLETED',

        plannedDate: '2026-07-22',

        calendarDate: '2026-07-22',

        startedAt: '2026-07-23T09:00:00Z',

        completedAt: '2026-07-24T17:00:00Z',

      }),

      TODAY,

    );

    expect(attention.kind).toBe('completed');

    expect(attention.startVarianceTone).toBe('late');

    expect(attention.varianceHeadline).toBe('Started late');

  });



  it('IN_PROGRESS started early gets lifecycle_variance with blue tone', () => {

    const attention = getWorkOrderSheetDateAttention(

      row({

        status: 'IN_PROGRESS',

        plannedDate: '2026-07-26',

        calendarDate: '2026-07-26',

        startedAt: '2026-07-23T09:00:00Z',

      }),

      TODAY,

    );

    expect(attention.kind).toBe('lifecycle_variance');

    expect(attention.startVarianceTone).toBe('early');

    expect(attention.varianceHeadline).toBe('Started early');

  });



  it('IN_PROGRESS started late gets lifecycle_variance with amber tone', () => {

    const attention = getWorkOrderSheetDateAttention(

      row({

        status: 'IN_PROGRESS',

        plannedDate: '2026-07-24',

        calendarDate: '2026-07-24',

        startedAt: '2026-07-26T09:00:00Z',

      }),

      TODAY,

    );

    expect(attention.kind).toBe('lifecycle_variance');

    expect(attention.startVarianceTone).toBe('late');

    expect(attention.varianceHeadline).toBe('Started late');

  });



  it('IN_PROGRESS started on plan but completed late has no start badge', () => {

    const attention = getWorkOrderSheetDateAttention(

      row({

        status: 'IN_PROGRESS',

        plannedDate: '2026-07-24',

        calendarDate: '2026-07-24',

        startedAt: '2026-07-24T09:00:00Z',

        completedAt: '2026-07-26T17:00:00Z',

      }),

      TODAY,

    );

    expect(attention.kind).toBe('none');

    expect(attention.startVarianceTone).toBeNull();

    expect(attention.popoverLines?.lifecycleNotes.some((n) => n.text.includes(' late'))).toBe(

      true,

    );

  });



  it('shows on-plan started note in popover when start matches plan', () => {

    const attention = getWorkOrderSheetDateAttention(

      row({

        status: 'IN_PROGRESS',

        plannedDate: '2026-07-24',

        calendarDate: '2026-07-24',

        startedAt: '2026-07-24T09:00:00Z',

      }),

      TODAY,

    );

    expect(attention.kind).toBe('none');

    expect(attention.varianceHeadline).toBeNull();

    expect(attention.popoverLines?.lifecycleNotes).toEqual([

      { tone: 'started', text: 'Started Jul 24 · On plan' },

    ]);

  });



  it('includes popover lines for on-plan DRAFT with future planned date', () => {

    const attention = getWorkOrderSheetDateAttention(

      row({ plannedDate: '2026-07-25', calendarDate: '2026-07-25' }),

      TODAY,

    );

    expect(attention.kind).toBe('none');

    expect(attention.ariaLabel).toBe('View planned and start dates');

    expect(attention.popoverLines?.plannedLabel).toBe('Jul 25, 2026');

    expect(attention.popoverLines?.lifecycleNotes).toEqual([]);

  });

});



describe('getWorkOrderStartVarianceTone', () => {

  it('returns not_started when started_at is null', () => {

    expect(getWorkOrderStartVarianceTone(row())).toBe('not_started');

  });



  it('returns early when started before planned day', () => {

    expect(

      getWorkOrderStartVarianceTone(

        row({

          plannedDate: '2026-07-26',

          calendarDate: '2026-07-26',

          startedAt: '2026-07-23T09:00:00Z',

        }),

      ),

    ).toBe('early');

  });

});



describe('getWorkOrderSheetDisplayDate', () => {

  it('shows planned date when work has not started', () => {

    expect(

      getWorkOrderSheetDisplayDate({

        plannedDate: '2026-07-23',

        calendarDate: '2026-07-23',

      }),

    ).toBe('Jul 23');

  });



  it('shows planned date when started, even if actual start differs', () => {

    expect(

      getWorkOrderSheetDisplayDate({

        plannedDate: '2026-07-26',

        calendarDate: '2026-07-26',

      }),

    ).toBe('Jul 26');

  });



  it('falls back to calendar date when planned date is unset', () => {

    expect(

      getWorkOrderSheetDisplayDate({

        plannedDate: null,

        calendarDate: '2026-07-25',

      }),

    ).toBe('Jul 25');

  });

});


