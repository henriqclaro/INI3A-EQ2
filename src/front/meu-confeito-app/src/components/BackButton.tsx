import { useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { router } from 'expo-router';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useThemeMode } from '../contexts/ThemeContext';
import { AppTheme } from '../theme/themes';

export const BackButton = () => {
  const { theme } = useThemeMode();

  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.btnContainer}>
      <TouchableOpacity style={styles.button} onPress={() => router.back()}>
        <MaterialCommunityIcons name="arrow-left" color={theme.colors.text} size={26} />
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    btnContainer: {
      position: 'absolute',
      top: 20,
      left: 20,
    },
    button: {
      width: 50,
      height: 50,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.background,
      borderWidth: 0.8,
      borderColor: theme.colors.border,
      borderRadius: 100,
    },
  });
