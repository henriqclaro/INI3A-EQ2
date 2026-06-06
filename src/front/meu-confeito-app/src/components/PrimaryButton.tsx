import { ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import { useThemeMode } from '../theme/ThemeContext';

interface PrimaryButtonProps {
  name?: string;
  onPress?: () => void;
  children?: ReactNode;
  style?: object;
}

export const PrimaryButton = ({ name, onPress, children, style }: PrimaryButtonProps) => {
  const { theme } = useThemeMode();

  const styles = StyleSheet.create({
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

  return (
    <TouchableOpacity style={[styles.button, style]} onPress={onPress}>
      <Text style={styles.btnText}>{name}</Text>
      {children}
    </TouchableOpacity>
  );
};
