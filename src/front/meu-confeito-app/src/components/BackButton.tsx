import { useMemo } from 'react';
import { StyleSheet } from 'react-native';

import { router } from 'expo-router';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useThemeMode } from '../contexts/ThemeContext';
import { AppTheme } from '../theme/themes';
import { FloatingButton } from './FloatingButton';

export const BackButton = () => {
  const { theme } = useThemeMode();

  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <FloatingButton onPress={() => router.back()} variant="neutral" style={styles.button}>
      <MaterialCommunityIcons name="arrow-left-circle-outline" color={theme.colors.text} size={32} />
    </FloatingButton>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    button: {
      position: 'absolute',
      top: 20,
      left: 10,
      zIndex: 10,
    },
  });
