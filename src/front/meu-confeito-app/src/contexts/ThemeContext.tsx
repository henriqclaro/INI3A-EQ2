import { ReactNode, createContext, useContext, useEffect, useState } from 'react';

import { AppTheme, darkTheme, lightTheme } from '../theme/themes';
import { Storage } from '../utils/storage';

export type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  theme: AppTheme;
  currentMode: ThemeMode;
  isDarkMode: boolean;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const THEME_STORAGE_KEY = 'theme_mode';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');

  useEffect(() => {
    async function loadStoredTheme() {
      try {
        const storedTheme = await Storage.getItem(THEME_STORAGE_KEY);
        if (storedTheme === 'dark' || storedTheme === 'light') {
          setThemeMode(storedTheme);
        }
      } catch (error) {
        console.error('Error loading stored theme mode:', error);
      }
    }

    loadStoredTheme();
  }, []);

  const handleSetMode = (mode: ThemeMode) => {
    setThemeMode(mode);
    Storage.setItem(THEME_STORAGE_KEY, mode).catch((error) => {
      console.error('Error saving theme mode to storage:', error);
    });
  };

  const toggleTheme = () => {
    const nextMode: ThemeMode = themeMode === 'dark' ? 'light' : 'dark';
    handleSetMode(nextMode);
  };

  const isDarkMode = themeMode === 'dark';
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        currentMode: themeMode,
        isDarkMode,
        setMode: handleSetMode,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeMode() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}
