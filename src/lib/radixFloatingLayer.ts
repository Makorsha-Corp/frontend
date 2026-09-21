export const NESTED_RADIX_FLOATING_LAYER_SELECTOR = [
  '[data-radix-select-content]',
  '[data-radix-popper-content-wrapper]',
  '[data-radix-menu-content]',
  '[data-radix-dropdown-menu-content]',
  '[data-radix-popover-content]',
].join(',');

let suppressNextDialogOutsideDismiss = false;

/** Select/Popover closed on same pointer event that hit dialog overlay — skip one dismiss. */
export function suppressDialogOutsideDismissOnce(): void {
  suppressNextDialogOutsideDismiss = true;
  const clear = () => {
    suppressNextDialogOutsideDismiss = false;
  };
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(clear);
  } else {
    setTimeout(clear, 0);
  }
}

function consumeDialogOutsideDismissSuppression(): boolean {
  if (!suppressNextDialogOutsideDismiss) return false;
  suppressNextDialogOutsideDismiss = false;
  return true;
}

export function isNestedRadixFloatingLayerOpen(root: ParentNode = document): boolean {
  return Boolean(root.querySelector(NESTED_RADIX_FLOATING_LAYER_SELECTOR));
}

export function isNestedRadixFloatingLayerTarget(target: EventTarget | null): boolean {
  if (!target || typeof (target as Element).closest !== 'function') return false;
  const el = target as Element;
  return Boolean(
    el.closest(NESTED_RADIX_FLOATING_LAYER_SELECTOR) || el.closest('[role="listbox"]'),
  );
}

export function shouldBlockDialogOutsideDismiss(options: {
  preventOutsideDismiss: boolean;
  target: EventTarget | null;
  root?: ParentNode;
}): boolean {
  if (options.preventOutsideDismiss) return true;
  if (consumeDialogOutsideDismissSuppression()) return true;
  if (isNestedRadixFloatingLayerTarget(options.target)) return true;
  return isNestedRadixFloatingLayerOpen(options.root ?? document);
}
