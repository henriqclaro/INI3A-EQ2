import { ReactNode, useMemo } from 'react';
import {
  GestureResponderEvent,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';

import { useThemeMode } from '../contexts/ThemeContext';
import { AppTheme } from '../theme/themes';

interface CustomButtonProps {
  title?: string;
  onPress?: (event: GestureResponderEvent) => void | Promise<void>;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'primary' | 'secondary' | 'neutral' | 'dashed' | 'outline';
  testID?: string;
  accessibilityLabel?: string;
}

export const CustomButton = ({
  title,
  onPress,
  children,
  variant = 'primary',
  style,
  testID,
  accessibilityLabel,
}: CustomButtonProps) => {
  const { theme } = useThemeMode();

  const styles = useMemo(() => createStyles(theme, variant), [theme, variant]);

  return (
    <TouchableOpacity
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      activeOpacity={0.8}
      style={[styles.button, style]}
      onPress={onPress}
    >
      {title ? <Text style={styles.btnText}>{title}</Text> : null}
      {children}
    </TouchableOpacity>
  );
};

const createStyles = (
  theme: AppTheme,
  variant: 'primary' | 'secondary' | 'neutral' | 'dashed' | 'outline',
) => {
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isDashed = variant === 'dashed';
  const isOutline = variant === 'outline';

  let backgroundColor: string = theme.colors.surfaceContainerLowest;
  let borderColor: string = theme.colors.outlineVariant;
  let textColor: string = theme.colors.text;

  if (isPrimary) {
    backgroundColor = theme.colors.primary;
    borderColor = theme.colors.primary;
    textColor = theme.colors.onPrimary;
  } else if (isSecondary) {
    backgroundColor = theme.colors.secondaryContainer;
    borderColor = theme.colors.secondaryContainer;
    textColor = theme.colors.onSecondaryContainer;
  } else if (isDashed) {
    backgroundColor = theme.colors.surfaceContainerLowest;
    borderColor = theme.colors.primary;
    textColor = theme.colors.primary;
  } else if (isOutline) {
    backgroundColor = 'transparent';
    borderColor = theme.colors.outlineVariant;
    textColor = theme.colors.text;
  }

  return StyleSheet.create({
    button: {
      width: 275,
      minHeight: theme.spacing.touchable,
      height: 48,
      backgroundColor,
      borderWidth: 1,
      borderStyle: isDashed ? 'dashed' : 'solid',
      borderColor,
      borderRadius: theme.rounded.default,
      paddingVertical: theme.spacing.space3,
      paddingHorizontal: theme.spacing.space6,
      justifyContent: 'center',
      alignItems: 'center',
      margin: theme.spacing.space3,
      ...(isPrimary ? theme.shadows.glow : isSecondary ? theme.shadows.soft : {}),
    },
    btnText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: theme.typography.labelMd.fontWeight,
      letterSpacing: theme.typography.labelMd.letterSpacing,
      textTransform: 'uppercase',
      color: textColor,
    },
  });
};
