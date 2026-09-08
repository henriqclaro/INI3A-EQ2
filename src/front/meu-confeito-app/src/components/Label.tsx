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
      minHeight: theme.spacing.touchable,
      height: 48,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.rounded.default,
      paddingVertical: theme.spacing.space3,
      paddingHorizontal: theme.spacing.space4,
      justifyContent: 'center',
      alignItems: 'center',
      margin: theme.spacing.space3,
      ...theme.shadows.soft,
    },
    lblText: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 15,
      fontWeight: '500',
      color: theme.colors.espressoDark,
    },
  });
