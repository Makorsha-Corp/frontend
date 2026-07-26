export function factoryHubLink(path: string, factoryFilter: string): string {
  if (factoryFilter === 'all') return path;
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}factoryId=${factoryFilter}`;
}
