import { ReactNode, use, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import { useThemeMode } from '../contexts/ThemeContext';
import { AppTheme } from '../theme/themes';

interface PrimaryButtonProps {
  title?: string;
  onPress?: () => void;
  children?: ReactNode;
  style?: object;
  variant?: 'primary' | 'secondary';
}

export const CustomButton = ({
  title,
  onPress,
  children,
  variant = 'primary',
  style,
}: PrimaryButtonProps) => {
  const { theme } = useThemeMode();

  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <TouchableOpacity style={[styles.button, style]} onPress={onPress}>
      <Text style={styles.btnText}>{title}</Text>
      {children}
    </TouchableOpacity>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    button: {
      width: 275,
      height: 55,
      backgroundColor: theme.colors.secondary,
      borderWidth: 0.8,
      borderColor: theme.colors.border,
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
