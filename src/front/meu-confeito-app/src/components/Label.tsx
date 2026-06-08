import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useThemeMode } from '../contexts/ThemeContext';
import { AppTheme } from '../theme/themes';

interface LabelProps {
  text?: string;
  placeholder?: string;
}

export const Label = ({ text, placeholder }: LabelProps) => {
  const { theme } = useThemeMode();

  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <Text style={styles.lblText}>{text || placeholder}</Text>
    </View>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      width: 250,
      height: 55,
      borderWidth: 0.8,
      backgroundColor: theme.colors.pitchBackground,
      borderRadius: 10,
      paddingVertical: 12,
      justifyContent: 'center',
      alignItems: 'center',
      margin: 12,
    },
    lblText: {
      fontSize: 18,
      color: theme.colors.text,
    },
  });
