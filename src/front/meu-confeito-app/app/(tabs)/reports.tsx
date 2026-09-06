import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';

export default function ReportsScreen() {
  const { theme } = useThemeMode();

  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <Text></Text>
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      alignItems: 'center',
      paddingTop: 16,
    },
  });
