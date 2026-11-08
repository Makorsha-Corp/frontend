import { Outlet } from 'react-router-dom';
import DashboardNavbar from '@/components/newcomponents/customui/DashboardNavbar';
import { SettingsModalProvider } from '@/context/SettingsModalContext';

export default function AppShellLayout() {
  return (
    <SettingsModalProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <DashboardNavbar />
        <div className="relative z-0 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden isolate">
          <Outlet />
        </div>
      </div>
    </SettingsModalProvider>
  );
}
