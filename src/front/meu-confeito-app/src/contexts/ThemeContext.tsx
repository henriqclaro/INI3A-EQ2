import { ReactNode, createContext, useContext, useState } from 'react';

import { AppTheme, lightTheme } from '../theme/themes';

export type ThemeMode = 'light';

interface ThemeContextType {
  theme: AppTheme;
  currentMode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');

  const theme = {
    light: lightTheme,
  }[themeMode];

  return (
    <ThemeContext.Provider value={{ theme, currentMode: themeMode, setMode: setThemeMode }}>
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
