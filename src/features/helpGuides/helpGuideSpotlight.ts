const DIM_CLASS = 'help-guide-dim';
const LIT_CLASS = 'help-guide-lit';

function isTourChrome(el: Element): boolean {
  return (
    el.classList.contains('driver-popover') ||
    el.classList.contains('driver-overlay') ||
    el.classList.contains('driver-active-element') ||
    el.tagName === 'svg' ||
    el.tagName === 'SVG'
  );
}

export function clearHelpGuideSpotlight(): void {
  document.querySelectorAll(`.${DIM_CLASS}`).forEach((el) => el.classList.remove(DIM_CLASS));
  document.querySelectorAll(`.${LIT_CLASS}`).forEach((el) => el.classList.remove(LIT_CLASS));
}

/** Dim sibling branches. Light the target. No backdrop sheet. */
export function applyHelpGuideSpotlight(target: Element | undefined): void {
  clearHelpGuideSpotlight();
  if (!(target instanceof HTMLElement)) return;

  const skipLitOnTarget =
    target.id === 'po-confirm-items' ||
    target.id === 'po-approve-order-btn' ||
    target.id === 'po-finalize-invoice-btn' ||
    target.id === 'po-manage-receiving-btn' ||
    target.id === 'po-mark-order-complete-btn';
  if (!skipLitOnTarget) {
    target.classList.add(LIT_CLASS);
  }
  let node: HTMLElement | null = target;
  while (node && node !== document.body) {
    const parent: HTMLElement | null = node.parentElement;
    if (!parent) break;
    for (const sibling of parent.children) {
      if (sibling !== node && !isTourChrome(sibling)) {
        sibling.classList.add(DIM_CLASS);
      }
    }
    node = parent;
  }
}
