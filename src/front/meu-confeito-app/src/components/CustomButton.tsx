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
  variant?: 'primary' | 'secondary';
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

const createStyles = (theme: AppTheme, variant: 'primary' | 'secondary') =>
  StyleSheet.create({
    button: {
      width: 275,
      height: 55,
      backgroundColor:
        variant === 'primary' ? theme.colors.secondary : theme.colors.pitchBackground,
      borderWidth: 0.8,
      borderColor: variant === 'primary' ? theme.colors.border : theme.colors.secBorder,
      borderRadius: 10,
      paddingVertical: 12,
      justifyContent: 'center',
      alignItems: 'center',
      margin: 12,
    },
    btnText: {
      fontSize: 18,
    },
  });
