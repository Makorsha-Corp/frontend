import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { appToast } from '@/lib/appToast';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { updateUser } from '@/features/auth/authSlice';
import { useGetMeQuery, useUpdateMeMutation } from '@/features/auth/authApi';
import { formatWallTimeHm } from '@/lib/wallTimeFormat';

const TimeFormatSettingsPanel: React.FC = () => {
  const { t } = useTranslation('settings');
  const dispatch = useAppDispatch();
  const storedUser = useAppSelector((state) => state.auth.user);
  const { data: meData, isLoading } = useGetMeQuery();
  const [updateMe, { isLoading: isSaving }] = useUpdateMeMutation();

  const [use24Hour, setUse24Hour] = useState(storedUser?.use_24_hour_time !== false);

  useEffect(() => {
    if (meData?.user.use_24_hour_time !== undefined) {
      setUse24Hour(meData.user.use_24_hour_time !== false);
    }
  }, [meData?.user.use_24_hour_time]);

  const handleSave = async () => {
    try {
      const user = await updateMe({ use_24_hour_time: use24Hour }).unwrap();
      dispatch(updateUser({ use_24_hour_time: user.use_24_hour_time !== false }));
      appToast.success(t('timeFormatSaved'));
    } catch {
      appToast.error(t('timeFormatSaveFailed'));
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

  const sample = '14:30';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 rounded-md border border-border bg-muted/20 px-3 py-3">
        <div className="space-y-0.5">
          <Label htmlFor="use-24-hour-time">{t('time24HourLabel')}</Label>
          <p className="text-sm text-muted-foreground">{t('time24HourHint')}</p>
        </div>
        <Switch id="use-24-hour-time" checked={use24Hour} onCheckedChange={setUse24Hour} />
      </div>

      <div className="rounded-md bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
        {t('preview')}:{' '}
        <span className="font-medium tabular-nums text-foreground">
          {formatWallTimeHm(sample, use24Hour)}
        </span>
      </div>

      <Button onClick={handleSave} disabled={isSaving}>
        {isSaving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t('saving')}
          </>
        ) : (
          t('saveTimeFormat')
        )}
      </Button>
    </div>
  );
};

export default TimeFormatSettingsPanel;
