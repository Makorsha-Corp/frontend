import React from 'react';
import WorkOrdersUnifiedView from '@/pages/newpages/orders/WorkOrdersUnifiedView';

export interface WorkOrdersTabContentProps {
  sheetMachineId?: number | null;
  activeTab: 'machines' | 'workOrders';
  onTabChange: (tab: 'machines' | 'workOrders') => void;
}

const WorkOrdersTabContent: React.FC<WorkOrdersTabContentProps> = ({
  sheetMachineId,
  activeTab,
  onTabChange,
}) => (
  <WorkOrdersUnifiedView
    defaultMachineId={sheetMachineId ?? undefined}
    activeTab={activeTab}
    onTabChange={onTabChange}
  />
);

export default WorkOrdersTabContent;
