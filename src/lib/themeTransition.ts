export interface ThemeTransitionOrigin {
  x: number;
  y: number;
}

export interface ThemeTransitionResult {
  animateIcon: boolean;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function setTransitionOrigin(origin?: ThemeTransitionOrigin): void {
  const root = document.documentElement;
  const x = origin?.x ?? window.innerWidth / 2;
  const y = origin?.y ?? window.innerHeight / 2;
  root.style.setProperty('--theme-x', `${x}px`);
  root.style.setProperty('--theme-y', `${y}px`);
}

function runInstantWithIcon(applyTheme: () => void): ThemeTransitionResult {
  applyTheme();
  return { animateIcon: true };
}

function runWipe(
  applyTheme: () => void,
  origin?: ThemeTransitionOrigin
): ThemeTransitionResult {
  setTransitionOrigin(origin);

  const startViewTransition = document.startViewTransition?.bind(document);
  if (!startViewTransition) {
    return runInstantWithIcon(applyTheme);
  }

  startViewTransition(() => {
    applyTheme();
  });

  return { animateIcon: true };
}

export function runThemeTransition(
  applyTheme: () => void,
  options?: { origin?: ThemeTransitionOrigin }
): ThemeTransitionResult {
  if (prefersReducedMotion()) {
    return runInstantWithIcon(applyTheme);
  }

  return runWipe(applyTheme, options?.origin);
}

export function originFromMouseEvent(
  event?: { clientX: number; clientY: number }
): ThemeTransitionOrigin | undefined {
  if (!event) return undefined;
  return { x: event.clientX, y: event.clientY };
}
