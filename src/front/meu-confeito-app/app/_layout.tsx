import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Slot, Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { ActivityIndicator, PaperProvider } from 'react-native-paper';

import { CustomHeader } from '@/src/components';
import { AuthProvider, useAuth } from '@/src/contexts/AuthContext';
import { ThemeProvider, useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';

function RootNavigation() {
  const { user, isLoadingStorage } = useAuth();
  const { theme } = useThemeMode();
  const segments = useSegments();
  const router = useRouter();
  const styles = useMemo(() => createStyles(theme), [theme]);

  useEffect(() => {
    if (isLoadingStorage) {
      return;
    }

    const inAuthScreen =
      segments[0] === 'login' || segments[0] === 'register' || segments[0] === undefined;

    if (!user && !inAuthScreen) {
      router.replace('/login');
    } else if (user && inAuthScreen) {
      router.replace('/home');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, segments]);

  if (isLoadingStorage) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return <Slot />;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const unstable_settings = {
  initialRouteName: 'index',
};

function RootLayoutContent() {
  const { theme, isDarkMode } = useThemeMode();

  return (
    <AuthProvider>
      <PaperProvider theme={theme}>
        <StatusBar style={isDarkMode ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerShown: true,
            header: (props) => <CustomHeader {...props} />,
            contentStyle: { backgroundColor: theme.colors.background },
          }}
        >
          <RootNavigation />
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
          <Stack.Screen name="settings" options={{ title: 'Configurações' }} />
        </Stack>
      </PaperProvider>
    </AuthProvider>
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
      <RootLayoutContent />
    </ThemeProvider>
  );
}
