import React from 'react';
import DashboardNavbar from '@/components/newcomponents/customui/DashboardNavbar';
import { Toaster } from 'react-hot-toast';
import WorkOrdersPageContent from './WorkOrdersPageContent';

const WorkOrdersPage: React.FC = () => (
  <div className="flex h-screen bg-background overflow-hidden">
    <Toaster position="top-right" />
    <DashboardNavbar />
    <WorkOrdersPageContent />
  </div>
);

export default WorkOrdersPage;
