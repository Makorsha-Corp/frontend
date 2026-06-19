/** True when source and destination refer to the same location bucket. */
export function isSameTransferLocation(
  sourceType: string,
  sourceId: string | number,
  destType: string,
  destId: string | number
): boolean {
  const sid = String(sourceId ?? '').trim();
  const did = String(destId ?? '').trim();
  if (!sid || !did) return false;
  return sourceType === destType && sid === did;
}
