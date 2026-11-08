import { useAppSelector } from '@/app/hooks';
import { useGetMeQuery } from '@/features/auth/authApi';

/** User wall-clock display preference (Settings → General → Time format). */
export function useUserTimeFormat(): { use24Hour: boolean } {
  const user = useAppSelector((state) => state.auth.user);
  const { data: meData } = useGetMeQuery(undefined, { skip: !user });
  const fromMe = meData?.user.use_24_hour_time;
  const fromStore = user?.use_24_hour_time;
  const use24Hour =
    fromMe !== undefined ? fromMe !== false : fromStore !== undefined ? fromStore !== false : true;
  return { use24Hour };
}
