import { useAppSelector } from '@/app/hooks';
import { detectBrowserTimezone } from '@/utils/datetime';

/** User → workspace default → browser IANA timezone for display. */
export function useDisplayTimezone(): string {
  const user = useAppSelector((state) => state.auth.user);
  const workspace = useAppSelector((state) => state.auth.workspace);
  const workspaceTz = workspace?.settings?.timezone;
  if (user?.timezone) return user.timezone;
  if (workspaceTz) return workspaceTz;
  return detectBrowserTimezone();
}
