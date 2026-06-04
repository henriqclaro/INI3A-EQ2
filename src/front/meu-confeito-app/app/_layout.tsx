import { Stack } from 'expo-router';

import { PaperProvider } from 'react-native-paper';

import { ThemeProvider, useThemeMode } from '@/src/theme/ThemeContext';

function RootLayoutContent() {
  const { theme } = useThemeMode();

  return (
    <PaperProvider theme={theme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </PaperProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  );
}
