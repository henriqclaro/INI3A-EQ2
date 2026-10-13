import { Platform } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface IKVStorage {
  getString(key: string): string | null;
  setString(key: string, value: string): void;
  getNumber(key: string): number | null;
  setNumber(key: string, value: number): void;
  getBoolean(key: string): boolean | null;
  setBoolean(key: string, value: boolean): void;
  getObject<T>(key: string): T | null;
  setObject<T>(key: string, value: T): void;
  removeItem(key: string): void;
  clearAll(): void;
  getAllKeys(): string[];
}

interface NativeMMKVInstance {
  getString(key: string): string | undefined;
  set(key: string, value: string | number | boolean): void;
  getNumber(key: string): number | undefined;
  getBoolean(key: string): boolean | undefined;
  remove(key: string): void;
  clearAll(): void;
  getAllKeys(): string[];
}

const memoryMap = new Map<string, string>();

let nativeMMKV: NativeMMKVInstance | null = null;
let isNativeMMKVAvailable = false;

if (Platform.OS !== 'web') {
  try {
    // Dynamic import to prevent crash on web or runtimes missing native Nitro/JSI module
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mmkvModule = require('react-native-mmkv');
    if (typeof mmkvModule?.createMMKV === 'function') {
      nativeMMKV = mmkvModule.createMMKV({ id: 'meu-confeito-cache' }) as NativeMMKVInstance;
      isNativeMMKVAvailable = Boolean(nativeMMKV);
    }
  } catch {
    isNativeMMKVAvailable = false;
  }
}

export const kvStorage: IKVStorage = {
  getString(key: string): string | null {
    if (isNativeMMKVAvailable && nativeMMKV) {
      try {
        const val = nativeMMKV.getString(key);
        return val ?? null;
      } catch {
        // Fall back to memoryMap on native error
      }
    }

    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return memoryMap.get(key) ?? null;
      }
    }

    return memoryMap.get(key) ?? null;
  },

  setString(key: string, value: string): void {
    memoryMap.set(key, value);

    if (isNativeMMKVAvailable && nativeMMKV) {
      try {
        nativeMMKV.set(key, value);
        return;
      } catch {
        // Fall back to async storage
      }
    }

    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(key, value);
        return;
      } catch {
        // fallback to memoryMap
      }
    } else {
      AsyncStorage.setItem(key, value).catch(() => {});
    }
  },

  getNumber(key: string): number | null {
    if (isNativeMMKVAvailable && nativeMMKV) {
      try {
        const val = nativeMMKV.getNumber(key);
        return typeof val === 'number' && !isNaN(val) ? val : null;
      } catch {
        // Fall back
      }
    }

    const raw = this.getString(key);
    if (raw === null) return null;
    const parsed = Number(raw);
    return isNaN(parsed) ? null : parsed;
  },

  setNumber(key: string, value: number): void {
    if (isNativeMMKVAvailable && nativeMMKV) {
      try {
        nativeMMKV.set(key, value);
        memoryMap.set(key, String(value));
        return;
      } catch {
        // Fall back
      }
    }
    this.setString(key, String(value));
  },

  getBoolean(key: string): boolean | null {
    if (isNativeMMKVAvailable && nativeMMKV) {
      try {
        const isStoredValue = nativeMMKV.getBoolean(key);
        return typeof isStoredValue === 'boolean' ? isStoredValue : null;
      } catch {
        // Fall back
      }
    }

    const raw = this.getString(key);
    if (raw === null) return null;
    return raw === 'true';
  },

  setBoolean(key: string, value: boolean): void {
    if (isNativeMMKVAvailable && nativeMMKV) {
      try {
        nativeMMKV.set(key, value);
        memoryMap.set(key, String(value));
        return;
      } catch {
        // Fall back
      }
    }
    this.setString(key, String(value));
  },

  getObject<T>(key: string): T | null {
    const raw = this.getString(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  setObject<T>(key: string, value: T): void {
    try {
      const serialized = JSON.stringify(value);
      this.setString(key, serialized);
    } catch (err) {
      console.warn(`Failed to serialize object for key ${key}`, err);
    }
  },

  removeItem(key: string): void {
    memoryMap.delete(key);

    if (isNativeMMKVAvailable && nativeMMKV) {
      try {
        nativeMMKV.remove(key);
        return;
      } catch {
        // Fall back
      }
    }

    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(key);
        return;
      } catch {
        // Fallback
      }
    } else {
      AsyncStorage.removeItem(key).catch(() => {});
    }
  },

  clearAll(): void {
    memoryMap.clear();

    if (isNativeMMKVAvailable && nativeMMKV) {
      try {
        nativeMMKV.clearAll();
        return;
      } catch {
        // Fall back
      }
    }

    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.clear();
        return;
      } catch {
        // Fallback
      }
    } else {
      AsyncStorage.clear().catch(() => {});
    }
  },

  getAllKeys(): string[] {
    if (isNativeMMKVAvailable && nativeMMKV) {
      try {
        return nativeMMKV.getAllKeys();
      } catch {
        // Fall back
      }
    }

    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      try {
        return Object.keys(window.localStorage);
      } catch {
        // Fallback
      }
    }

    return Array.from(memoryMap.keys());
  },
};
