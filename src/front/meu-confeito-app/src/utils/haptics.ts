import * as Haptics from 'expo-haptics';

export type HapticFeedbackType =
  | 'selection'
  | 'light'
  | 'medium'
  | 'heavy'
  | 'success'
  | 'warning'
  | 'error';

let isGlobalHapticsEnabled = true;

export const setGlobalHapticsEnabled = (isEnabled: boolean): void => {
  isGlobalHapticsEnabled = isEnabled;
};

export const getIsGlobalHapticsEnabled = (): boolean => isGlobalHapticsEnabled;

export const triggerGlobalHaptic = async (
  type: HapticFeedbackType = 'selection',
): Promise<void> => {
  if (!isGlobalHapticsEnabled) {
    return;
  }

  try {
    switch (type) {
      case 'selection':
        await Haptics.selectionAsync();
        break;
      case 'light':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'success':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'warning':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'error':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
    }
  } catch {
    // Gracefully ignore on web and unsupported devices
  }
};
