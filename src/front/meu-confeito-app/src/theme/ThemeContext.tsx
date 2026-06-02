import { ReactNode, createContext, useContext, useState } from 'react';

import { AppTheme, lightTheme } from './themes';

type ThemeMode = 'light';

interface ThemeContextType {
  theme: AppTheme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');

  const theme = {
    light: lightTheme,
  }[themeMode];

  return (
    <ThemeContext.Provider value={{ theme, themeMode, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}
