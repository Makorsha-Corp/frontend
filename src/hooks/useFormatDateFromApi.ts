import { useCallback } from 'react';

import { useDisplayTimezone } from '@/hooks/useDisplayTimezone';
import { formatDateFromApi, formatDateTimeFromApi } from '@/utils/datetime';

/** Binds formatDateFromApi to the current user's display timezone. */
export function useFormatDateFromApi() {
  const timeZone = useDisplayTimezone();
  return useCallback(
    (value: string | null | undefined) => formatDateFromApi(value, timeZone),
    [timeZone]
  );
}

/** Binds formatDateTimeFromApi to the current user's display timezone. */
export function useFormatDateTimeFromApi() {
  const timeZone = useDisplayTimezone();
  return useCallback(
    (value: string | null | undefined) => formatDateTimeFromApi(value, timeZone),
    [timeZone]
  );
}
