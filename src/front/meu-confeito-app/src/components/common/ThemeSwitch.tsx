import { Platform, StyleProp, StyleSheet, Switch, SwitchProps, ViewStyle } from 'react-native';

import { useSettings } from '@/src/contexts/SettingsContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';

export interface ThemeSwitchProps extends Omit<SwitchProps, 'thumbColor' | 'trackColor'> {
  thumbColor?: string;
  activeThumbColor?: string;
  inactiveThumbColor?: string;
  activeTrackColor?: string;
  inactiveTrackColor?: string;
  hasHapticFeedback?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

export function ThemeSwitch({
  value,
  onValueChange,
  thumbColor,
  activeThumbColor,
  inactiveThumbColor,
  activeTrackColor,
  inactiveTrackColor,
  hasHapticFeedback = true,
  style,
  ...rest
}: ThemeSwitchProps) {
  const { theme } = useThemeMode();
  const { isHapticsEnabled, triggerHaptic } = useSettings();

  const isSwitchDisabled = Boolean(rest.disabled);

  const resolvedActiveThumbColor = isSwitchDisabled
    ? theme.colors.placeholder
    : activeThumbColor || theme.colors.primary;
  const resolvedInactiveThumbColor = isSwitchDisabled
    ? theme.colors.surfaceContainerHighest
    : inactiveThumbColor || theme.colors.surfaceContainerHighest;
  const resolvedThumbColor =
    thumbColor || (value ? resolvedActiveThumbColor : resolvedInactiveThumbColor);

  const resolvedActiveTrackColor = isSwitchDisabled
    ? theme.colors.outlineVariant
    : activeTrackColor || theme.colors.primaryContainer;
  const resolvedInactiveTrackColor = inactiveTrackColor || theme.colors.outlineVariant;

  const handleValueChange = (newValue: boolean) => {
    if (isSwitchDisabled) {
      return;
    }
    if (hasHapticFeedback && isHapticsEnabled) {
      triggerHaptic('selection');
    }
    onValueChange?.(newValue);
  };

  // Web-specific props to fix react-native-web default green activeThumbColor (#009688) and layout
  const webProps =
    Platform.OS === 'web'
      ? ({
          activeThumbColor: resolvedActiveThumbColor,
          activeTrackColor: resolvedActiveTrackColor,
          disabled: isSwitchDisabled,
        } as unknown as Partial<SwitchProps>)
      : {};

  return (
    <Switch
      value={value}
      onValueChange={handleValueChange}
      thumbColor={resolvedThumbColor}
      trackColor={{
        false: resolvedInactiveTrackColor,
        true: resolvedActiveTrackColor,
      }}
      style={[styles.switch, isSwitchDisabled && styles.disabledSwitch, style]}
      {...webProps}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  switch: {
    ...Platform.select({
      web: {
        height: 24,
        width: 48,
        cursor: 'pointer',
      },
    }),
  },
  disabledSwitch: {
    opacity: 0.5,
    ...Platform.select({
      web: {
        cursor: 'auto',
      },
    }),
  },
});
