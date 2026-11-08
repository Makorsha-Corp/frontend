/** Pick the help-tour anchor that is actually visible (responsive duplicate headers). */
export function findVisibleHelpTourElement(selector: string): Element | null {
  const nodes = document.querySelectorAll(selector);
  for (const node of nodes) {
    if (node instanceof HTMLElement && isHelpTourElementVisible(node)) {
      return node;
    }
  }
  return nodes.length > 0 ? nodes[0]! : null;
}

export function helpTourVisibleElement(selector: string): () => Element {
  return () => {
    const el = findVisibleHelpTourElement(selector);
    if (!el) {
      throw new Error(`Help tour: no element for ${selector}`);
    }
    return el;
  };
}

function isHelpTourElementVisible(el: HTMLElement): boolean {
  let current: HTMLElement | null = el;
  while (current) {
    const style = window.getComputedStyle(current);
    if (style.display === 'none' || style.visibility === 'hidden') {
      return false;
    }
    current = current.parentElement;
  }
  const rect = el.getBoundingClientRect();
  return rect.width > 0 || rect.height > 0;
}
