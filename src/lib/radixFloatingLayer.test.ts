import { describe, expect, it } from 'vitest';

import {
  shouldBlockDialogOutsideDismiss,
  suppressDialogOutsideDismissOnce,
} from '@/lib/radixFloatingLayer';

function fakeRoot(open: boolean): ParentNode {
  return {
    querySelector: () => (open ? { closest: () => null } : null),
  } as unknown as ParentNode;
}

function fakeTarget(kind: 'page' | 'select'): EventTarget {
  return {
    closest: (selector: string) => {
      if (kind === 'select' && selector.includes('data-radix-select-content')) return {};
      return null;
    },
  } as unknown as EventTarget;
}

describe('shouldBlockDialogOutsideDismiss', () => {
  it('allows backdrop dismiss when nothing nested is open', () => {
    expect(
      shouldBlockDialogOutsideDismiss({
        preventOutsideDismiss: false,
        target: fakeTarget('page'),
        root: fakeRoot(false),
      }),
    ).toBe(false);
  });

  it('blocks dismiss while a select portal is open (click-through to overlay)', () => {
    expect(
      shouldBlockDialogOutsideDismiss({
        preventOutsideDismiss: false,
        target: fakeTarget('page'),
        root: fakeRoot(true),
      }),
    ).toBe(true);
  });

  it('blocks one overlay dismiss right after nested layer closes', () => {
    suppressDialogOutsideDismissOnce();

    expect(
      shouldBlockDialogOutsideDismiss({
        preventOutsideDismiss: false,
        target: fakeTarget('page'),
        root: fakeRoot(false),
      }),
    ).toBe(true);

    expect(
      shouldBlockDialogOutsideDismiss({
        preventOutsideDismiss: false,
        target: fakeTarget('page'),
        root: fakeRoot(false),
      }),
    ).toBe(false);
  });
});
