import { ReactNode, useMemo } from 'react';
import {
  GestureResponderEvent,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';

import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';

interface CustomButtonProps {
  title?: string;
  onPress?: (event: GestureResponderEvent) => void | Promise<void>;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'primary' | 'secondary' | 'neutral' | 'dashed' | 'outline' | 'danger';
  isDisabled?: boolean;
  testID?: string;
  accessibilityLabel?: string;
}

export const CustomButton = ({
  title,
  onPress,
  children,
  variant = 'primary',
  isDisabled = false,
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
      disabled={isDisabled}
      style={[styles.button, isDisabled && styles.disabledButton, style]}
      onPress={onPress}
    >
      {title ? (
        <Text style={[styles.btnText, isDisabled && styles.disabledBtnText]}>{title}</Text>
      ) : null}
      {children}
    </TouchableOpacity>
  );
};

const createStyles = (
  theme: AppTheme,
  variant: 'primary' | 'secondary' | 'neutral' | 'dashed' | 'outline' | 'danger',
) => {
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isDashed = variant === 'dashed';
  const isOutline = variant === 'outline';
  const isDanger = variant === 'danger';

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
  } else if (isDanger) {
    backgroundColor = theme.colors.error;
    borderColor = theme.colors.error;
    textColor = theme.colors.onError;
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
      alignSelf: 'center',
      marginVertical: theme.spacing.space3,
      ...(isPrimary ? theme.shadows.glow : isSecondary ? theme.shadows.soft : {}),
    },
    btnText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: theme.typography.labelMd.fontWeight,
      letterSpacing: theme.typography.labelMd.letterSpacing,
      textTransform: 'uppercase',
      color: textColor,
      textAlign: 'center',
    },
    disabledButton: {
      opacity: 0.5,
    },
    disabledBtnText: {
      opacity: 0.7,
    },
  });
};
