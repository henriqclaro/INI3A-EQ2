import { Alert, AlertButton, AlertOptions, Platform } from 'react-native';

export interface DesktopAlertState {
  isOpen: boolean;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  options?: AlertOptions;
}

type DesktopAlertListener = (state: DesktopAlertState) => void;

class DesktopAlertManager {
  private listeners: Set<DesktopAlertListener> = new Set();
  private currentState: DesktopAlertState = {
    isOpen: false,
    title: '',
  };

  public subscribe(listener: DesktopAlertListener): () => void {
    this.listeners.add(listener);
    listener(this.currentState);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public show(
    title: string,
    message?: string,
    buttons?: AlertButton[],
    options?: AlertOptions,
  ): void {
    const defaultButtons: AlertButton[] =
      buttons && buttons.length > 0 ? buttons : [{ text: 'OK', style: 'default' }];

    this.currentState = {
      isOpen: true,
      title,
      message,
      buttons: defaultButtons,
      options,
    };
    this.notify();
  }

  public hide(): void {
    this.currentState = {
      ...this.currentState,
      isOpen: false,
    };
    this.notify();
  }

  public getState(): DesktopAlertState {
    return this.currentState;
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.currentState);
    }
  }
}

export const desktopAlertManager = new DesktopAlertManager();

let isInitialized = false;

/**
 * Initialize Desktop Alert override for the web environment.
 * Replaces the React Native Web Alert.alert no-op implementation
 * with our customized themed Desktop modal dialog.
 */
export function initDesktopAlert(): void {
  if (isInitialized) return;
  isInitialized = true;

  if (Platform.OS === 'web') {
    Alert.alert = (
      title: string,
      message?: string,
      buttons?: AlertButton[],
      options?: AlertOptions,
    ) => {
      desktopAlertManager.show(title, message, buttons, options);
    };
  }
}

initDesktopAlert();
