import React, { useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import TimePickerField from '@/components/newcomponents/customui/TimePickerField';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useCreateWorkspaceShiftMutation,
  useDeleteWorkspaceShiftMutation,
  useGetWorkspaceShiftsQuery,
  useUpdateWorkspaceShiftMutation,
} from '@/features/workspaceShifts/workspaceShiftsApi';
import { useUserTimeFormat } from '@/hooks/useUserTimeFormat';
import { appToast } from '@/lib/appToast';
import { formatWallTimeHm } from '@/lib/wallTimeFormat';
import { formatShiftChipLabel } from '@/lib/workspaceShiftChipUtils';

const WorkspaceShiftsSettingsPanel: React.FC = () => {
  const { t } = useTranslation('settings');
  const { use24Hour } = useUserTimeFormat();
  const { data: shifts = [], isLoading } = useGetWorkspaceShiftsQuery({});
  const [createShift, { isLoading: isCreating }] = useCreateWorkspaceShiftMutation();
  const [updateShift] = useUpdateWorkspaceShiftMutation();
  const [deleteShift] = useDeleteWorkspaceShiftMutation();

  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('06:00');
  const [endTime, setEndTime] = useState('14:00');

  const handleAdd = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      appToast.error(t('shiftsNameRequired'));
      return;
    }
    try {
      await createShift({
        name: trimmed,
        start_time: `${startTime}:00`,
        end_time: `${endTime}:00`,
        sort_order: shifts.length,
      }).unwrap();
      setName('');
      appToast.success(t('shiftsAddSuccess'));
    } catch (e: unknown) {
      const detail = (e as { data?: { detail?: string } })?.data?.detail;
      appToast.error(typeof detail === 'string' ? detail : t('shiftsAddFailed'));
    }
  };

  const toggleActive = async (id: number, is_active: boolean) => {
    try {
      await updateShift({ id, data: { is_active: !is_active } }).unwrap();
    } catch (e: unknown) {
      const detail = (e as { data?: { detail?: string } })?.data?.detail;
      appToast.error(typeof detail === 'string' ? detail : t('shiftsUpdateFailed'));
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteShift(id).unwrap();
      appToast.success(t('shiftsRemoveSuccess'));
    } catch {
      appToast.error(t('shiftsRemoveFailed'));
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-card-foreground">{t('shiftsTitle')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('shiftsDescription')}</p>
      </div>

      {shifts.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('shiftsColumnShift')}</TableHead>
              <TableHead className="w-24">{t('shiftsColumnStart')}</TableHead>
              <TableHead className="w-24">{t('shiftsColumnEnd')}</TableHead>
              <TableHead className="w-24">{t('shiftsColumnActive')}</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {shifts.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{formatShiftChipLabel(row, use24Hour)}</TableCell>
                <TableCell className="tabular-nums">
                  {formatWallTimeHm(row.start_time.slice(0, 5), use24Hour)}
                </TableCell>
                <TableCell className="tabular-nums">
                  {formatWallTimeHm(row.end_time.slice(0, 5), use24Hour)}
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    size="sm"
                    variant={row.is_active ? 'default' : 'outline'}
                    className={row.is_active ? 'bg-brand-primary hover:bg-brand-primary-hover' : undefined}
                    onClick={() => void toggleActive(row.id, row.is_active)}
                  >
                    {row.is_active ? t('shiftsOn') : t('shiftsOff')}
                  </Button>
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => void handleDelete(row.id)}
                    aria-label={t('shiftsDeleteAria')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="rounded-md border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
          {t('shiftsEmpty')}
        </p>
      )}

      <div className="rounded-lg border border-border bg-muted/20 p-4">
        <p className="mb-3 text-sm font-medium">{t('shiftsAddTitle')}</p>
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="shift-name">{t('shiftsNameLabel')}</Label>
            <Input
              id="shift-name"
              className="h-9"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('shiftsNamePlaceholder')}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="shift-start">{t('shiftsStartLabel')}</Label>
            <TimePickerField
              id="shift-start"
              value={startTime}
              onChange={setStartTime}
              aria-label={t('shiftsStartAria')}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="shift-end">{t('shiftsEndLabel')}</Label>
            <TimePickerField
              id="shift-end"
              value={endTime}
              onChange={setEndTime}
              aria-label={t('shiftsEndAria')}
            />
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          className="mt-3 bg-brand-primary hover:bg-brand-primary-hover"
          disabled={isCreating}
          onClick={() => void handleAdd()}
        >
          {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('shiftsAddButton')}
        </Button>
      </div>
    </div>
  );
};

export default WorkspaceShiftsSettingsPanel;
