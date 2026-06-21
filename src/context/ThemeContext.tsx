import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  originFromMouseEvent,
  parseStoredTransitionMode,
  runThemeTransition,
  THEME_TRANSITION_STORAGE_KEY,
  type ThemeTransitionMode,
} from '@/lib/themeTransition';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  iconAnimating: boolean;
  transitionMode: ThemeTransitionMode;
  cycleTransitionMode: () => void;
  toggleTheme: (event?: React.MouseEvent | MouseEvent) => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function applyThemeToDocument(nextTheme: Theme): void {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(nextTheme);
  localStorage.setItem('theme', nextTheme);
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    return savedTheme || 'light';
  });
  const [iconAnimating, setIconAnimating] = useState(false);
  const [transitionMode, setTransitionMode] = useState<ThemeTransitionMode>(() =>
    parseStoredTransitionMode(localStorage.getItem(THEME_TRANSITION_STORAGE_KEY))
  );

  useEffect(() => {
    applyThemeToDocument(theme);
  }, []);

  const cycleTransitionMode = useCallback(() => {
    setTransitionMode((current) => {
      const next = current === 'wipe' ? 'icon' : 'wipe';
      localStorage.setItem(THEME_TRANSITION_STORAGE_KEY, next);
      return next;
    });
  }, []);

  const runWithTransition = useCallback(
    (nextTheme: Theme, event?: React.MouseEvent | MouseEvent) => {
      const apply = () => {
        setThemeState(nextTheme);
        applyThemeToDocument(nextTheme);
      };

      const { animateIcon } = runThemeTransition(apply, {
        origin: originFromMouseEvent(event),
        mode: transitionMode,
      });

      if (animateIcon) {
        setIconAnimating(true);
        window.setTimeout(() => setIconAnimating(false), 400);
      }
    },
    [transitionMode]
  );

  const toggleTheme = useCallback(
    (event?: React.MouseEvent | MouseEvent) => {
      const nextTheme: Theme = theme === 'light' ? 'dark' : 'light';
      runWithTransition(nextTheme, event);
    },
    [theme, runWithTransition]
  );

  const setTheme = useCallback(
    (newTheme: Theme) => {
      if (newTheme === theme) return;
      runWithTransition(newTheme);
    },
    [theme, runWithTransition]
  );

  return (
    <ThemeContext.Provider
      value={{ theme, iconAnimating, transitionMode, cycleTransitionMode, toggleTheme, setTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
