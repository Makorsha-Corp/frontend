import React, { useEffect, useMemo, useState } from 'react';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  useGetWorkOrderTemplatesQuery,
  useDeleteWorkOrderTemplateMutation,
} from '@/features/workOrderTemplates/workOrderTemplatesApi';
import type { WorkOrderTemplate } from '@/types/workOrderTemplate';
import type { Machine } from '@/types/machine';
import type { FactorySection } from '@/types/factorySection';
import { API_LIMITS } from '@/constants/apiLimits';
import { cn } from '@/lib/utils';
import { BookmarkPlus, FileX2, LayoutTemplate, Loader2, Pencil, Plus, Search, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import CreateEditWorkOrderTemplateDialog from './CreateEditWorkOrderTemplateDialog';

export interface WorkOrderTemplateSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (template: WorkOrderTemplate | null) => void;
  selectedTemplateId?: number | string;
  title?: string;
  description?: string;
  onSaveFromForm?: (name: string) => Promise<void>;
  canSaveFromForm?: boolean;
  defaultSectionId?: number | null;
  defaultMachineId?: number | null;
  machines?: Machine[];
  sections?: FactorySection[];
}

const WorkOrderTemplateSelectorDialog: React.FC<WorkOrderTemplateSelectorDialogProps> = ({
  open,
  onOpenChange,
  onSelect,
  selectedTemplateId,
  title = 'Select template',
  description = 'Pick a preset to prefill the form.',
  onSaveFromForm,
  canSaveFromForm = true,
  defaultSectionId,
  defaultMachineId,
  machines = [],
  sections = [],
}) => {
  const [search, setSearch] = useState('');
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const [highlightNone, setHighlightNone] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WorkOrderTemplate | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [savePopoverOpen, setSavePopoverOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [isSavingFromForm, setIsSavingFromForm] = useState(false);

  const { data: activeTemplates = [], isLoading } = useGetWorkOrderTemplatesQuery(
    { is_active: true, limit: API_LIMITS.FLEXIBLE_1000 },
    { skip: !open },
  );

  const [deactivateTemplate] = useDeleteWorkOrderTemplateMutation();

  const filteredTemplates = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return activeTemplates;
    return activeTemplates.filter(
      (t) =>
        t.template_name.toLowerCase().includes(q) ||
        (t.work_order_type_name && t.work_order_type_name.toLowerCase().includes(q)),
    );
  }, [activeTemplates, search]);

  const highlighted = useMemo(
    () => activeTemplates.find((t) => t.id === highlightedId) ?? null,
    [activeTemplates, highlightedId],
  );

  useEffect(() => {
    if (!open) {
      setSearch('');
      setHighlightedId(null);
      setHighlightNone(false);
      setSavePopoverOpen(false);
      setSaveName('');
      return;
    }
    setSearch('');
    const id = selectedTemplateId ? Number(selectedTemplateId) : null;
    if (Number.isFinite(id) && id) {
      setHighlightedId(id);
      setHighlightNone(false);
    } else {
      setHighlightedId(null);
      setHighlightNone(true);
    }
  }, [open, selectedTemplateId]);

  useEffect(() => {
    if (highlightNone) return;
    if (highlightedId != null && !filteredTemplates.some((t) => t.id === highlightedId)) {
      setHighlightedId(null);
    }
  }, [filteredTemplates, highlightedId, highlightNone]);

  const confirmSelection = () => {
    if (highlightNone) {
      onSelect(null);
      onOpenChange(false);
      return;
    }
    if (!highlighted) return;
    onSelect(highlighted);
    onOpenChange(false);
  };

  const selectNone = () => {
    setHighlightNone(true);
    setHighlightedId(null);
  };

  const selectTemplate = (id: number) => {
    setHighlightNone(false);
    setHighlightedId(id);
  };

  const openEdit = (t: WorkOrderTemplate) => {
    setEditingTemplate(t);
    setEditorOpen(true);
  };

  const handleDeactivate = async (t: WorkOrderTemplate) => {
    setBusyId(t.id);
    try {
      await deactivateTemplate(t.id).unwrap();
      toast.success(`${t.template_name} deleted`);
      if (highlightedId === t.id) setHighlightedId(null);
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to delete template');
    } finally {
      setBusyId(null);
    }
  };

  const handleSaveFromForm = async () => {
    if (!onSaveFromForm || !saveName.trim()) return;
    setIsSavingFromForm(true);
    try {
      await onSaveFromForm(saveName.trim());
      setSavePopoverOpen(false);
      setSaveName('');
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      if (e?.data?.detail) toast.error(e.data.detail);
    } finally {
      setIsSavingFromForm(false);
    }
  };

  const canConfirm = highlightNone || Boolean(highlighted);
  const showSaveFromForm = Boolean(onSaveFromForm);

  const noTemplateCard = (
    <div
      role="option"
      aria-selected={highlightNone}
      className={cn(
        'flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors',
        highlightNone ? 'bg-brand-primary/10' : 'hover:bg-muted/40',
      )}
      onClick={selectNone}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-dashed border-border bg-muted/30">
        <FileX2 className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-card-foreground">No template</p>
        <p className="text-xs text-muted-foreground">Start from scratch — no preset fields</p>
      </div>
    </div>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex h-[min(70vh,640px)] w-[min(48rem,94vw)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none">
          <DialogHeader className="shrink-0 space-y-1 border-b border-border py-4 pl-6 pr-14">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <DialogTitle className="flex items-center gap-2 text-base">
                  <LayoutTemplate className="h-4 w-4 shrink-0 text-muted-foreground" />
                  {title}
                </DialogTitle>
                <DialogDescription>{description}</DialogDescription>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {showSaveFromForm && (
                  <Popover open={savePopoverOpen} onOpenChange={setSavePopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!canSaveFromForm}
                        title={canSaveFromForm ? undefined : 'Fill in work type first'}
                      >
                        <BookmarkPlus className="mr-1 h-4 w-4" />
                        Save current
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-3" align="end">
                      <p className="mb-2 text-xs text-muted-foreground">Name this preset from your current form.</p>
                      <Input
                        value={saveName}
                        onChange={(e) => setSaveName(e.target.value)}
                        placeholder="Template name"
                        className="h-9"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && saveName.trim()) void handleSaveFromForm();
                        }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        className="mt-2 w-full bg-brand-primary hover:bg-brand-primary-hover"
                        disabled={!saveName.trim() || isSavingFromForm}
                        onClick={() => void handleSaveFromForm()}
                      >
                        {isSavingFromForm ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Save template
                      </Button>
                    </PopoverContent>
                  </Popover>
                )}
                <Button
                  type="button"
                  size="sm"
                  className="bg-brand-primary hover:bg-brand-primary-hover"
                  onClick={() => {
                    setEditingTemplate(null);
                    setEditorOpen(true);
                  }}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  New template
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-6 py-4">
            <div className="relative shrink-0">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search templates…"
                className="h-9 pl-8"
                autoComplete="off"
              />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-border">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {noTemplateCard}

                  {activeTemplates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
                      <LayoutTemplate className="mb-2 h-8 w-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">No saved templates yet</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {showSaveFromForm ? 'Save current form or use New template.' : 'Use New template to create one.'}
                      </p>
                    </div>
                  ) : filteredTemplates.length === 0 ? (
                    <div className="flex items-center justify-center px-4 py-10 text-sm text-muted-foreground">
                      No templates match your search
                    </div>
                  ) : (
                    filteredTemplates.map((t) => {
                      const isHighlighted = !highlightNone && highlightedId === t.id;
                      const busy = busyId === t.id;
                      return (
                        <div
                          key={t.id}
                          role="option"
                          aria-selected={isHighlighted}
                          className={cn(
                            'flex cursor-pointer items-center justify-between gap-3 px-4 py-3 transition-colors',
                            isHighlighted ? 'bg-brand-primary/10' : 'hover:bg-muted/40',
                          )}
                          onClick={() => selectTemplate(t.id)}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-card-foreground">{t.template_name}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {t.work_order_type_name ?? 'Type not set'}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={() => openEdit(t)}
                              title="Edit template"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              disabled={busy}
                              onClick={() => void handleDeactivate(t)}
                              title="Delete template"
                            >
                              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex shrink-0 flex-col gap-3 border-t border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              {highlightNone ? (
                <>
                  Selected: <span className="font-medium text-foreground">No template</span>
                </>
              ) : highlighted ? (
                <>
                  Selected: <span className="font-medium text-foreground">{highlighted.template_name}</span>
                </>
              ) : (
                <>Click a template or No template, then confirm below.</>
              )}
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                className="bg-brand-primary hover:bg-brand-primary-hover"
                disabled={!canConfirm}
                onClick={confirmSelection}
              >
                {highlightNone ? 'Continue without template' : 'Use template'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CreateEditWorkOrderTemplateDialog
        open={editorOpen}
        onOpenChange={(next) => {
          setEditorOpen(next);
          if (!next) setEditingTemplate(null);
        }}
        template={editingTemplate}
        defaultSectionId={defaultSectionId}
        defaultMachineId={defaultMachineId}
        machines={machines}
        sections={sections}
      />
    </>
  );
};

export default WorkOrderTemplateSelectorDialog;
