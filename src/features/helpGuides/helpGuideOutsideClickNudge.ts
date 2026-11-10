import { pulseCoachDot } from '@/features/helpGuides/helpGuideCoachDot';

const NUDGE_TEXT = 'Click the highlighted button';
const NUDGE_THROTTLE_MS = 600;
const NUDGE_TEXT_RESTORE_MS = 1_500;

let cleanup: (() => void) | null = null;
let lastNudgeAt = 0;
let restoreTimer: number | null = null;

function isInsideOpenDialog(el: Element): boolean {
  return Boolean(el.closest('[role="dialog"]'));
}

function pointerHitAllowed(target: EventTarget | null, highlightTarget: HTMLElement): boolean {
  if (!(target instanceof Element)) return false;
  if (highlightTarget.contains(target)) return true;
  if (target.closest('.driver-popover')) return true;
  if (target.closest('#help-guide-tour-bar-host')) return true;
  if (isInsideOpenDialog(target) && isInsideOpenDialog(highlightTarget)) return true;
  return false;
}

function nudgePopover(originalHint: string): void {
  const pop = document.querySelector('.driver-popover.help-guide-click-hint');
  if (!(pop instanceof HTMLElement)) return;

  const now = Date.now();
  if (now - lastNudgeAt < NUDGE_THROTTLE_MS) return;
  lastNudgeAt = now;

  pop.classList.remove('help-guide-nudge');
  void pop.offsetWidth;
  pop.classList.add('help-guide-nudge');
  pulseCoachDot();

  const desc = pop.querySelector('.driver-popover-description');
  if (desc instanceof HTMLElement) {
    desc.textContent = NUDGE_TEXT;
    if (restoreTimer != null) window.clearTimeout(restoreTimer);
    restoreTimer = window.setTimeout(() => {
      desc.textContent = originalHint;
      restoreTimer = null;
    }, NUDGE_TEXT_RESTORE_MS);
  }
}

/** Shake the hint when the user clicks elsewhere (does not advance the tour). */
export function attachOutsideClickNudge(
  highlightTarget: HTMLElement,
  originalHint: string,
): () => void {
  detachOutsideClickNudge();

  const onPointerDown = (event: PointerEvent) => {
    if (pointerHitAllowed(event.target, highlightTarget)) return;
    nudgePopover(originalHint);
  };

  document.addEventListener('pointerdown', onPointerDown, { capture: true });

  cleanup = () => {
    document.removeEventListener('pointerdown', onPointerDown, { capture: true });
    if (restoreTimer != null) {
      window.clearTimeout(restoreTimer);
      restoreTimer = null;
    }
    cleanup = null;
  };

  return cleanup;
}

export function detachOutsideClickNudge(): void {
  cleanup?.();
}
