import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import UserSettingsModal from '@/components/newcomponents/customui/UserSettingsModal';

export type SettingsSectionId = 'general';

interface SettingsModalContextValue {
  isOpen: boolean;
  activeSection: SettingsSectionId;
  openSettings: (section?: SettingsSectionId) => void;
  closeSettings: () => void;
  setActiveSection: (section: SettingsSectionId) => void;
}

const SettingsModalContext = createContext<SettingsModalContextValue | undefined>(undefined);

export function SettingsModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<SettingsSectionId>('general');

  const openSettings = useCallback((section: SettingsSectionId = 'general') => {
    setActiveSection(section);
    setIsOpen(true);
  }, []);

  const closeSettings = useCallback(() => {
    setIsOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      isOpen,
      activeSection,
      openSettings,
      closeSettings,
      setActiveSection,
    }),
    [isOpen, activeSection, openSettings, closeSettings]
  );

  return (
    <SettingsModalContext.Provider value={value}>
      {children}
      <UserSettingsModal />
    </SettingsModalContext.Provider>
  );
}

export function useSettingsModal(): SettingsModalContextValue {
  const ctx = useContext(SettingsModalContext);
  if (!ctx) {
    throw new Error('useSettingsModal must be used within SettingsModalProvider');
  }
  return ctx;
}
