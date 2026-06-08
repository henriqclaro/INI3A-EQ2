import { useMemo } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

import { Href, Link } from 'expo-router';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useThemeMode } from '../contexts/ThemeContext';
import { AppTheme } from '../theme/themes';

interface BackButtonProps {
  route: Href;
}

export const BackButton = ({ route }: BackButtonProps) => {
  const { theme } = useThemeMode();

  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Link href={route} asChild style={styles.btnContainer}>
      <TouchableOpacity style={styles.button}>
        <MaterialCommunityIcons name="arrow-left" color={theme.colors.text} size={26} />
      </TouchableOpacity>
    </Link>
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
