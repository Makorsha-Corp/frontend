/** Local datetime `yyyy-MM-ddTHH:mm` → ISO for API. */
export function localDatetimeToIso(local: string): string | undefined {
  if (!local.trim()) return undefined;
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

export function defaultLocalDatetimeNow(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Returns user-facing error message, or null if OK. */
export function validateStartedEarlier(enabled: boolean, localValue: string): string | null {
  if (!enabled) return null;
  const iso = localDatetimeToIso(localValue);
  if (!iso) return 'Enter a valid start time';
  if (new Date(iso).getTime() > Date.now()) return 'Start time cannot be in the future';
  return null;
}

export function startedAtForApi(enabled: boolean, localValue: string): string | undefined {
  if (!enabled) return undefined;
  return localDatetimeToIso(localValue);
}
