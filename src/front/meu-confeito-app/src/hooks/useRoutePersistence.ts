import { useEffect, useRef } from 'react';

import { useGlobalSearchParams, usePathname, useRouter } from 'expo-router';

import { useAuth } from '@/src/contexts/AuthContext';
import { useSettings } from '@/src/contexts/SettingsContext';
import { kvStorage } from '@/src/utils/kvStorage';

const LAST_ROUTE_KEY = 'last_visited_route';

const EXCLUDED_ROUTES = new Set(['/', '/index', '/login', '/register', '/reset-password']);

export function useRoutePersistence() {
  const pathname = usePathname();
  const searchParams = useGlobalSearchParams();
  const { user, isLoadingStorage } = useAuth();
  const { isRoutePersistenceEnabled } = useSettings();
  const router = useRouter();
  const hasAttemptedRestoreRef = useRef(false);

  // Attempt one-time route restoration after auth resolves on cold/warm start
  useEffect(() => {
    if (isLoadingStorage || !user || !isRoutePersistenceEnabled || hasAttemptedRestoreRef.current) {
      return;
    }

    hasAttemptedRestoreRef.current = true;

    try {
      const savedRoute = kvStorage.getString(LAST_ROUTE_KEY);
      if (savedRoute && !EXCLUDED_ROUTES.has(savedRoute) && savedRoute !== pathname) {
        // Navigate to last remembered route
        router.replace(savedRoute as unknown as Parameters<typeof router.replace>[0]);
      }
    } catch (error) {
      console.warn('Failed to restore last visited route:', error);
    }
  }, [isLoadingStorage, user, isRoutePersistenceEnabled, pathname, router]);

  // Track active route
  useEffect(() => {
    if (!user || !isRoutePersistenceEnabled || !pathname) {
      return;
    }

    if (EXCLUDED_ROUTES.has(pathname)) {
      return;
    }

    try {
      const queryString = Object.entries(searchParams)
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&');

      const fullRoute = queryString ? `${pathname}?${queryString}` : pathname;
      kvStorage.setString(LAST_ROUTE_KEY, fullRoute);
    } catch {
      // Ignore storage errors
    }
  }, [pathname, searchParams, user, isRoutePersistenceEnabled]);
}

export function clearPersistedRoute(): void {
  try {
    kvStorage.removeItem(LAST_ROUTE_KEY);
  } catch {
    // Ignore
  }
}
