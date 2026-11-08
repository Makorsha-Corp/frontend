import React, { useState } from 'react';
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
import { useCreateFactorySectionMutation } from '@/features/factorySections/factorySectionsApi';
import type { FactorySection } from '@/types/factorySection';
import { appToast } from '@/lib/appToast';
import { Loader2 } from 'lucide-react';
import { apiErrorDetail } from '@/utils/apiError';

interface AddFactorySectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  factoryId: number;
  sections?: FactorySection[];
}

const AddFactorySectionDialog: React.FC<AddFactorySectionDialogProps> = ({
  open,
  onOpenChange,
  factoryId,
  sections = [],
}) => {
  const { t } = useTranslation('factories');
  const { t: tCommon } = useTranslation('common');
  const [name, setName] = useState('');

  const [createSection, { isLoading }] = useCreateFactorySectionMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      appToast.error(t('toastSectionNameRequired'));
      return;
    }

    const nameLower = name.trim().toLowerCase();
    const dup = sections.find((s) => s.name.toLowerCase() === nameLower);
    if (dup) {
      appToast.error(t('toastSectionDuplicate'));
      return;
    }

    try {
      await createSection({
        name: name.trim(),
        factory_id: factoryId,
      }).unwrap();

      appToast.success(t('toastSectionCreateSuccess'));
      setName('');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create section:', error);
      appToast.error(apiErrorDetail(error, t('toastSectionCreateFailed')));
    }
  };

  const handleCancel = () => {
    setName('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-card-foreground">{t('addSectionDialogTitle')}</DialogTitle>
            <DialogDescription>{t('addSectionDialogDescription')}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="section-name">
                {t('fieldSectionName')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="section-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('placeholderSectionName')}
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
                  {t('dialogCreating')}
                </>
              ) : (
                t('createSection')
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddFactorySectionDialog;
