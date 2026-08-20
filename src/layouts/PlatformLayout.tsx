import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { ClipboardList, LifeBuoy, Shield } from 'lucide-react';

import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Support', path: '/platform/support', icon: LifeBuoy },
  { name: 'Waitlist', path: '/platform/waitlist', icon: ClipboardList },
] as const;

const PlatformLayout: React.FC = () => {
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border px-4 py-4">
          <Shield className="h-5 w-5 text-brand-primary" />
          <div>
            <p className="text-sm font-semibold">Platform</p>
            <p className="text-xs text-muted-foreground">Makorsha admin</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {navItems.map(({ name, path, icon: Icon }) => {
            const active = location.pathname === path || location.pathname.startsWith(`${path}/`);
            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                  active
                    ? 'bg-brand-primary text-white'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {name}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3">
          <Link
            to="/dashboard"
            className="block rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Back to ERP
          </Link>
        </div>
      </aside>
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
};

export default PlatformLayout;
