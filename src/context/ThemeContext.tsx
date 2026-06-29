import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  originFromMouseEvent,
  runThemeTransition,
} from '@/lib/themeTransition';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  iconAnimating: boolean;
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

  useEffect(() => {
    applyThemeToDocument(theme);
  }, []);

  const runWithTransition = useCallback(
    (nextTheme: Theme, event?: React.MouseEvent | MouseEvent) => {
      const apply = () => {
        setThemeState(nextTheme);
        applyThemeToDocument(nextTheme);
      };

      const { animateIcon } = runThemeTransition(apply, {
        origin: originFromMouseEvent(event),
      });

      if (animateIcon) {
        setIconAnimating(true);
        window.setTimeout(() => setIconAnimating(false), 400);
      }
    },
    []
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
    <ThemeContext.Provider value={{ theme, iconAnimating, toggleTheme, setTheme }}>
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
