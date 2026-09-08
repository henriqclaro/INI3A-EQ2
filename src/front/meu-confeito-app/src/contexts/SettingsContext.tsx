import { ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react';

import { HapticFeedbackType, setGlobalHapticsEnabled, triggerGlobalHaptic } from '../utils/haptics';
import { Storage } from '../utils/storage';

export interface SettingsContextData {
  isSwipeNavigationEnabled: boolean;
  isHapticsEnabled: boolean;
  isLoadingSettings: boolean;
  setIsSwipeNavigationEnabled: (isEnabled: boolean) => void;
  toggleSwipeNavigation: () => void;
  setIsHapticsEnabled: (isEnabled: boolean) => void;
  toggleHaptics: () => void;
  triggerHaptic: (type?: HapticFeedbackType) => void;
}

const SWIPE_NAV_STORAGE_KEY = 'settings_swipe_nav_enabled';
const HAPTICS_STORAGE_KEY = 'settings_haptics_enabled';

const SettingsContext = createContext<SettingsContextData>({} as SettingsContextData);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [isSwipeNavigationEnabled, setIsSwipeNavigationEnabledState] = useState(true);
  const [isHapticsEnabled, setIsHapticsEnabledState] = useState(true);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  useEffect(() => {
    async function loadStoredSettings() {
      try {
        const [storedSwipe, storedHaptics] = await Promise.all([
          Storage.getItem(SWIPE_NAV_STORAGE_KEY),
          Storage.getItem(HAPTICS_STORAGE_KEY),
        ]);

        if (storedSwipe !== null) {
          setIsSwipeNavigationEnabledState(storedSwipe === 'true');
        }

        if (storedHaptics !== null) {
          const isHapticsActive = storedHaptics === 'true';
          setIsHapticsEnabledState(isHapticsActive);
          setGlobalHapticsEnabled(isHapticsActive);
        }
      } catch (error) {
        console.error('Error loading stored interaction settings:', error);
      } finally {
        setIsLoadingSettings(false);
      }
    }

    loadStoredSettings();
  }, []);

  const handleSetSwipeNavigationEnabled = useCallback((isEnabled: boolean) => {
    setIsSwipeNavigationEnabledState(isEnabled);
    Storage.setItem(SWIPE_NAV_STORAGE_KEY, String(isEnabled)).catch((error) => {
      console.error('Error saving swipe navigation setting:', error);
    });
  }, []);

  const handleSetHapticsEnabled = useCallback((isEnabled: boolean) => {
    setIsHapticsEnabledState(isEnabled);
    setGlobalHapticsEnabled(isEnabled);
    Storage.setItem(HAPTICS_STORAGE_KEY, String(isEnabled)).catch((error) => {
      console.error('Error saving haptics setting:', error);
    });
  }, []);

  const toggleSwipeNavigation = useCallback(() => {
    handleSetSwipeNavigationEnabled(!isSwipeNavigationEnabled);
  }, [handleSetSwipeNavigationEnabled, isSwipeNavigationEnabled]);

  const toggleHaptics = useCallback(() => {
    const isNextEnabled = !isHapticsEnabled;
    handleSetHapticsEnabled(isNextEnabled);
    if (isNextEnabled) {
      triggerGlobalHaptic('selection');
    }
  }, [handleSetHapticsEnabled, isHapticsEnabled]);

  const triggerHaptic = useCallback((type: HapticFeedbackType = 'selection') => {
    triggerGlobalHaptic(type);
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        isSwipeNavigationEnabled,
        isHapticsEnabled,
        isLoadingSettings,
        setIsSwipeNavigationEnabled: handleSetSwipeNavigationEnabled,
        toggleSwipeNavigation,
        setIsHapticsEnabled: handleSetHapticsEnabled,
        toggleHaptics,
        triggerHaptic,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextData {
  const context = useContext(SettingsContext);

  if (!context || context.isSwipeNavigationEnabled === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }

  return context;
}
