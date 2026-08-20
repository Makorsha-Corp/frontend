/**
 * Order date field lock policy (frontend).
 *
 * - Structural: lock on section confirm (PO/SO) — destination, order date, contact, etc.
 * - Planning: lock on invoice finalize or void (PO/SO) — expected delivery, etc.
 * - EO/WO: dates lock on order complete (invoice finalizes at complete for EO).
 */

/** PO destination, order date, description — lock when details section is confirmed. */
export function isPoStructuralDetailsLocked(
  invoiceLocked: boolean,
  detailsConfirmed: boolean,
  voided: boolean,
): boolean {
  return invoiceLocked || detailsConfirmed || voided;
}

/** PO expected delivery — editable after details confirm until invoice finalize or void. */
export function isPoPlanningDateLocked(invoiceLocked: boolean, voided: boolean): boolean {
  return invoiceLocked || voided;
}

/** SO contact, phone, description — lock when order info section is confirmed. */
export function isSoStructuralOrderInfoLocked(
  invoiceLocked: boolean,
  orderInfoConfirmed: boolean,
): boolean {
  return invoiceLocked || orderInfoConfirmed;
}

/** SO expected delivery — editable after order info confirm until invoice finalize. */
export function isSoPlanningDateLocked(invoiceLocked: boolean): boolean {
  return invoiceLocked;
}

/** EO expense / due dates — lock when order is marked complete. */
export function isEoDateLocked(orderComplete: boolean): boolean {
  return orderComplete;
}
