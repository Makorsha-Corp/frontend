import type { AttachmentMarkupLayer } from '@/types/attachment';

export function isMineOnlyView(
  layers: AttachmentMarkupLayer[],
  visibleUsers: Record<number, boolean>,
): boolean {
  const others = layers.filter((layer) => !layer.is_mine);
  if (others.length === 0) return false;
  return others.every((layer) => !(visibleUsers[layer.user_id] ?? true));
}

export function areAllLayersVisible(
  layers: AttachmentMarkupLayer[],
  visibleUsers: Record<number, boolean>,
): boolean {
  return layers.every((layer) => visibleUsers[layer.user_id] ?? true);
}

export function buildShowAllVisibility(
  layers: AttachmentMarkupLayer[],
): Record<number, boolean> {
  return Object.fromEntries(layers.map((layer) => [layer.user_id, true]));
}

export function buildMineOnlyVisibility(
  layers: AttachmentMarkupLayer[],
): Record<number, boolean> {
  return Object.fromEntries(layers.map((layer) => [layer.user_id, layer.is_mine]));
}
