import React from 'react';
import WorkOrdersDateFilterControls from '@/components/newcomponents/customui/orders/WorkOrdersDateFilterControls';
import {
  normalizeProductionScheduleWeekAnchor,
  productionScheduleWeekPeriodLabel,
} from '@/components/newcomponents/customui/production/productionScheduleWeek';

export interface ProductionScheduleWeekPickerProps {
  weekAnchorIso: string;
  onWeekAnchorChange: (iso: string) => void;
  planCountByDate?: Record<string, number>;
  calendarMonth?: Date;
  onCalendarMonthChange?: (month: Date) => void;
  className?: string;
}

const ProductionScheduleWeekPicker: React.FC<ProductionScheduleWeekPickerProps> = ({
  weekAnchorIso,
  onWeekAnchorChange,
  planCountByDate,
  calendarMonth,
  onCalendarMonthChange,
  className,
}) => {
  const weekPeriodLabel = productionScheduleWeekPeriodLabel(weekAnchorIso);

  return (
    <WorkOrdersDateFilterControls
      visibleModes={['week']}
      dateViewMode="week"
      sheetDate={weekAnchorIso}
      weekPeriodLabel={weekPeriodLabel}
      onDateViewModeChange={() => {}}
      onPickDate={() => {}}
      onPickWeek={(iso) => onWeekAnchorChange(normalizeProductionScheduleWeekAnchor(iso))}
      orderCountByDate={planCountByDate}
      calendarMonth={calendarMonth}
      onCalendarMonthChange={onCalendarMonthChange}
      className={className}
    />
  );
};

export default ProductionScheduleWeekPicker;
