import { Platform } from 'react-native';

import { API_BASE_URL } from '../config/env';

type NetworkListener = (isOnline: boolean) => void;
const listeners = new Set<NetworkListener>();

let isOnlineState = true;

// Initial check for Web
if (
  Platform.OS === 'web' &&
  typeof window !== 'undefined' &&
  typeof window.navigator !== 'undefined'
) {
  isOnlineState = window.navigator.onLine ?? true;

  window.addEventListener('online', () => {
    NetworkService.setIsOnline(true);
  });

  window.addEventListener('offline', () => {
    NetworkService.setIsOnline(false);
  });
}

function notifyListeners(): void {
  for (const listener of listeners) {
    try {
      listener(isOnlineState);
    } catch (err) {
      console.warn('Error in network listener:', err);
    }
  }
}

export const NetworkService = {
  getIsOnline(): boolean {
    return isOnlineState;
  },

  getIsOffline(): boolean {
    return !isOnlineState;
  },

  setIsOnline(isOnline: boolean): void {
    if (isOnlineState !== isOnline) {
      isOnlineState = isOnline;
      notifyListeners();
    }
  },

  subscribe(listener: NetworkListener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  /**
   * Performs a lightweight connectivity check to the API health endpoint.
   */
  async checkConnectivity(): Promise<boolean> {
    if (
      Platform.OS === 'web' &&
      typeof window !== 'undefined' &&
      typeof window.navigator !== 'undefined'
    ) {
      if (window.navigator.onLine === false) {
        this.setIsOnline(false);
        return false;
      }
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const hasSucceeded = res.status < 500;
      this.setIsOnline(hasSucceeded);
      return hasSucceeded;
    } catch {
      this.setIsOnline(false);
      return false;
    }
  },
};
