import { describe, expect, it } from 'vitest';
import { isOrderSelectedOffFilteredPage } from './orderHubSelection';

describe('isOrderSelectedOffFilteredPage', () => {
  it('is true when detail comes from getById only', () => {
    expect(
      isOrderSelectedOffFilteredPage({
        selectedOrderId: 1,
        selectedFromList: null,
        selectedById: { id: 1 },
        selectedByIdError: false,
      }),
    ).toBe(true);
  });

  it('is false when order is on the current page', () => {
    expect(
      isOrderSelectedOffFilteredPage({
        selectedOrderId: 1,
        selectedFromList: { id: 1 },
        selectedById: undefined,
      }),
    ).toBe(false);
  });
});
