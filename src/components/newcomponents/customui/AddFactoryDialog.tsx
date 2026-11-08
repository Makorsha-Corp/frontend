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
import { useCreateFactoryMutation } from '@/features/factories/factoriesApi';
import type { Factory } from '@/types/factory';
import { appToast } from '@/lib/appToast';
import { Loader2 } from 'lucide-react';
import { apiErrorDetail } from '@/utils/apiError';

interface AddFactoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  factories?: Factory[];
}

const AddFactoryDialog: React.FC<AddFactoryDialogProps> = ({ open, onOpenChange, factories = [] }) => {
  const { t } = useTranslation('factories');
  const { t: tCommon } = useTranslation('common');
  const [name, setName] = useState('');
  const [abbreviation, setAbbreviation] = useState('');

  const [createFactory, { isLoading }] = useCreateFactoryMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      appToast.error(t('toastFactoryNameRequired'));
      return;
    }

    if (!abbreviation.trim()) {
      appToast.error(t('toastAbbreviationRequired'));
      return;
    }

    const nameLower = name.trim().toLowerCase();
    const abbrLower = abbreviation.trim().toUpperCase().toLowerCase();
    const dup = factories.find(
      (f) =>
        f.name.toLowerCase() === nameLower || f.abbreviation.toLowerCase() === abbrLower
    );
    if (dup) {
      appToast.error(
        dup.name.toLowerCase() === nameLower
          ? t('toastFactoryDuplicateName')
          : t('toastFactoryDuplicateAbbr')
      );
      return;
    }

    try {
      await createFactory({
        name: name.trim(),
        abbreviation: abbreviation.trim().toUpperCase(),
      }).unwrap();

      appToast.success(t('toastFactoryCreateSuccess'));
      setName('');
      setAbbreviation('');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create factory:', error);
      appToast.error(apiErrorDetail(error, t('toastFactoryCreateFailed')));
    }
  };

  const handleCancel = () => {
    setName('');
    setAbbreviation('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-card-foreground">{t('addFactoryDialogTitle')}</DialogTitle>
            <DialogDescription>{t('addFactoryDialogDescription')}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">
                {t('fieldFactoryName')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('placeholderFactoryName')}
                className="bg-background"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="abbreviation">
                {t('fieldAbbreviation')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="abbreviation"
                value={abbreviation}
                onChange={(e) => setAbbreviation(e.target.value.toUpperCase())}
                placeholder={t('placeholderAbbreviation')}
                maxLength={10}
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
                  {t('creatingFactory')}
                </>
              ) : (
                t('createFactory')
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddFactoryDialog;
