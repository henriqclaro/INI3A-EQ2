import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { KeyboardProvider } from 'react-native-keyboard-controller';
import { ActivityIndicator, PaperProvider } from 'react-native-paper';
import { pt, registerTranslation } from 'react-native-paper-dates';

import { CustomHeader, DesktopAlert } from '@/src/components';
import { AuthProvider, useAuth } from '@/src/contexts/AuthContext';
import { SettingsProvider } from '@/src/contexts/SettingsContext';
import { ThemeProvider, useThemeMode } from '@/src/contexts/ThemeContext';
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

  useProtectedRoute();

  if (isLoadingStorage) {
    return (
      <PaperProvider theme={theme}>
        <StatusBar style={isDarkMode ? 'light' : 'dark'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </PaperProvider>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: true,
          header: (props) => <CustomHeader {...props} />,
          contentStyle: { backgroundColor: theme.colors.background },
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
        <Stack.Screen name="search-bakers" options={{ title: 'Buscar Confeitarias' }} />
        <Stack.Screen name="settings" options={{ title: 'Configurações' }} />
        <Stack.Screen name="reset-password" options={{ title: 'Alterar Senha' }} />
      </Stack>
      <DesktopAlert />
    </PaperProvider>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
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
        <AuthProvider>
          <KeyboardProvider statusBarTranslucent navigationBarTranslucent>
            <RootLayoutContent />
          </KeyboardProvider>
        </AuthProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}
