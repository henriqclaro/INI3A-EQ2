import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useSettings } from './SettingsContext';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
  message: string;
  title?: string;
  type?: ToastType;
  durationMs?: number;
  actionLabel?: string;
  onAction?: () => void;
}

export interface ActiveToast extends ToastOptions {
  id: string;
}

export interface ToastContextData {
  showToast: (options: ToastOptions | string) => void;
  hideToast: () => void;
  activeToast: ActiveToast | null;
}

const ToastContext = createContext<ToastContextData>({} as ToastContextData);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [activeToast, setActiveToast] = useState<ActiveToast | null>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { triggerHaptic } = useSettings();

  const hideToast = useCallback(() => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
    setActiveToast(null);
  }, []);

  const showToast = useCallback(
    (options: ToastOptions | string) => {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
        dismissTimerRef.current = null;
      }

      const normalized: ToastOptions =
        typeof options === 'string' ? { message: options, type: 'info' } : options;

      const durationMs = normalized.durationMs ?? 3500;
      const toastType = normalized.type ?? 'info';

      // Physical tactile feedback
      switch (toastType) {
        case 'success':
          triggerHaptic('success');
          break;
        case 'error':
          triggerHaptic('error');
          break;
        case 'warning':
          triggerHaptic('warning');
          break;
        default:
          triggerHaptic('light');
          break;
      }

      const newToast: ActiveToast = {
        ...normalized,
        id: String(Date.now()),
        type: toastType,
      };

      setActiveToast(newToast);

      dismissTimerRef.current = setTimeout(() => {
        setActiveToast(null);
        dismissTimerRef.current = null;
      }, durationMs);
    },
    [triggerHaptic],
  );

  const contextValue = useMemo(
    () => ({
      showToast,
      hideToast,
      activeToast,
    }),
    [showToast, hideToast, activeToast],
  );

  return <ToastContext.Provider value={contextValue}>{children}</ToastContext.Provider>;
}

export function useToast(): ToastContextData {
  const context = useContext(ToastContext);
  if (!context || context.showToast === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
