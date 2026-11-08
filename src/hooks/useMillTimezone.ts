import { useAppSelector } from '@/app/hooks';
import { resolveMillTimezone } from '@/lib/millCalendarDate';

/** Mill calendar zone: saved workspace timezone, otherwise Bangladesh (Asia/Dhaka). */
export function useMillTimezone(): string {
  const workspaceTz = useAppSelector((state) => state.auth.workspace?.settings?.timezone);
  return resolveMillTimezone(typeof workspaceTz === 'string' ? workspaceTz : null);
}
