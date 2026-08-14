/** Common IANA timezones for ERP users + full list helper. */

export const COMMON_TIMEZONES: { value: string; label: string }[] = [
  { value: 'Asia/Dhaka', label: 'Bangladesh (Asia/Dhaka)' },
  { value: 'America/New_York', label: 'US Eastern (America/New_York)' },
  { value: 'America/Chicago', label: 'US Central (America/Chicago)' },
  { value: 'America/Denver', label: 'US Mountain (America/Denver)' },
  { value: 'America/Los_Angeles', label: 'US Pacific (America/Los_Angeles)' },
  { value: 'Europe/London', label: 'UK (Europe/London)' },
  { value: 'Europe/Paris', label: 'Central Europe (Europe/Paris)' },
  { value: 'Asia/Dubai', label: 'UAE (Asia/Dubai)' },
  { value: 'Asia/Kolkata', label: 'India (Asia/Kolkata)' },
  { value: 'Asia/Singapore', label: 'Singapore (Asia/Singapore)' },
  { value: 'Asia/Tokyo', label: 'Japan (Asia/Tokyo)' },
  { value: 'Australia/Sydney', label: 'Australia (Australia/Sydney)' },
  { value: 'UTC', label: 'UTC' },
];

const FALLBACK_TIMEZONES = COMMON_TIMEZONES.map((z) => z.value);

let cachedAllTimezones: string[] | null = null;

function readSupportedTimezones(): string[] {
  const intlWithSupported = Intl as typeof Intl & {
    supportedValuesOf?: (key: string) => string[];
  };
  if (typeof intlWithSupported.supportedValuesOf === 'function') {
    try {
      return intlWithSupported.supportedValuesOf('timeZone');
    } catch {
      return FALLBACK_TIMEZONES;
    }
  }
  return FALLBACK_TIMEZONES;
}

/** All IANA zones supported by the runtime (for search). */
export function getAllTimezones(): string[] {
  if (!cachedAllTimezones) {
    cachedAllTimezones = readSupportedTimezones();
  }
  return cachedAllTimezones;
}

export function filterTimezones(query: string): string[] {
  const q = query.trim().toLowerCase();
  const all = getAllTimezones();
  if (!q) return all.slice(0, 50);
  return all.filter((tz) => tz.toLowerCase().includes(q)).slice(0, 50);
}

export function timezoneLabel(value: string): string {
  const common = COMMON_TIMEZONES.find((z) => z.value === value);
  return common?.label ?? value.replace(/_/g, ' ');
}
