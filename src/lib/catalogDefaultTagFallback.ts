export function shouldDropDefaultCatalogTags(input: {
  loading: boolean;
  itemCount: number;
  search: string;
  userTouchedTags: boolean;
  defaultTagIds: number[];
  activeTagIds: number[];
  alreadyDropped: boolean;
}): boolean {
  if (input.loading || input.alreadyDropped || input.userTouchedTags) return false;
  if (input.search.trim()) return false;
  if (input.defaultTagIds.length === 0) return false;
  if (input.itemCount !== 0) return false;
  if (input.activeTagIds.length !== input.defaultTagIds.length) return false;
  const active = new Set(input.activeTagIds);
  return input.defaultTagIds.every((id) => active.has(id));
}
