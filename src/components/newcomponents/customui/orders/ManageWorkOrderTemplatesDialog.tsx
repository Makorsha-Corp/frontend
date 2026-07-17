import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  useGetWorkOrderTemplatesQuery,
  useDeleteWorkOrderTemplateMutation,
  useRestoreWorkOrderTemplateMutation,
} from '@/features/workOrderTemplates/workOrderTemplatesApi';
import type { WorkOrderTemplate } from '@/types/workOrderTemplate';
import { API_LIMITS } from '@/constants/apiLimits';
import { LayoutTemplate, Loader2, Pencil, Plus, ShieldCheck, RotateCcw, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import CreateEditWorkOrderTemplateDialog from './CreateEditWorkOrderTemplateDialog';

export interface ManageWorkOrderTemplatesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ManageWorkOrderTemplatesDialog: React.FC<ManageWorkOrderTemplatesDialogProps> = ({ open, onOpenChange }) => {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WorkOrderTemplate | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const { data: activeTemplates = [], isLoading: loadingActive } = useGetWorkOrderTemplatesQuery(
    { is_active: true, limit: API_LIMITS.FLEXIBLE_1000 },
    { skip: !open }
  );
  const { data: inactiveTemplates = [], isLoading: loadingInactive } = useGetWorkOrderTemplatesQuery(
    { is_active: false, limit: API_LIMITS.FLEXIBLE_1000 },
    { skip: !open }
  );

  const [deactivateTemplate] = useDeleteWorkOrderTemplateMutation();
  const [restoreTemplate] = useRestoreWorkOrderTemplateMutation();

  const templates = [...activeTemplates, ...inactiveTemplates];
  const isLoading = loadingActive || loadingInactive;

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
      toast.success(`${t.template_name} deactivated`);
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to deactivate template');
    } finally {
      setBusyId(null);
    }
  };

  const handleReactivate = async (t: WorkOrderTemplate) => {
    setBusyId(t.id);
    try {
      await restoreTemplate(t.id).unwrap();
      toast.success(`${t.template_name} reactivated`);
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to reactivate template');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex h-[70vh] max-h-[70vh] w-[min(48rem,94vw)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none">
          <DialogHeader className="shrink-0 space-y-1 border-b border-border px-6 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <DialogTitle className="flex items-center gap-2 text-base">
                  <LayoutTemplate className="h-4 w-4 text-muted-foreground" />
                  Manage Work Order Templates
                </DialogTitle>
                <DialogDescription>Reusable presets for maintenance that happens all the time.</DialogDescription>
              </div>
              <Button type="button" size="sm" className="bg-brand-primary hover:bg-brand-primary-hover" onClick={openCreate}>
                <Plus className="mr-1 h-4 w-4" />
                New Template
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
              </div>
            ) : templates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <LayoutTemplate className="mb-3 h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No templates yet</p>
                <Button type="button" className="mt-4 bg-brand-primary hover:bg-brand-primary-hover" onClick={openCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Template
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {templates.map((t) => {
                  const busy = busyId === t.id;
                  return (
                    <div
                      key={t.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium text-card-foreground">{t.template_name}</p>
                          {!t.is_active && (
                            <Badge variant="outline" className="shrink-0 text-muted-foreground">
                              Inactive
                            </Badge>
                          )}
                          {t.requires_approval && (
                            <Badge variant="outline" className="shrink-0 gap-1 text-sky-600 border-sky-600/30">
                              <ShieldCheck className="h-3 w-3" />
                              Requires approval
                            </Badge>
                          )}
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {t.work_order_type_name ?? 'Type not set'}
                          {t.description ? ` · ${t.description}` : ''}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
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
                        {t.is_active ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            disabled={busy}
                            onClick={() => handleDeactivate(t)}
                            title="Deactivate template"
                          >
                            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-green-600"
                            disabled={busy}
                            onClick={() => handleReactivate(t)}
                            title="Reactivate template"
                          >
                            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <CreateEditWorkOrderTemplateDialog
        open={editorOpen}
        onOpenChange={(next) => {
          setEditorOpen(next);
          if (!next) setEditingTemplate(null);
        }}
        template={editingTemplate}
      />
    </>
  );
};

export default ManageWorkOrderTemplatesDialog;
