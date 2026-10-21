import { ReactNode, useMemo } from 'react';
import { StyleProp, StyleSheet, TextStyle, View, ViewStyle } from 'react-native';

import { router } from 'expo-router';

import { Appbar } from 'react-native-paper';

import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';

import { MaterialSymbol } from './MaterialSymbol';

export interface CustomHeaderOptions {
  title?: string;
  headerTitle?: string | ((props: { children: string; tintColor?: string }) => ReactNode);
  headerBackVisible?: boolean;
  headerTintColor?: string;
  headerStyle?: StyleProp<ViewStyle>;
  headerTitleStyle?: StyleProp<TextStyle>;
  headerRight?: (props: { canGoBack?: boolean }) => ReactNode;
}

export interface CustomHeaderProps {
  route?: {
    name: string;
    key?: string;
    params?: object;
  };
  options?: unknown;
  navigation?: {
    canGoBack?: () => boolean;
    goBack?: () => void;
  };
  back?: {
    title?: string;
    href?: string;
  };
}

export const CustomHeader = ({
  navigation,
  route,
  options: rawOptions,
  back,
}: CustomHeaderProps) => {
  const { theme } = useThemeMode();
  const options = (rawOptions ?? {}) as CustomHeaderOptions;

  const styles = useMemo(() => createStyles(theme), [theme]);

  const title =
    typeof options.headerTitle === 'string'
      ? options.headerTitle
      : (options.title ?? route?.name ?? '');

  const isBackDisabled = options.headerBackVisible === false;
  const isBackForced = options.headerBackVisible === true;
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

  const backColor =
    typeof options.headerTintColor === 'string'
      ? options.headerTintColor
      : theme.colors.espressoDark;

  return (
    <Appbar.Header mode="small" elevated={false} style={[styles.header, options.headerStyle]}>
      {shouldShowBackAction && (
        <Appbar.Action
          isLeading
          icon={({ size, color }) => <MaterialSymbol name="arrow_back" size={size} color={color} />}
          color={backColor}
          size={24}
          onPress={handleBack}
          style={styles.backAction}
          accessibilityLabel="Voltar para a tela anterior"
        />
      )}
      <Appbar.Content
        title={title}
        style={[
          styles.headerTitleContainer,
          !shouldShowBackAction && styles.headerTitleContainerNoBack,
        ]}
        titleStyle={[styles.headerText, options.headerTitleStyle]}
      />
      {typeof options.headerRight === 'function' && (
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
      fontFamily: theme.typography.headlineLg.fontFamily,
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
