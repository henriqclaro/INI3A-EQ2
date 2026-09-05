import { useMemo } from 'react';
import { StyleSheet } from 'react-native';

import { router } from 'expo-router';

import { Appbar } from 'react-native-paper';

import { useThemeMode } from '../contexts/ThemeContext';
import { AppTheme } from '../theme/themes';

export interface CustomHeaderProps {
  route?: {
    name: string;
  };
  options?: {
    title?: string;
    [key: string]: any;
  };
  navigation?: {
    canGoBack?: () => boolean;
    goBack?: () => void;
    [key: string]: any;
  };
  back?: {
    title?: string;
  };
}

export const CustomHeader = ({ navigation, route, options, back }: CustomHeaderProps) => {
  const { theme } = useThemeMode();

  const styles = useMemo(() => createStyles(theme), [theme]);

  const title = options?.title ?? route?.name ?? '';

  const shouldShowBackAction = Boolean(back || navigation?.canGoBack?.());

  return (
    <Appbar.Header elevated style={styles.header}>
      {shouldShowBackAction && (
        <Appbar.BackAction onPress={() => (navigation ? navigation?.goBack?.() : router.back())} />
      )}
      <Appbar.Content title={title} style={styles.headerTitle} titleStyle={styles.headerText} />
    </Appbar.Header>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    header: {
      backgroundColor: theme.colors.background,
    },
    headerTitle: {
      alignItems: 'center',
    },
    headerText: {
      fontSize: 32,
      color: theme.colors.primary,
    },
  });
