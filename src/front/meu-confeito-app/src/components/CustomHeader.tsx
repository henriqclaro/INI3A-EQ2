import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { router } from 'expo-router';

import { Appbar } from 'react-native-paper';

import { useThemeMode } from '../contexts/ThemeContext';
import { AppTheme } from '../theme/themes';

export interface CustomHeaderProps {
  route?: {
    name: string;
    [key: string]: any;
  };
  options?: any;
  navigation?: any;
  back?: {
    title?: string;
    [key: string]: any;
  };
}

export const CustomHeader = ({ navigation, route, options, back }: CustomHeaderProps) => {
  const { theme } = useThemeMode();

  const styles = useMemo(() => createStyles(theme), [theme]);

  const title =
    typeof options?.headerTitle === 'string'
      ? options.headerTitle
      : (options?.title ?? route?.name ?? '');

  const isBackDisabled = options?.headerBackVisible === false;
  const isBackForced = options?.headerBackVisible === true;
  const canGoBack = Boolean(back);
  const shouldShowBackAction = !isBackDisabled && (canGoBack || isBackForced);

  const handleBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation?.goBack?.();
    } else if (router.canGoBack()) {
      router.back();
    } else if (route?.name === 'login' || route?.name === 'register') {
      router.replace('/');
    } else {
      router.replace('/(tabs)/home');
    }
  };

  const backColor = options?.headerTintColor ?? theme.colors.espressoDark;

  return (
    <Appbar.Header mode="small" elevated={false} style={[styles.header, options?.headerStyle]}>
      {shouldShowBackAction && (
        <Appbar.BackAction
          color={backColor}
          size={24}
          onPress={handleBack}
          style={styles.backAction}
        />
      )}
      <Appbar.Content
        title={title}
        style={[
          styles.headerTitleContainer,
          !shouldShowBackAction && styles.headerTitleContainerNoBack,
        ]}
        titleStyle={[styles.headerText, options?.headerTitleStyle]}
      />
      {options?.headerRight && (
        <View style={styles.headerRight}>
          {options.headerRight({ canGoBack: shouldShowBackAction })}
        </View>
      )}
    </Appbar.Header>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    header: {
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
      height: 64,
      justifyContent: 'center',
    },
    backAction: {
      marginLeft: 4,
      marginRight: 0,
    },
    headerTitleContainer: {
      alignItems: 'flex-start',
      justifyContent: 'center',
      marginLeft: 4,
    },
    headerTitleContainerNoBack: {
      marginLeft: 16,
    },
    headerText: {
      fontSize: 22,
      lineHeight: 28,
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontWeight: '600',
      color: theme.colors.espressoDark,
      letterSpacing: 0.5,
      textAlign: 'left',
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 8,
    },
  });
