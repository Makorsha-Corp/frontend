/** Tight spotlight: small pad, radius copied from the highlighted element. */
export function stageRadiusForElement(el: HTMLElement): number {
  const parsed = Number.parseFloat(window.getComputedStyle(el).borderTopLeftRadius);
  const radius = Number.isFinite(parsed) ? parsed : 8;
  const rect = el.getBoundingClientRect();
  const cap = Math.min(rect.width, rect.height) / 2;
  if (!Number.isFinite(cap) || cap <= 0) return Math.max(0, radius);
  return Math.max(0, Math.min(radius, cap));
}
