import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { setGlobalPriceDecimalPlaces } from '../utils/formatters';
import { HapticFeedbackType, setGlobalHapticsEnabled, triggerGlobalHaptic } from '../utils/haptics';
import { Storage } from '../utils/storage';

export type PriceDecimalPlaces = 2 | 3 | 4;
export const DEFAULT_PRICE_DECIMAL_PLACES: PriceDecimalPlaces = 4;

export interface SettingsContextData {
  isSwipeNavigationEnabled: boolean;
  isHapticsEnabled: boolean;
  isLoadingSettings: boolean;
  setIsSwipeNavigationEnabled: (isEnabled: boolean) => void;
  toggleSwipeNavigation: () => void;
  setIsHapticsEnabled: (isEnabled: boolean) => void;
  toggleHaptics: () => void;
  triggerHaptic: (type?: HapticFeedbackType) => void;

  // Operational Preferences (Recipe default values & display precision)
  priceDecimalPlaces: PriceDecimalPlaces;
  setPriceDecimalPlaces: (places: PriceDecimalPlaces) => void;

  isDefaultOverheadEnabled: boolean;
  defaultOverhead: string;
  setIsDefaultOverheadEnabled: (isEnabled: boolean) => void;
  setDefaultOverhead: (value: string) => void;
  toggleDefaultOverhead: () => void;

  isDefaultProfitMarginEnabled: boolean;
  defaultProfitMargin: string;
  setIsDefaultProfitMarginEnabled: (isEnabled: boolean) => void;
  setDefaultProfitMargin: (value: string) => void;
  toggleDefaultProfitMargin: () => void;

  isDefaultHourlyLaborEnabled: boolean;
  defaultHourlyLabor: string;
  setIsDefaultHourlyLaborEnabled: (isEnabled: boolean) => void;
  setDefaultHourlyLabor: (value: string) => void;
  toggleDefaultHourlyLabor: () => void;

  isDefaultPackagingCostEnabled: boolean;
  defaultPackagingCost: string;
  setIsDefaultPackagingCostEnabled: (isEnabled: boolean) => void;
  setDefaultPackagingCost: (value: string) => void;
  toggleDefaultPackagingCost: () => void;
}

const SWIPE_NAV_STORAGE_KEY = 'settings_swipe_nav_enabled';
const HAPTICS_STORAGE_KEY = 'settings_haptics_enabled';

const PRICE_DECIMAL_PLACES_STORAGE_KEY = 'settings_price_decimal_places';

const DEFAULT_OVERHEAD_ENABLED_KEY = 'settings_default_overhead_enabled';
const DEFAULT_OVERHEAD_VALUE_KEY = 'settings_default_overhead_value';

const DEFAULT_PROFIT_MARGIN_ENABLED_KEY = 'settings_default_profit_margin_enabled';
const DEFAULT_PROFIT_MARGIN_VALUE_KEY = 'settings_default_profit_margin_value';

const DEFAULT_HOURLY_LABOR_ENABLED_KEY = 'settings_default_hourly_labor_enabled';
const DEFAULT_HOURLY_LABOR_VALUE_KEY = 'settings_default_hourly_labor_value';

const DEFAULT_PACKAGING_COST_ENABLED_KEY = 'settings_default_packaging_cost_enabled';
const DEFAULT_PACKAGING_COST_VALUE_KEY = 'settings_default_packaging_cost_value';

const SettingsContext = createContext<SettingsContextData>({} as SettingsContextData);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [isSwipeNavigationEnabled, setIsSwipeNavigationEnabledState] = useState(true);
  const [isHapticsEnabled, setIsHapticsEnabledState] = useState(true);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  // Operational Preferences States
  const [priceDecimalPlaces, setPriceDecimalPlacesState] = useState<PriceDecimalPlaces>(
    DEFAULT_PRICE_DECIMAL_PLACES,
  );

  const [isDefaultOverheadEnabled, setIsDefaultOverheadEnabledState] = useState(false);
  const [defaultOverhead, setDefaultOverheadState] = useState('');

  const [isDefaultProfitMarginEnabled, setIsDefaultProfitMarginEnabledState] = useState(false);
  const [defaultProfitMargin, setDefaultProfitMarginState] = useState('');

  const [isDefaultHourlyLaborEnabled, setIsDefaultHourlyLaborEnabledState] = useState(false);
  const [defaultHourlyLabor, setDefaultHourlyLaborState] = useState('');

  const [isDefaultPackagingCostEnabled, setIsDefaultPackagingCostEnabledState] = useState(false);
  const [defaultPackagingCost, setDefaultPackagingCostState] = useState('');

  useEffect(() => {
    async function loadStoredSettings() {
      try {
        const [
          storedSwipe,
          storedHaptics,
          storedOverheadEnabled,
          storedOverheadValue,
          storedProfitMarginEnabled,
          storedProfitMarginValue,
          storedHourlyLaborEnabled,
          storedHourlyLaborValue,
          storedPackagingCostEnabled,
          storedPackagingCostValue,
          storedPriceDecimalPlaces,
        ] = await Promise.all([
          Storage.getItem(SWIPE_NAV_STORAGE_KEY),
          Storage.getItem(HAPTICS_STORAGE_KEY),
          Storage.getItem(DEFAULT_OVERHEAD_ENABLED_KEY),
          Storage.getItem(DEFAULT_OVERHEAD_VALUE_KEY),
          Storage.getItem(DEFAULT_PROFIT_MARGIN_ENABLED_KEY),
          Storage.getItem(DEFAULT_PROFIT_MARGIN_VALUE_KEY),
          Storage.getItem(DEFAULT_HOURLY_LABOR_ENABLED_KEY),
          Storage.getItem(DEFAULT_HOURLY_LABOR_VALUE_KEY),
          Storage.getItem(DEFAULT_PACKAGING_COST_ENABLED_KEY),
          Storage.getItem(DEFAULT_PACKAGING_COST_VALUE_KEY),
          Storage.getItem(PRICE_DECIMAL_PLACES_STORAGE_KEY),
        ]);

        if (storedSwipe !== null) {
          setIsSwipeNavigationEnabledState(storedSwipe === 'true');
        }

        if (storedHaptics !== null) {
          const isHapticsActive = storedHaptics === 'true';
          setIsHapticsEnabledState(isHapticsActive);
          setGlobalHapticsEnabled(isHapticsActive);
        }

        if (storedPriceDecimalPlaces !== null) {
          const parsed = parseInt(storedPriceDecimalPlaces, 10);
          if (parsed === 2 || parsed === 3 || parsed === 4) {
            setPriceDecimalPlacesState(parsed);
            setGlobalPriceDecimalPlaces(parsed);
          }
        }

        if (storedOverheadEnabled !== null) {
          setIsDefaultOverheadEnabledState(storedOverheadEnabled === 'true');
        }
        if (storedOverheadValue !== null) {
          setDefaultOverheadState(storedOverheadValue);
        }

        if (storedProfitMarginEnabled !== null) {
          setIsDefaultProfitMarginEnabledState(storedProfitMarginEnabled === 'true');
        }
        if (storedProfitMarginValue !== null) {
          setDefaultProfitMarginState(storedProfitMarginValue);
        }

        if (storedHourlyLaborEnabled !== null) {
          setIsDefaultHourlyLaborEnabledState(storedHourlyLaborEnabled === 'true');
        }
        if (storedHourlyLaborValue !== null) {
          setDefaultHourlyLaborState(storedHourlyLaborValue);
        }

        if (storedPackagingCostEnabled !== null) {
          setIsDefaultPackagingCostEnabledState(storedPackagingCostEnabled === 'true');
        }
        if (storedPackagingCostValue !== null) {
          setDefaultPackagingCostState(storedPackagingCostValue);
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

  useEffect(() => {
    setGlobalHapticsEnabled(isHapticsEnabled);
  }, [isHapticsEnabled]);

  const triggerHaptic = useCallback(
    (type: HapticFeedbackType = 'selection') => {
      if (!isHapticsEnabled) {
        return;
      }
      triggerGlobalHaptic(type);
    },
    [isHapticsEnabled],
  );

  // Operational Preferences Handlers
  const handleSetPriceDecimalPlaces = useCallback((places: PriceDecimalPlaces) => {
    setPriceDecimalPlacesState(places);
    setGlobalPriceDecimalPlaces(places);
    Storage.setItem(PRICE_DECIMAL_PLACES_STORAGE_KEY, String(places)).catch((error) => {
      console.error('Error saving price decimal places setting:', error);
    });
  }, []);

  const handleSetDefaultOverheadEnabled = useCallback((isEnabled: boolean) => {
    setIsDefaultOverheadEnabledState(isEnabled);
    Storage.setItem(DEFAULT_OVERHEAD_ENABLED_KEY, String(isEnabled)).catch((error) => {
      console.error('Error saving default overhead enabled setting:', error);
    });
  }, []);

  const handleSetDefaultOverhead = useCallback((value: string) => {
    setDefaultOverheadState(value);
    Storage.setItem(DEFAULT_OVERHEAD_VALUE_KEY, value).catch((error) => {
      console.error('Error saving default overhead value setting:', error);
    });
  }, []);

  const toggleDefaultOverhead = useCallback(() => {
    handleSetDefaultOverheadEnabled(!isDefaultOverheadEnabled);
  }, [handleSetDefaultOverheadEnabled, isDefaultOverheadEnabled]);

  const handleSetDefaultProfitMarginEnabled = useCallback((isEnabled: boolean) => {
    setIsDefaultProfitMarginEnabledState(isEnabled);
    Storage.setItem(DEFAULT_PROFIT_MARGIN_ENABLED_KEY, String(isEnabled)).catch((error) => {
      console.error('Error saving default profit margin enabled setting:', error);
    });
  }, []);

  const handleSetDefaultProfitMargin = useCallback((value: string) => {
    setDefaultProfitMarginState(value);
    Storage.setItem(DEFAULT_PROFIT_MARGIN_VALUE_KEY, value).catch((error) => {
      console.error('Error saving default profit margin value setting:', error);
    });
  }, []);

  const toggleDefaultProfitMargin = useCallback(() => {
    handleSetDefaultProfitMarginEnabled(!isDefaultProfitMarginEnabled);
  }, [handleSetDefaultProfitMarginEnabled, isDefaultProfitMarginEnabled]);

  const handleSetDefaultHourlyLaborEnabled = useCallback((isEnabled: boolean) => {
    setIsDefaultHourlyLaborEnabledState(isEnabled);
    Storage.setItem(DEFAULT_HOURLY_LABOR_ENABLED_KEY, String(isEnabled)).catch((error) => {
      console.error('Error saving default hourly labor enabled setting:', error);
    });
  }, []);

  const handleSetDefaultHourlyLabor = useCallback((value: string) => {
    setDefaultHourlyLaborState(value);
    Storage.setItem(DEFAULT_HOURLY_LABOR_VALUE_KEY, value).catch((error) => {
      console.error('Error saving default hourly labor value setting:', error);
    });
  }, []);

  const toggleDefaultHourlyLabor = useCallback(() => {
    handleSetDefaultHourlyLaborEnabled(!isDefaultHourlyLaborEnabled);
  }, [handleSetDefaultHourlyLaborEnabled, isDefaultHourlyLaborEnabled]);

  const handleSetDefaultPackagingCostEnabled = useCallback((isEnabled: boolean) => {
    setIsDefaultPackagingCostEnabledState(isEnabled);
    Storage.setItem(DEFAULT_PACKAGING_COST_ENABLED_KEY, String(isEnabled)).catch((error) => {
      console.error('Error saving default packaging cost enabled setting:', error);
    });
  }, []);

  const handleSetDefaultPackagingCost = useCallback((value: string) => {
    setDefaultPackagingCostState(value);
    Storage.setItem(DEFAULT_PACKAGING_COST_VALUE_KEY, value).catch((error) => {
      console.error('Error saving default packaging cost value setting:', error);
    });
  }, []);

  const toggleDefaultPackagingCost = useCallback(() => {
    handleSetDefaultPackagingCostEnabled(!isDefaultPackagingCostEnabled);
  }, [handleSetDefaultPackagingCostEnabled, isDefaultPackagingCostEnabled]);

  const contextValue = useMemo(
    () => ({
      isSwipeNavigationEnabled,
      isHapticsEnabled,
      isLoadingSettings,
      setIsSwipeNavigationEnabled: handleSetSwipeNavigationEnabled,
      toggleSwipeNavigation,
      setIsHapticsEnabled: handleSetHapticsEnabled,
      toggleHaptics,
      triggerHaptic,

      // Operational Preferences
      priceDecimalPlaces,
      setPriceDecimalPlaces: handleSetPriceDecimalPlaces,

      isDefaultOverheadEnabled,
      defaultOverhead,
      setIsDefaultOverheadEnabled: handleSetDefaultOverheadEnabled,
      setDefaultOverhead: handleSetDefaultOverhead,
      toggleDefaultOverhead,

      isDefaultProfitMarginEnabled,
      defaultProfitMargin,
      setIsDefaultProfitMarginEnabled: handleSetDefaultProfitMarginEnabled,
      setDefaultProfitMargin: handleSetDefaultProfitMargin,
      toggleDefaultProfitMargin,

      isDefaultHourlyLaborEnabled,
      defaultHourlyLabor,
      setIsDefaultHourlyLaborEnabled: handleSetDefaultHourlyLaborEnabled,
      setDefaultHourlyLabor: handleSetDefaultHourlyLabor,
      toggleDefaultHourlyLabor,

      isDefaultPackagingCostEnabled,
      defaultPackagingCost,
      setIsDefaultPackagingCostEnabled: handleSetDefaultPackagingCostEnabled,
      setDefaultPackagingCost: handleSetDefaultPackagingCost,
      toggleDefaultPackagingCost,
    }),
    [
      isSwipeNavigationEnabled,
      isHapticsEnabled,
      isLoadingSettings,
      handleSetSwipeNavigationEnabled,
      toggleSwipeNavigation,
      handleSetHapticsEnabled,
      toggleHaptics,
      triggerHaptic,

      priceDecimalPlaces,
      handleSetPriceDecimalPlaces,

      isDefaultOverheadEnabled,
      defaultOverhead,
      handleSetDefaultOverheadEnabled,
      handleSetDefaultOverhead,
      toggleDefaultOverhead,

      isDefaultProfitMarginEnabled,
      defaultProfitMargin,
      handleSetDefaultProfitMarginEnabled,
      handleSetDefaultProfitMargin,
      toggleDefaultProfitMargin,

      isDefaultHourlyLaborEnabled,
      defaultHourlyLabor,
      handleSetDefaultHourlyLaborEnabled,
      handleSetDefaultHourlyLabor,
      toggleDefaultHourlyLabor,

      isDefaultPackagingCostEnabled,
      defaultPackagingCost,
      handleSetDefaultPackagingCostEnabled,
      handleSetDefaultPackagingCost,
      toggleDefaultPackagingCost,
    ],
  );

  return <SettingsContext.Provider value={contextValue}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextData {
  const context = useContext(SettingsContext);

  if (!context || context.isSwipeNavigationEnabled === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }

  return context;
}
