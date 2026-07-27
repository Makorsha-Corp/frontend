export interface OrderHubSelectionState {
  selectedOrderId: number | null;
  selectedFromList: unknown | null;
  selectedById: unknown | null | undefined;
  selectedByIdError?: boolean;
}

/** Detail opened via getById because the order is not on the current filtered hub page. */
export function isOrderSelectedOffFilteredPage(state: OrderHubSelectionState): boolean {
  return (
    state.selectedOrderId != null &&
    state.selectedFromList == null &&
    state.selectedById != null &&
    state.selectedByIdError !== true
  );
}
