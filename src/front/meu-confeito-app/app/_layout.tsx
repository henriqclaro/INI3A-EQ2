import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
  Stack,
  useRouter,
  useSegments,
} from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';

import { KeyboardProvider } from 'react-native-keyboard-controller';
import { ActivityIndicator, PaperProvider } from 'react-native-paper';
import { pt, registerTranslation } from 'react-native-paper-dates';

import { CustomHeader, DesktopAlert, RateLimitBanner, ToastContainer } from '@/src/components';
import { AuthProvider, useAuth } from '@/src/contexts/AuthContext';
import { SettingsProvider } from '@/src/contexts/SettingsContext';
import { ThemeProvider, useThemeMode } from '@/src/contexts/ThemeContext';
import { ToastProvider } from '@/src/contexts/ToastContext';
import { useRoutePersistence } from '@/src/hooks/useRoutePersistence';
import { AppTheme } from '@/src/theme/themes';

registerTranslation('pt', pt);

function useProtectedRoute() {
  const { user, isLoadingStorage } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoadingStorage) {
      return;
    }

    const isInAuthScreen =
      segments[0] === 'login' || segments[0] === 'register' || segments[0] === undefined;

    if (!user && !isInAuthScreen) {
      router.replace('/login');
    } else if (user && isInAuthScreen) {
      router.replace('/home');
    }
  }, [user, segments, isLoadingStorage, router]);
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const unstable_settings = {
  initialRouteName: 'index',
};

function RootLayoutContent() {
  const { theme, isDarkMode } = useThemeMode();
  const { isLoadingStorage } = useAuth();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const navigationTheme = useMemo(() => {
    const baseNavTheme = isDarkMode ? DarkTheme : DefaultTheme;
    return {
      ...baseNavTheme,
      dark: isDarkMode,
      colors: {
        ...baseNavTheme.colors,
        background: theme.colors.background,
        card: theme.colors.surface,
        text: theme.colors.text,
        border: theme.colors.outlineVariant,
        primary: theme.colors.primary,
        notification: theme.colors.primary,
      },
    };
  }, [isDarkMode, theme]);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(theme.colors.background).catch(() => {});
  }, [theme.colors.background]);

  useProtectedRoute();
  useRoutePersistence();

  if (isLoadingStorage) {
    return (
      <PaperProvider theme={theme}>
        <NavigationThemeProvider value={navigationTheme}>
          <StatusBar style={isDarkMode ? 'light' : 'dark'} />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        </NavigationThemeProvider>
      </PaperProvider>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <NavigationThemeProvider value={navigationTheme}>
        <StatusBar style={isDarkMode ? 'light' : 'dark'} />
        <View style={styles.rootContainer}>
          <Stack
            screenOptions={{
              headerShown: true,
              header: (props) => <CustomHeader {...props} />,
              contentStyle: { backgroundColor: theme.colors.background },
              navigationBarColor: theme.colors.background,
            }}
          >
            <Stack.Screen name="index" options={{ title: 'Bem-Vindo' }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ title: 'Login' }} />
            <Stack.Screen name="register" options={{ title: 'Cadastro' }} />
            <Stack.Screen name="single-recipe" options={{ title: 'Receita' }} />
            <Stack.Screen name="public-recipes" options={{ title: 'Receitas Públicas' }} />
            <Stack.Screen name="stock" options={{ title: 'Estoque' }} />
            <Stack.Screen name="register-stock" options={{ title: 'Cadastrar no Estoque' }} />
            <Stack.Screen name="create-recipe" options={{ title: 'Cadastrar Receita' }} />
            <Stack.Screen name="edit-recipe" options={{ title: 'Editar Receita' }} />
            <Stack.Screen name="edit-profile" options={{ title: 'Editar Perfil' }} />
            <Stack.Screen name="public-profile" options={{ title: 'Perfil Público' }} />
            <Stack.Screen name="productions" options={{ title: 'Histórico de Produções' }} />
            <Stack.Screen name="saved-recipes" options={{ title: 'Receitas Salvas' }} />
            <Stack.Screen name="archived-recipes" options={{ title: 'Receitas Arquivadas' }} />
            <Stack.Screen name="search-bakers" options={{ title: 'Buscar Confeitarias' }} />
            <Stack.Screen name="settings" options={{ title: 'Configurações' }} />
            <Stack.Screen name="reset-password" options={{ title: 'Alterar Senha' }} />
            <Stack.Screen name="management" options={{ title: 'Gerenciamento' }} />
            <Stack.Screen name="my-reviews" options={{ title: 'Minhas Avaliações' }} />
          </Stack>
          <DesktopAlert />
          <RateLimitBanner />
          <ToastContainer />
        </View>
      </NavigationThemeProvider>
    </PaperProvider>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    rootContainer: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
  });

export default function RootLayout() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <ToastProvider>
          <AuthProvider>
            <KeyboardProvider statusBarTranslucent navigationBarTranslucent>
              <RootLayoutContent />
            </KeyboardProvider>
          </AuthProvider>
        </ToastProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}
