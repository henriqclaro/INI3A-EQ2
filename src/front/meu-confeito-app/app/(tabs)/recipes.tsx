import { useMemo } from 'react';
import { StyleSheet, Text, View, } from 'react-native';

import { Link } from 'expo-router';

import {PrimaryButton } from '@/src/components';

import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';

export default function RecipesScreen() {
  const { theme } = useThemeMode();

  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <Text>Oie</Text>
      <Link href="/unique-recipe" asChild>
        <PrimaryButton name="Receita Unitária" />
      </Link>
    </View>
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
