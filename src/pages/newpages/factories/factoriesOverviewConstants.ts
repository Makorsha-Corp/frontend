export function factoryHubLink(path: string, factoryFilter: string): string {
  if (factoryFilter === 'all') return path;
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}factoryId=${factoryFilter}`;
}

/** Factory overview → Production (optional Batches tab when runs are in progress). */
export function factoryProductionHubLink(
  factoryFilter: string,
  options?: { batchesTab?: boolean },
): string {
  let href = factoryHubLink('/production', factoryFilter);
  if (options?.batchesTab) {
    const sep = href.includes('?') ? '&' : '?';
    href = `${href}${sep}tab=batches`;
  }
  return href;
}
