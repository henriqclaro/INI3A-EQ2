import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { Storage } from '../utils/storage';
import { useAuth } from './AuthContext';

export const ONBOARDING_CARD_IDS = [
  'home_welcome',
  'stock_register_item',
  'reports_profit_summary',
  'reports_purchase_projection',
  'recipe_screen_awake',
  'recipe_review_rate',
  'settings_appearance',
  'settings_operational',
  'settings_edit_profile',
] as const;

export type OnboardingCardId = (typeof ONBOARDING_CARD_IDS)[number] | string;

export interface OnboardingContextData {
  isCardDismissed: (cardId: string) => boolean;
  dismissCard: (cardId: string) => Promise<void>;
  dismissAllCards: () => Promise<void>;
  resetAllCards: () => Promise<void>;
  hasDismissedAllCards: boolean;
  isLoadingCards: boolean;
}

const STORAGE_PREFIX = 'onboarding_dismissed_cards_';

const OnboardingContext = createContext<OnboardingContextData>({} as OnboardingContextData);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [dismissedCardIds, setDismissedCardIds] = useState<Set<string>>(new Set());
  const [hasDismissedAllCards, setHasDismissedAllCards] = useState(false);
  const [isLoadingCards, setIsLoadingCards] = useState(true);

  const storageKey = useMemo(() => {
    return `${STORAGE_PREFIX}${user?.id || 'guest'}`;
  }, [user?.id]);

  // Load dismissed cards for current user from persistent storage
  useEffect(() => {
    let isSubscribed = true;

    async function loadDismissedCards() {
      setIsLoadingCards(true);
      try {
        const stored = await Storage.getItem(storageKey);
        if (!isSubscribed) return;

        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
              setDismissedCardIds(new Set(parsed));
              const isAllIncluded = ONBOARDING_CARD_IDS.every((id) => parsed.includes(id));
              setHasDismissedAllCards(isAllIncluded);
            } else if (parsed && typeof parsed === 'object') {
              const ids = Array.isArray(parsed.dismissedIds) ? parsed.dismissedIds : [];
              setDismissedCardIds(new Set(ids));
              setHasDismissedAllCards(Boolean(parsed.isAllDismissed));
            }
          } catch {
            setDismissedCardIds(new Set());
            setHasDismissedAllCards(false);
          }
        } else {
          setDismissedCardIds(new Set());
          setHasDismissedAllCards(false);
        }
      } catch (err) {
        console.error('Error loading dismissed onboarding cards:', err);
      } finally {
        if (isSubscribed) {
          setIsLoadingCards(false);
        }
      }
    }

    loadDismissedCards();

    return () => {
      isSubscribed = false;
    };
  }, [storageKey]);

  // Check if a specific card has been dismissed
  const isCardDismissed = useCallback(
    (cardId: string): boolean => {
      if (isLoadingCards) {
        // Return true during initial load to prevent visual flashing of previously dismissed cards
        return true;
      }
      if (hasDismissedAllCards) {
        return true;
      }
      return dismissedCardIds.has(cardId);
    },
    [isLoadingCards, hasDismissedAllCards, dismissedCardIds],
  );

  // Dismiss a single card
  const dismissCard = useCallback(
    async (cardId: string) => {
      setDismissedCardIds((prev) => {
        const next = new Set(prev);
        next.add(cardId);
        const payload = {
          isAllDismissed: hasDismissedAllCards,
          dismissedIds: Array.from(next),
        };
        Storage.setItem(storageKey, JSON.stringify(payload)).catch((err) => {
          console.error('Error saving dismissed card:', err);
        });
        return next;
      });
    },
    [hasDismissedAllCards, storageKey],
  );

  // Dismiss all onboarding cards at once
  const dismissAllCards = useCallback(async () => {
    const allIds = new Set<string>(ONBOARDING_CARD_IDS);
    setDismissedCardIds(allIds);
    setHasDismissedAllCards(true);
    const payload = {
      isAllDismissed: true,
      dismissedIds: Array.from(allIds),
    };
    try {
      await Storage.setItem(storageKey, JSON.stringify(payload));
    } catch (err) {
      console.error('Error dismissing all cards:', err);
    }
  }, [storageKey]);

  // Reset all onboarding cards so they show up again
  const resetAllCards = useCallback(async () => {
    setDismissedCardIds(new Set());
    setHasDismissedAllCards(false);
    try {
      await Storage.removeItem(storageKey);
    } catch (err) {
      console.error('Error resetting onboarding cards:', err);
    }
  }, [storageKey]);

  const value = useMemo(
    () => ({
      isCardDismissed,
      dismissCard,
      dismissAllCards,
      resetAllCards,
      hasDismissedAllCards,
      isLoadingCards,
    }),
    [
      isCardDismissed,
      dismissCard,
      dismissAllCards,
      resetAllCards,
      hasDismissedAllCards,
      isLoadingCards,
    ],
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
