import { Platform } from 'react-native';

import * as SecureStore from 'expo-secure-store';

import AsyncStorage from '@react-native-async-storage/async-storage';

const SECURE_KEYS = new Set(['access_token', 'refresh_token', 'session_id']);

const inMemoryCache = new Map<string, string | null>();

export const Storage = {
  getFastItem(key: string): string | null {
    const item = inMemoryCache.get(key) ?? null;
    if (item === 'undefined' || item === 'null') {
      return null;
    }
    return item;
  },

  async setItem(key: string, value: string): Promise<void> {
    if (!value || value === 'undefined' || value === 'null') {
      await this.removeItem(key);
      return;
    }

    inMemoryCache.set(key, value);

    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        console.error('Error saving on localStorage', error);
      }
      return;
    }

    if (SECURE_KEYS.has(key)) {
      await SecureStore.setItemAsync(key, value);
    } else {
      await AsyncStorage.setItem(key, value);
    }
  },

  async getItem(key: string): Promise<string | null> {
    if (inMemoryCache.has(key)) {
      const cached = inMemoryCache.get(key) ?? null;
      if (cached === 'undefined' || cached === 'null') {
        inMemoryCache.delete(key);
        return null;
      }
      return cached;
    }

    let value: string | null = null;
    if (Platform.OS === 'web') {
      try {
        value = localStorage.getItem(key);
      } catch (error) {
        console.error('Error reading localStorage', error);
      }
    } else if (SECURE_KEYS.has(key)) {
      value = await SecureStore.getItemAsync(key);
    } else {
      value = await AsyncStorage.getItem(key);
      // Migration fallback for existing installs where settings were in SecureStore
      if (value === null) {
        try {
          const oldSecureValue = await SecureStore.getItemAsync(key);
          if (oldSecureValue !== null) {
            value = oldSecureValue;
            await AsyncStorage.setItem(key, oldSecureValue);
            await SecureStore.deleteItemAsync(key).catch(() => {});
          }
        } catch {
          // Ignore
        }
      }
    }

    if (value === 'undefined' || value === 'null') {
      value = null;
    }

    inMemoryCache.set(key, value);
    return value;
  },

  async removeItem(key: string): Promise<void> {
    inMemoryCache.delete(key);

    if (Platform.OS === 'web') {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error('Error removing from localStorage', error);
      }
      return;
    }

    if (SECURE_KEYS.has(key)) {
      await SecureStore.deleteItemAsync(key);
    } else {
      await AsyncStorage.removeItem(key);
    }
  },

  async prewarmTokens(): Promise<void> {
    await Promise.all([
      this.getItem('access_token'),
      this.getItem('refresh_token'),
      this.getItem('session_id'),
    ]);
  },
};
