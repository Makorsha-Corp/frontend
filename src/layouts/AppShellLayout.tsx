import { Outlet } from 'react-router-dom';
import DashboardNavbar from '@/components/newcomponents/customui/DashboardNavbar';

export default function AppShellLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardNavbar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
