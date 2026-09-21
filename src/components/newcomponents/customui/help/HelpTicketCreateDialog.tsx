import React, { useEffect, useState } from 'react';
import { Lightbulb } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { HelpTicketType } from '@/types/helpTicket';

import { getHelpCopy, HELP_CATEGORY_OTHER, HELP_CATEGORY_PRESETS } from './helpCopy';

export interface HelpTicketCreateFormState {
  title: string;
  description: string;
  category: string;
}

interface HelpTicketCreateDialogProps {
  open: boolean;
  type: HelpTicketType;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (form: HelpTicketCreateFormState) => void;
}

const HelpTicketCreateDialog: React.FC<HelpTicketCreateDialogProps> = ({
  open,
  type,
  isSubmitting,
  onOpenChange,
  onSubmit,
}) => {
  const copy = getHelpCopy(type);
  const presets = HELP_CATEGORY_PRESETS[type];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryPreset, setCategoryPreset] = useState<string>('');
  const [customCategory, setCustomCategory] = useState('');

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategoryPreset('');
    setCustomCategory('');
  };

  useEffect(() => {
    if (!open) resetForm();
  }, [open, type]);

  const resolvedCategory =
    categoryPreset === HELP_CATEGORY_OTHER
      ? customCategory.trim()
      : categoryPreset.trim();

  const handleSubmit = () => {
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      category: resolvedCategory,
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) resetForm();
      }}
    >
      <DialogContent className="flex h-[66vh] max-h-[66vh] w-[min(56rem,94vw)] max-w-none flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>{copy.createDialogTitle}</DialogTitle>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto py-1 md:grid-cols-[minmax(0,1fr)_minmax(220px,280px)] md:gap-6">
          <div className="min-w-0 space-y-4 px-1 py-0.5">
            <div className="space-y-2 p-0.5">
              <Label htmlFor="help-title">Title</Label>
              <Input
                id="help-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={200}
                placeholder={copy.titlePlaceholder}
              />
            </div>

            <div className="space-y-2 p-0.5">
              <Label htmlFor="help-category">Category (optional)</Label>
              <Select
                value={categoryPreset || undefined}
                onValueChange={setCategoryPreset}
              >
                <SelectTrigger id="help-category">
                  <SelectValue placeholder="Choose a category" />
                </SelectTrigger>
                <SelectContent>
                  {presets.map((preset) => (
                    <SelectItem key={preset} value={preset}>
                      {preset}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {categoryPreset === HELP_CATEGORY_OTHER ? (
                <Input
                  value={customCategory}
                  onChange={(event) => setCustomCategory(event.target.value)}
                  maxLength={80}
                  placeholder="Describe the category"
                />
              ) : null}
            </div>

            <div className="space-y-2 p-0.5">
              <Label htmlFor="help-description">Description</Label>
              <Textarea
                id="help-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={8}
                placeholder={copy.descriptionPlaceholder}
              />
            </div>
          </div>

          <aside className="min-h-0 self-start rounded-lg border border-border bg-muted/30 p-4 md:sticky md:top-0">
            <div className="mb-3 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-brand-primary" aria-hidden />
              <h3 className="text-sm font-semibold text-card-foreground">{copy.tipsTitle}</h3>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {copy.tipsBullets.map((bullet) => (
                <li key={bullet} className="flex gap-2">
                  <span className="text-brand-primary" aria-hidden>
                    •
                  </span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>

        <DialogFooter className="shrink-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={isSubmitting} onClick={handleSubmit}>
            {copy.createSubmitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default HelpTicketCreateDialog;
