import { useEffect } from 'react';
import { useAppDispatch } from '@/app/hooks';
import { useGetMeQuery } from '@/features/auth/authApi';
import { updateUser } from '@/features/auth/authSlice';

/**
 * Refreshes profile fields (e.g. is_platform_admin) from GET /auth/me/ after workspace load.
 * Avoids stale localStorage user_data after SQL bootstrap without forcing re-login.
 */
export default function AuthProfileSync() {
  const dispatch = useAppDispatch();
  const { data } = useGetMeQuery();

  useEffect(() => {
    if (!data?.user) return;
    dispatch(
      updateUser({
        name: data.user.name,
        timezone: data.user.timezone ?? null,
        is_platform_admin: data.user.is_platform_admin ?? false,
      }),
    );
  }, [data, dispatch]);

  return null;
}
