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
  containerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  variant?: 'primary' | 'secondary' | 'neutral';
}

export const FloatingButton = ({
  onPress,
  children,
  containerStyle,
  style,
  variant,
}: FloatingButtonProps) => {
  const { theme } = useThemeMode();

  const styles = useMemo(() => createStyles(theme, variant), [theme, variant]);

  return (
    <View style={[styles.btnContainer, containerStyle]}>
      <TouchableOpacity style={[styles.button, style]} onPress={onPress}>
        {children}
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (theme: AppTheme, variant?: 'primary' | 'secondary' | 'neutral') =>
  StyleSheet.create({
    btnContainer: {
      position: 'absolute',
    },
    button: {
      width: 50,
      height: 50,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor:
        variant === 'primary'
          ? theme.colors.primary
          : variant === 'secondary'
            ? theme.colors.secondary
            : theme.colors.background,
      borderWidth: 1,
      borderColor:
        variant === 'primary'
          ? theme.colors.primary
          : variant === 'secondary'
            ? theme.colors.secondary
            : theme.colors.background,
      borderRadius: 60,
    },
  });
