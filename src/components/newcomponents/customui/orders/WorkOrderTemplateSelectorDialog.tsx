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
import { Badge } from '@/components/ui/badge';
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
import {
  formatNextDueDate,
  formatRecurrenceCadence,
  formatRecurrenceRange,
} from '@/pages/newpages/orders/workOrderTemplateLabels';
import {
  BookmarkPlus,
  FileX2,
  LayoutTemplate,
  Loader2,
  Pencil,
  Plus,
  Search,
  XCircle,
} from 'lucide-react';
import { appToast } from '@/lib/appToast';
import CreateEditWorkOrderTemplateDialog from './CreateEditWorkOrderTemplateDialog';
import WorkOrderTemplatePreviewPanel from './WorkOrderTemplatePreviewPanel';

export type TemplatePickerMode = 'pick' | 'manage';

const MANAGE_MODE_HINT = 'Create and edit templates. Turn on recurrence for Plan-day drafts.';

export interface WorkOrderTemplateSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect?: (template: WorkOrderTemplate | null) => void;
  selectedTemplateId?: number | string;
  title?: string;
  description?: string;
  mode?: TemplatePickerMode;
  onSaveFromForm?: (name: string) => Promise<void>;
  canSaveFromForm?: boolean;
  defaultSectionId?: number | null;
  defaultMachineId?: number | null;
  factoryId?: number | null;
  machineId?: number | null;
  machines?: Machine[];
  sections?: FactorySection[];
}

function sortTemplatesByName(templates: WorkOrderTemplate[]): WorkOrderTemplate[] {
  return [...templates].sort((a, b) => a.template_name.localeCompare(b.template_name));
}

function searchTemplates(templates: WorkOrderTemplate[], query: string): WorkOrderTemplate[] {
  const q = query.trim().toLowerCase();
  if (!q) return templates;
  return templates.filter(
    (t) =>
      t.template_name.toLowerCase().includes(q) ||
      (t.work_order_type_name && t.work_order_type_name.toLowerCase().includes(q)),
  );
}

const WorkOrderTemplateSelectorDialog: React.FC<WorkOrderTemplateSelectorDialogProps> = ({
  open,
  onOpenChange,
  onSelect,
  selectedTemplateId,
  title,
  description,
  mode = 'pick',
  onSaveFromForm,
  canSaveFromForm = true,
  defaultSectionId,
  defaultMachineId,
  machines = [],
  sections = [],
}) => {
  const isManageMode = mode === 'manage';

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

  const sortedTemplates = useMemo(
    () => sortTemplatesByName(activeTemplates),
    [activeTemplates],
  );

  const filteredTemplates = useMemo(
    () => searchTemplates(sortedTemplates, search),
    [sortedTemplates, search],
  );

  const highlighted = useMemo(
    () => activeTemplates.find((t) => t.id === highlightedId) ?? null,
    [activeTemplates, highlightedId],
  );

  const dialogTitle =
    title ?? (isManageMode ? 'Templates' : 'Select template');

  const dialogDescription =
    description ??
    (isManageMode
      ? MANAGE_MODE_HINT
      : 'Prefill this row. Set the planned date on the entry.');

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
    } else if (isManageMode) {
      setHighlightedId(null);
      setHighlightNone(false);
    } else {
      setHighlightedId(null);
      setHighlightNone(true);
    }
  }, [open, selectedTemplateId, isManageMode]);

  useEffect(() => {
    if (highlightNone) return;
    if (highlightedId != null && !filteredTemplates.some((t) => t.id === highlightedId)) {
      setHighlightedId(null);
    }
  }, [filteredTemplates, highlightedId, highlightNone]);

  const confirmSelection = () => {
    if (!onSelect) return;
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

  const openCreate = () => {
    setEditingTemplate(null);
    setEditorOpen(true);
  };

  const openEdit = (t: WorkOrderTemplate) => {
    setEditingTemplate(t);
    setEditorOpen(true);
  };

  const handleDeactivate = async (t: WorkOrderTemplate) => {
    setBusyId(t.id);
    try {
      await deactivateTemplate(t.id).unwrap();
      appToast.success(`${t.template_name} deleted`);
      if (highlightedId === t.id) setHighlightedId(null);
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      appToast.error(e?.data?.detail || 'Failed to delete template');
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
      if (e?.data?.detail) appToast.error(e.data.detail);
    } finally {
      setIsSavingFromForm(false);
    }
  };

  const canConfirm = highlightNone || Boolean(highlighted);
  const showSaveFromForm = Boolean(onSaveFromForm) && !isManageMode;
  const showNoTemplateCard = !isManageMode;

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
        <p className="text-xs text-muted-foreground">Start from scratch — no saved defaults</p>
      </div>
    </div>
  );

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
      <LayoutTemplate className="mb-2 h-8 w-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">No templates yet</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {showSaveFromForm
          ? 'Save current form or create a new template.'
          : 'Create a template with saved defaults.'}
      </p>
      <Button type="button" size="sm" className="mt-3 bg-brand-primary hover:bg-brand-primary-hover" onClick={openCreate}>
        <Plus className="mr-1 h-4 w-4" />
        New template
      </Button>
    </div>
  );

  const renderTemplateRow = (t: WorkOrderTemplate) => {
    const isHighlighted = !highlightNone && highlightedId === t.id;
    const busy = busyId === t.id;
    const cadence = formatRecurrenceCadence(t);
    const range = formatRecurrenceRange(t);
    const nextDue = formatNextDueDate(t.next_generation_date);
    const subtitleExtra = range
      ? range
      : nextDue
        ? `next due ${nextDue}`
        : t.is_recurring
          ? 'set start + end on sheet'
          : '';

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
        onDoubleClick={isManageMode ? () => openEdit(t) : undefined}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="truncate text-sm font-medium text-card-foreground">{t.template_name}</p>
            {t.is_recurring && cadence ? (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-normal">
                Recurring · {cadence}
              </Badge>
            ) : null}
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {t.work_order_type_name ?? 'Type not set'}
            {subtitleExtra ? ` · ${subtitleExtra}` : ''}
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
  };

  const renderListBody = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
        </div>
      );
    }

    if (sortedTemplates.length === 0) {
      return renderEmptyState();
    }

    if (filteredTemplates.length === 0) {
      return (
        <div className="flex items-center justify-center px-4 py-10 text-sm text-muted-foreground">
          No templates match your search
        </div>
      );
    }

    return (
      <div className="divide-y divide-border">
        {showNoTemplateCard ? noTemplateCard : null}
        {filteredTemplates.map(renderTemplateRow)}
      </div>
    );
  };

  const confirmLabel = highlightNone ? 'Continue without template' : 'Use template';

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex h-[min(70vh,640px)] w-[min(48rem,94vw)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none">
          {isManageMode ? (
            <>
              <DialogHeader className="shrink-0 space-y-1 border-b border-border py-4 pl-6 pr-14">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <DialogTitle className="flex items-center gap-2 text-base">
                      <LayoutTemplate className="h-4 w-4 shrink-0 text-muted-foreground" />
                      {dialogTitle}
                    </DialogTitle>
                    <DialogDescription>{dialogDescription}</DialogDescription>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="bg-brand-primary hover:bg-brand-primary-hover"
                    onClick={openCreate}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    New template
                  </Button>
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
                <div className="flex min-h-0 flex-1 flex-col gap-3 md:grid md:grid-cols-[minmax(0,1.1fr)_minmax(14rem,22rem)] md:gap-3">
                  <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-border md:min-h-[12rem]">
                    {renderListBody()}
                  </div>
                  <WorkOrderTemplatePreviewPanel
                    template={highlighted}
                    context="manage"
                    machines={machines}
                    sections={sections}
                    className="max-h-[min(40vh,16rem)] shrink-0 md:max-h-none md:min-h-[12rem]"
                  />
                </div>
              </div>

              <DialogFooter className="flex shrink-0 flex-col gap-3 border-t border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  {highlighted
                    ? `Selected: ${highlighted.template_name}`
                    : 'Create, edit, or deactivate templates.'}
                </p>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader className="shrink-0 space-y-1 border-b border-border py-4 pl-6 pr-14">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <DialogTitle className="flex items-center gap-2 text-base">
                      <LayoutTemplate className="h-4 w-4 shrink-0 text-muted-foreground" />
                      {dialogTitle}
                    </DialogTitle>
                    <DialogDescription>{dialogDescription}</DialogDescription>
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
                          <p className="mb-2 text-xs text-muted-foreground">Name this template from your current form.</p>
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
                      onClick={openCreate}
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

                <div className="flex min-h-0 flex-1 flex-col gap-3 md:grid md:grid-cols-[minmax(0,1.1fr)_minmax(14rem,22rem)] md:gap-3">
                  <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-border md:min-h-[12rem]">
                    {renderListBody()}
                  </div>
                  <WorkOrderTemplatePreviewPanel
                    template={highlightNone ? null : highlighted}
                    highlightNone={highlightNone}
                    context="pick"
                    machines={machines}
                    sections={sections}
                    className="max-h-[min(40vh,16rem)] shrink-0 md:max-h-none md:min-h-[12rem]"
                  />
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
                      {highlighted.is_recurring ? (
                        <span className="text-muted-foreground"> · First save schedules drafts in range</span>
                      ) : null}
                    </>
                  ) : (
                    <>Select a template, then confirm below.</>
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
                    {confirmLabel}
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
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
