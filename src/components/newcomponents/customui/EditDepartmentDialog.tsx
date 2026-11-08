import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUpdateDepartmentMutation } from '@/features/departments/departmentsApi';
import type { Department } from '@/types/department';
import { appToast } from '@/lib/appToast';
import { Loader2 } from 'lucide-react';

interface EditDepartmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department: Department | null;
  departments?: Department[];
}

const EditDepartmentDialog: React.FC<EditDepartmentDialogProps> = ({
  open,
  onOpenChange,
  department,
  departments = [],
}) => {
  const { t } = useTranslation('factories');
  const { t: tCommon } = useTranslation('common');
  const [name, setName] = useState('');

  const [updateDepartment, { isLoading }] = useUpdateDepartmentMutation();

  useEffect(() => {
    if (department) {
      setName(department.name);
    }
  }, [department]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!department) return;

    if (!name.trim()) {
      appToast.error(t('toastDepartmentNameRequired'));
      return;
    }

    const nameLower = name.trim().toLowerCase();
    const dup = departments.find((d) => d.id !== department.id && d.name.toLowerCase() === nameLower);
    if (dup) {
      appToast.error(t('toastDepartmentDuplicate'));
      return;
    }

    try {
      await updateDepartment({
        id: department.id,
        data: { name: name.trim() },
      }).unwrap();

      appToast.success(t('toastDepartmentUpdateSuccess'));
      onOpenChange(false);
    } catch (error: unknown) {
      console.error('Failed to update department:', error);
      const err = error as { data?: { detail?: string } };
      appToast.error(err?.data?.detail || t('toastDepartmentUpdateFailed'));
    }
  };

  const handleCancel = () => {
    if (department) {
      setName(department.name);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[380px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-card-foreground">{t('editDepartmentDialogTitle')}</DialogTitle>
            <DialogDescription>{t('editDepartmentDialogDescription')}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-dept-name">
                {t('fieldDepartmentName')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-dept-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('placeholderDepartmentName')}
                className="bg-background"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              {tCommon('cancel')}
            </Button>
            <Button type="submit" className="bg-brand-primary hover:bg-brand-primary-hover" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {tCommon('saving')}
                </>
              ) : (
                tCommon('save')
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditDepartmentDialog;
