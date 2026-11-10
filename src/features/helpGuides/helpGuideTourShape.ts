export const HELP_GUIDE_PO_TOUR_SHAPE_STORAGE_KEY = 'makorsha:po-tour-shape';

export const HELP_GUIDE_PO_TOUR_SHAPE_CHANGE_EVENT = 'makorsha:po-tour-shape-change';

export type PoTourShape = 'docked' | 'tooltip' | 'card';

const SHAPE_BODY_PREFIX = 'help-guide-shape-';

const listeners = new Set<() => void>();

function readShapeFromStorage(): PoTourShape {
  try {
    const raw = localStorage.getItem(HELP_GUIDE_PO_TOUR_SHAPE_STORAGE_KEY);
    if (raw === 'tooltip' || raw === 'card' || raw === 'docked') return raw;
  } catch {
    /* private mode */
  }
  return 'docked';
}

function applyShapeBodyClass(shape: PoTourShape): void {
  document.body.classList.remove(
    `${SHAPE_BODY_PREFIX}docked`,
    `${SHAPE_BODY_PREFIX}tooltip`,
    `${SHAPE_BODY_PREFIX}card`,
  );
  document.body.classList.add(`${SHAPE_BODY_PREFIX}${shape}`);
}

export function getPoTourShape(): PoTourShape {
  return readShapeFromStorage();
}

export function setPoTourShape(shape: PoTourShape): void {
  try {
    localStorage.setItem(HELP_GUIDE_PO_TOUR_SHAPE_STORAGE_KEY, shape);
  } catch {
    /* private mode */
  }
  applyShapeBodyClass(shape);
  window.dispatchEvent(new CustomEvent(HELP_GUIDE_PO_TOUR_SHAPE_CHANGE_EVENT, { detail: shape }));
  listeners.forEach((l) => l());
}

export function subscribePoTourShape(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function ensurePoTourShapeOnBody(): void {
  applyShapeBodyClass(getPoTourShape());
}

export function clearPoTourShapeFromBody(): void {
  document.body.classList.remove(
    `${SHAPE_BODY_PREFIX}docked`,
    `${SHAPE_BODY_PREFIX}tooltip`,
    `${SHAPE_BODY_PREFIX}card`,
  );
}
