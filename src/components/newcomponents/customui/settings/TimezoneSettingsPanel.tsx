import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { appToast } from '@/lib/appToast';

import { useAppDispatch, useAppSelector } from '@/app/hooks';
import TimezoneSelect from '@/components/newcomponents/customui/TimezoneSelect';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { updateUser } from '@/features/auth/authSlice';
import { useGetMeQuery, useUpdateMeMutation } from '@/features/auth/authApi';
import { detectBrowserTimezone, formatAbsoluteFromApi } from '@/utils/datetime';

const TimezoneSettingsPanel: React.FC = () => {
  const { t } = useTranslation('settings');
  const dispatch = useAppDispatch();
  const storedUser = useAppSelector((state) => state.auth.user);
  const { data: meData, isLoading } = useGetMeQuery();
  const [updateMe, { isLoading: isSaving }] = useUpdateMeMutation();

  const [timezone, setTimezone] = useState(
    storedUser?.timezone ?? detectBrowserTimezone()
  );

  useEffect(() => {
    if (meData?.user.timezone) {
      setTimezone(meData.user.timezone);
    }
  }, [meData?.user.timezone]);

  const previewInstant = new Date().toISOString();

  const handleSave = async () => {
    try {
      const user = await updateMe({ timezone }).unwrap();
      dispatch(updateUser({ timezone: user.timezone ?? timezone }));
      appToast.success(t('timezoneSaved'));
    } catch {
      appToast.error(t('timezoneSaveFailed'));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t('loading')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="timezone-select">{t('yourTimezone')}</Label>
        <TimezoneSelect value={timezone} onChange={setTimezone} />
      </div>

      <div className="rounded-md bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
        {t('preview')}:{' '}
        <span className="font-medium text-foreground">
          {formatAbsoluteFromApi(previewInstant, timezone)}
        </span>
      </div>

      <Button onClick={handleSave} disabled={isSaving}>
        {isSaving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t('saving')}
          </>
        ) : (
          t('saveTimezone')
        )}
      </Button>
    </div>
  );
};

export default TimezoneSettingsPanel;
