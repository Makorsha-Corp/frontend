import React, { useMemo, useState } from 'react';
import { Label } from '@/components/ui/label';
import type { WorkOrderTemplate } from '@/types/workOrderTemplate';
import type { Machine } from '@/types/machine';
import type { FactorySection } from '@/types/factorySection';
import { WorkOrderTemplateSelectSummaryButton } from './WorkOrderTemplateSelectSummaryButton';
import WorkOrderTemplateSelectorDialog from './WorkOrderTemplateSelectorDialog';

export interface WorkOrderTemplateSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  templates: WorkOrderTemplate[];
  disabled?: boolean;
  loading?: boolean;
  compact?: boolean;
  label?: string;
  showHint?: boolean;
  className?: string;
  dialogTitle?: string;
  dialogDescription?: string;
  onSaveFromForm?: (name: string) => Promise<void>;
  canSaveFromForm?: boolean;
  defaultSectionId?: number | null;
  defaultMachineId?: number | null;
  machines?: Machine[];
  sections?: FactorySection[];
}

const WorkOrderTemplateSelector: React.FC<WorkOrderTemplateSelectorProps> = ({
  value,
  onValueChange,
  templates,
  disabled = false,
  loading = false,
  compact = false,
  label = 'Template',
  showHint = false,
  className,
  dialogTitle,
  dialogDescription,
  onSaveFromForm,
  canSaveFromForm,
  defaultSectionId,
  defaultMachineId,
  machines,
  sections,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const activeTemplates = useMemo(() => templates.filter((t) => t.is_active), [templates]);
  const selectedTemplate = activeTemplates.find((t) => String(t.id) === value);

  const handleSelect = (template: WorkOrderTemplate | null) => {
    if (!template) {
      onValueChange('__none__');
      return;
    }
    onValueChange(String(template.id));
  };

  const wrapperClass = className ?? (compact ? 'grid gap-1' : 'space-y-1.5');

  return (
    <div className={wrapperClass}>
      <Label
        className={
          compact
            ? 'text-xs text-muted-foreground'
            : 'text-xs font-semibold uppercase tracking-wide text-muted-foreground'
        }
      >
        {label}
      </Label>
      <WorkOrderTemplateSelectSummaryButton
        onClick={() => setDialogOpen(true)}
        ariaLabel={
          selectedTemplate
            ? `Change template. Current: ${selectedTemplate.template_name}`
            : 'Select template'
        }
        selectedName={selectedTemplate?.template_name ?? 'No template'}
        compactLabel={compact}
        className={compact ? 'h-9 text-sm' : 'min-h-10'}
        disabled={disabled}
        loading={loading}
      />
      {showHint && selectedTemplate && (
        <p className="text-xs text-muted-foreground">
          Prefilled from &quot;{selectedTemplate.template_name}&quot;
          {!compact ? ' — review and adjust anything below before creating.' : ''}
        </p>
      )}
      <WorkOrderTemplateSelectorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSelect={handleSelect}
        selectedTemplateId={value || undefined}
        title={dialogTitle}
        description={dialogDescription}
        onSaveFromForm={onSaveFromForm}
        canSaveFromForm={canSaveFromForm}
        defaultSectionId={defaultSectionId}
        defaultMachineId={defaultMachineId}
        machines={machines}
        sections={sections}
      />
    </div>
  );
};

export default WorkOrderTemplateSelector;
