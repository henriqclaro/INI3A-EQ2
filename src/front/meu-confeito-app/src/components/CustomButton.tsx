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
  variant?: 'primary' | 'secondary' | 'neutral';
}

export const CustomButton = ({
  title,
  onPress,
  children,
  variant = 'primary',
  style,
}: CustomButtonProps) => {
  const { theme } = useThemeMode();

  const styles = useMemo(() => createStyles(theme, variant), [theme, variant]);

  return (
    <TouchableOpacity style={[styles.button, style]} onPress={onPress}>
      <Text style={styles.btnText}>{title}</Text>
      {children}
    </TouchableOpacity>
  );
};

const createStyles = (theme: AppTheme, variant: 'primary' | 'secondary' | 'neutral') =>
  StyleSheet.create({
    button: {
      width: 275,
      height: 55,
      backgroundColor:
        variant === 'primary'
          ? theme.colors.primary
          : variant === 'secondary'
            ? theme.colors.secondary
            : theme.colors.background,
      borderWidth: 1,
      borderColor: variant === 'secondary' ? theme.colors.secondary : theme.colors.primary,
      borderRadius: 12,
      paddingVertical: 12,
      justifyContent: 'center',
      alignItems: 'center',
      margin: 12,
    },
    btnText: {
      fontSize: 18,
      fontWeight: 600,
      color:
        variant === 'primary'
          ? theme.colors.secondaryText
          : variant === 'secondary'
            ? theme.colors.text
            : theme.colors.primary,
    },
  });
