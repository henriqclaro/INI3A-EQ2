import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import { useThemeMode } from '../theme/ThemeContext';
import { ReactNode } from 'react';

interface PrimaryButtonProps {
  name?: string;
  onPress?: () => void;
  children?: ReactNode
}

export const PrimaryButton = ({ name, onPress, children }: PrimaryButtonProps) => {
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
      marginTop: 10,
    },
    btnText: {
      fontSize: 18,
    },
  });

  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.btnText}>{name}</Text>
      {children}
    </TouchableOpacity>
  );
};
