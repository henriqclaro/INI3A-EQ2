import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';

import { usePreventRemove } from 'expo-router';

export interface UseUnsavedChangesWarningOptions {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
}

/**
 * Intercepts navigation attempts (hardware back, swipe back, header back button, web back/unload)
 * when there are unsaved changes in a form, prompting the user for confirmation.
 */
export function useUnsavedChangesWarning(
  hasUnsavedChanges: boolean,
  options: UseUnsavedChangesWarningOptions = {},
) {
  const [isNavigatingBypass, setIsNavigatingBypass] = useState(false);
  const isNavigatingBypassRef = useRef(false);

  const {
    title = 'Descartar alterações?',
    message = 'Você possui informações não salvas. Deseja realmente sair e descartar os dados inseridos?',
    confirmText = 'Descartar e sair',
    cancelText = 'Continuar editando',
  } = options;

  // Allows intentional transitions (such as after a successful save) to bypass the prompt
  const allowNextNavigation = useCallback(() => {
    isNavigatingBypassRef.current = true;
    setIsNavigatingBypass(true);
  }, []);

  // Web: Warn before closing tab or reloading page
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && !isNavigatingBypassRef.current) {
        event.preventDefault();
        event.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  // React Navigation: Intercept stack pop, hardware back, and header back buttons
  usePreventRemove(hasUnsavedChanges && !isNavigatingBypass, ({ repeat }) => {
    Alert.alert(title, message, [
      {
        text: cancelText,
        style: 'cancel',
        onPress: () => {
          // Stay on the current screen
        },
      },
      {
        text: confirmText,
        style: 'destructive',
        onPress: () => {
          isNavigatingBypassRef.current = true;
          setIsNavigatingBypass(true);
          repeat();
        },
      },
    ]);
  });

  return {
    allowNextNavigation,
  };
}
