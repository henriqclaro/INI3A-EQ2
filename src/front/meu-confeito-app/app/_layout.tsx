import { Stack } from 'expo-router';

import { PaperProvider } from 'react-native-paper';

import { CustomHeader } from '@/src/components';
import { ThemeProvider, useThemeMode } from '@/src/theme/ThemeContext';

function RootLayoutContent() {
  const { theme } = useThemeMode();

  return (
    <PaperProvider theme={theme}>
      <Stack
        screenOptions={{
          headerShown: true,

          header: (props) => <CustomHeader {...props} />,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
