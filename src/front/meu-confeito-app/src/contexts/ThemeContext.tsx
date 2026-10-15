import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';

import {
  AppTheme,
  darkTheme,
  highContrastDarkTheme,
  highContrastLightTheme,
  lightTheme,
  oledDarkTheme,
} from '../theme/themes';
import { Storage } from '../utils/storage';

export type ThemeMode = 'light' | 'dark';

export interface ThemeContextType {
  theme: AppTheme;
  currentMode: ThemeMode;
  isDarkMode: boolean;
  isFollowSystem: boolean;
  isHighContrast: boolean;
  isPureBlack: boolean;
  isPureBlackAvailable: boolean;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  setIsFollowSystem: (isEnabled: boolean) => void;
  toggleFollowSystem: () => void;
  setIsHighContrast: (isEnabled: boolean) => void;
  toggleHighContrast: () => void;
  setIsPureBlack: (isEnabled: boolean) => void;
  togglePureBlack: () => void;
}

const THEME_STORAGE_KEY = 'theme_mode';
const HIGH_CONTRAST_STORAGE_KEY = 'theme_high_contrast';
const PURE_BLACK_STORAGE_KEY = 'theme_pure_black';
const FOLLOW_SYSTEM_STORAGE_KEY = 'theme_follow_system';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();

  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [isFollowSystem, setIsFollowSystemState] = useState<boolean>(true);
  const [isHighContrast, setIsHighContrastState] = useState<boolean>(false);
  const [isPureBlack, setIsPureBlackState] = useState<boolean>(false);

  useEffect(() => {
    async function loadStoredTheme() {
      try {
        const [storedTheme, storedHighContrast, storedPureBlack, storedFollowSystem] =
          await Promise.all([
            Storage.getItem(THEME_STORAGE_KEY),
            Storage.getItem(HIGH_CONTRAST_STORAGE_KEY),
            Storage.getItem(PURE_BLACK_STORAGE_KEY),
            Storage.getItem(FOLLOW_SYSTEM_STORAGE_KEY),
          ]);

        if (storedTheme === 'dark' || storedTheme === 'light') {
          setThemeMode(storedTheme);
        }
        if (storedHighContrast !== null) {
          setIsHighContrastState(storedHighContrast === 'true');
        }
        if (storedPureBlack !== null) {
          setIsPureBlackState(storedPureBlack === 'true');
        }
        if (storedFollowSystem !== null) {
          setIsFollowSystemState(storedFollowSystem === 'true');
        } else {
          // Default is true when no preference is saved yet
          setIsFollowSystemState(true);
        }
      } catch (error) {
        console.error('Error loading stored theme mode:', error);
      }
    }

    loadStoredTheme();
  }, []);

  const handleSetMode = useCallback((mode: ThemeMode) => {
    // Automatically disable follow system when user explicitly selects a theme
    setIsFollowSystemState(false);
    Storage.setItem(FOLLOW_SYSTEM_STORAGE_KEY, 'false').catch((error) => {
      console.error('Error saving follow system mode to storage:', error);
    });

    setThemeMode(mode);
    Storage.setItem(THEME_STORAGE_KEY, mode).catch((error) => {
      console.error('Error saving theme mode to storage:', error);
    });
  }, []);

  const toggleTheme = useCallback(() => {
    // Automatically disable follow system when user explicitly toggles theme
    setIsFollowSystemState(false);
    Storage.setItem(FOLLOW_SYSTEM_STORAGE_KEY, 'false').catch((error) => {
      console.error('Error saving follow system mode to storage:', error);
    });

    setThemeMode((prev) => {
      const activeMode: ThemeMode = isFollowSystem
        ? systemColorScheme === 'dark'
          ? 'dark'
          : 'light'
        : prev;
      const nextMode: ThemeMode = activeMode === 'dark' ? 'light' : 'dark';
      Storage.setItem(THEME_STORAGE_KEY, nextMode).catch((error) => {
        console.error('Error saving theme mode to storage:', error);
      });
      return nextMode;
    });
  }, [isFollowSystem, systemColorScheme]);

  const handleSetFollowSystem = useCallback((isEnabled: boolean) => {
    setIsFollowSystemState(isEnabled);
    Storage.setItem(FOLLOW_SYSTEM_STORAGE_KEY, String(isEnabled)).catch((error) => {
      console.error('Error saving follow system mode to storage:', error);
    });
  }, []);

  const toggleFollowSystem = useCallback(() => {
    setIsFollowSystemState((prev) => {
      const isNextValue = !prev;
      Storage.setItem(FOLLOW_SYSTEM_STORAGE_KEY, String(isNextValue)).catch((error) => {
        console.error('Error saving follow system mode to storage:', error);
      });
      return isNextValue;
    });
  }, []);

  const handleSetHighContrast = useCallback((isEnabled: boolean) => {
    setIsHighContrastState(isEnabled);
    Storage.setItem(HIGH_CONTRAST_STORAGE_KEY, String(isEnabled)).catch((error) => {
      console.error('Error saving high contrast mode to storage:', error);
    });
  }, []);

  const toggleHighContrast = useCallback(() => {
    setIsHighContrastState((prev) => {
      const isNextValue = !prev;
      Storage.setItem(HIGH_CONTRAST_STORAGE_KEY, String(isNextValue)).catch((error) => {
        console.error('Error saving high contrast mode to storage:', error);
      });
      return isNextValue;
    });
  }, []);

  const handleSetPureBlack = useCallback((isEnabled: boolean) => {
    setIsPureBlackState(isEnabled);
    Storage.setItem(PURE_BLACK_STORAGE_KEY, String(isEnabled)).catch((error) => {
      console.error('Error saving pure black mode to storage:', error);
    });
  }, []);

  const togglePureBlack = useCallback(() => {
    setIsPureBlackState((prev) => {
      const isNextValue = !prev;
      Storage.setItem(PURE_BLACK_STORAGE_KEY, String(isNextValue)).catch((error) => {
        console.error('Error saving pure black mode to storage:', error);
      });
      return isNextValue;
    });
  }, []);

  const effectiveMode: ThemeMode = isFollowSystem
    ? systemColorScheme === 'dark'
      ? 'dark'
      : 'light'
    : themeMode;

  const isDarkMode = effectiveMode === 'dark';
  const isPureBlackAvailable = isDarkMode && !isHighContrast;

  const theme = useMemo(() => {
    if (isHighContrast) {
      return isDarkMode ? highContrastDarkTheme : highContrastLightTheme;
    }
    if (isDarkMode && isPureBlack) {
      return oledDarkTheme;
    }
    return isDarkMode ? darkTheme : lightTheme;
  }, [isDarkMode, isHighContrast, isPureBlack]);

  const contextValue = useMemo(
    () => ({
      theme,
      currentMode: effectiveMode,
      isDarkMode,
      isFollowSystem,
      isHighContrast,
      isPureBlack,
      isPureBlackAvailable,
      setMode: handleSetMode,
      toggleTheme,
      setIsFollowSystem: handleSetFollowSystem,
      toggleFollowSystem,
      setIsHighContrast: handleSetHighContrast,
      toggleHighContrast,
      setIsPureBlack: handleSetPureBlack,
      togglePureBlack,
    }),
    [
      theme,
      effectiveMode,
      isDarkMode,
      isFollowSystem,
      isHighContrast,
      isPureBlack,
      isPureBlackAvailable,
      handleSetMode,
      toggleTheme,
      handleSetFollowSystem,
      toggleFollowSystem,
      handleSetHighContrast,
      toggleHighContrast,
      handleSetPureBlack,
      togglePureBlack,
    ],
  );

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
}

export function useThemeMode() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}
