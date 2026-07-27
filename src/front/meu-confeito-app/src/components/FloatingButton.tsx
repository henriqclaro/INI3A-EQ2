import { ReactNode, useMemo } from 'react';
import {
  GestureResponderEvent,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

import { useThemeMode } from '../contexts/ThemeContext';
import { AppTheme } from '../theme/themes';

interface FloatingButtonProps {
  onPress?: (event: GestureResponderEvent) => void | Promise<void>;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'primary' | 'secondary';
}

export const FloatingButton = ({ onPress, children, style, variant }: FloatingButtonProps) => {
  const { theme } = useThemeMode();

  const styles = useMemo(() => createStyles(theme, variant), [theme, variant]);

  return (
    <View style={styles.btnContainer}>
      <TouchableOpacity style={[styles.button, style]} onPress={onPress}>
        {children}
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (theme: AppTheme, variant?: 'primary' | 'secondary') =>
  StyleSheet.create({
    btnContainer: {
      position: 'absolute',
      top: 20,
      left: 20,
    },
    button: {
      width: 50,
      height: 50,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor:
        variant === 'primary' ? theme.colors.secondary : theme.colors.pitchBackground,
      borderWidth: 0.8,
      borderColor: theme.colors.border,
      borderRadius: 100,
    },
  });
