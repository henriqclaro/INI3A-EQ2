import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Stack } from 'expo-router';

import { useThemeMode } from '@/src/theme/ThemeContext';
import { AppTheme } from '@/src/theme/themes';

export default function ReportsScreen() {
  const { theme } = useThemeMode();

  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <>
      <Stack.Screen options={{ title: 'Cadastro' }} />

      <View style={styles.container}>
        <Text>Oie</Text>
      </View>
    </>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      alignItems: 'center',
    },
  });
