import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Clock, LogOut, Settings, type LucideIcon } from 'lucide-react';
import { appToast } from '@/lib/appToast';

import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import GeneralSettingsPanel from '@/components/newcomponents/customui/settings/GeneralSettingsPanel';
import WorkspaceShiftsSettingsPanel from '@/components/newcomponents/customui/settings/WorkspaceShiftsSettingsPanel';
import { avatarColor, initialsOf } from '@/components/newcomponents/customui/orders/transferOrderApprovals';
import { logout } from '@/features/auth/authSlice';
import { useLogoutMutation } from '@/features/auth/authApi';
import { cn } from '@/lib/utils';
import type { SettingsSectionId } from '@/context/SettingsModalContext';

type SettingsNavItem = {
  id: SettingsSectionId;
  label: string;
  icon: LucideIcon;
  visible?: boolean;
};

const getNavItems = (t: (key: string) => string): SettingsNavItem[] => [
  { id: 'general', label: t('general'), icon: Settings, visible: true },
  { id: 'shifts', label: t('shifts'), icon: Clock, visible: true },
];

export interface UserSettingsModalProps {
  isOpen: boolean;
  activeSection: SettingsSectionId;
  closeSettings: () => void;
  setActiveSection: (section: SettingsSectionId) => void;
}

const UserSettingsModal: React.FC<UserSettingsModalProps> = ({
  isOpen,
  activeSection,
  closeSettings,
  setActiveSection,
}) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const workspace = useAppSelector((state) => state.auth.workspace);
  const [triggerLogout] = useLogoutMutation();

  const { t: tc } = useTranslation('common');
  const { t: ts } = useTranslation('settings');
  const visibleNavItems = useMemo(
    () =>
      getNavItems(tc).filter((item) => {
        if (item.id === 'shifts') return workspace?.role === 'owner';
        return item.visible !== false;
      }),
    [workspace?.role, tc],
  );

  const handleLogout = async () => {
    closeSettings();
    try {
      await triggerLogout({}).unwrap();
    } catch {
      dispatch(logout());
    }
    appToast.success(tc('loggedOutSuccess'));
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeSettings()}>
      <DialogContent className="flex h-[66vh] max-h-[66vh] w-[min(56rem,94vw)] max-w-none flex-col overflow-hidden p-0 gap-0">
        <DialogHeader className="shrink-0 space-y-0 border-b px-6 py-4 text-left">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white',
                avatarColor(user.id)
              )}
            >
              {initialsOf(user.name)}
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base">{ts('settingsTitle')}</DialogTitle>
              <DialogDescription className="truncate">
                {user.name} · {user.email}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex min-h-0 flex-1">
          <nav
            className="w-48 shrink-0 overflow-y-auto border-r bg-muted/20 p-2"
            aria-label="Settings sections"
          >
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors',
                    isActive
                      ? 'bg-brand-primary/10 font-medium text-brand-primary'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  )}
                >
                  <Icon size={16} className="shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="min-h-0 flex-1 overflow-y-auto p-6">
            {activeSection === 'general' && <GeneralSettingsPanel />}
            {activeSection === 'shifts' && <WorkspaceShiftsSettingsPanel />}
          </div>
        </div>

        <DialogFooter className="shrink-0 border-t px-6 py-3 sm:justify-start">
          <Button type="button" variant="destructive" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            {tc('logOut')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserSettingsModal;
