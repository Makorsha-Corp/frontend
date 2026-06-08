export function waitForScrollEnd(container: HTMLElement, timeoutMs = 2500): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;
    let sawScroll = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve();
    };

    const timeoutId = window.setTimeout(finish, timeoutMs);
    let debounceId: number | undefined;

    const onScrollEnd = () => finish();
    const onScroll = () => {
      sawScroll = true;
      if (debounceId != null) window.clearTimeout(debounceId);
      debounceId = window.setTimeout(finish, 150);
    };

    const cleanup = () => {
      window.clearTimeout(timeoutId);
      if (debounceId != null) window.clearTimeout(debounceId);
      container.removeEventListener('scrollend', onScrollEnd);
      container.removeEventListener('scroll', onScroll);
    };

    container.addEventListener('scrollend', onScrollEnd, { once: true });
    container.addEventListener('scroll', onScroll, { passive: true });

    window.setTimeout(() => {
      if (!sawScroll) finish();
    }, 200);
  });
}

export interface ScrollToHighlightTargetOptions {
  container: HTMLElement | null;
  element: HTMLElement | null;
  onScrollStart: () => void;
  onScrollEnd: () => void;
}

export async function scrollToHighlightTarget({
  container,
  element,
  onScrollStart,
  onScrollEnd,
}: ScrollToHighlightTargetOptions): Promise<void> {
  if (!element) return;

  onScrollStart();
  element.scrollIntoView({ behavior: 'smooth', block: 'center' });

  if (container) {
    await waitForScrollEnd(container);
  } else {
    await new Promise((resolve) => window.setTimeout(resolve, 400));
  }

  onScrollEnd();
}
