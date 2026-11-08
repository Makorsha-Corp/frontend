import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import DateTimePickerField from '@/components/newcomponents/customui/DateTimePickerField';

export interface ProductionStartEarlierFieldsProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  value: string;
  onChange: (value: string) => void;
  idPrefix: string;
  disabled?: boolean;
}

const ProductionStartEarlierFields: React.FC<ProductionStartEarlierFieldsProps> = ({
  enabled,
  onEnabledChange,
  value,
  onChange,
  idPrefix,
  disabled,
}) => (
  <div className="space-y-2 rounded-md border border-border/80 bg-muted/20 p-3">
    <div className="flex items-center gap-2">
      <Checkbox
        id={`${idPrefix}-started-earlier`}
        checked={enabled}
        onCheckedChange={(v) => onEnabledChange(v === true)}
        disabled={disabled}
      />
      <Label htmlFor={`${idPrefix}-started-earlier`} className="cursor-pointer text-sm font-normal">
        Started earlier
      </Label>
    </div>
    {enabled ? (
      <DateTimePickerField
        id={`${idPrefix}-started-at`}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full max-w-none"
        triggerClassName="w-full"
        aria-label="Actual start time"
      />
    ) : null}
  </div>
);

export default ProductionStartEarlierFields;
