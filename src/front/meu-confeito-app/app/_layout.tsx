import { Stack } from 'expo-router';

import { PaperProvider } from 'react-native-paper';

import { CustomHeader } from '@/src/components';
import { AuthProvider } from '@/src/contexts/AuthContext';
import { ThemeProvider, useThemeMode } from '@/src/contexts/ThemeContext';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const unstable_settings = {
  initialRouteName: 'index',
};

function RootLayoutContent() {
  const { theme } = useThemeMode();

  return (
    <AuthProvider>
      <PaperProvider theme={theme}>
        <Stack
          screenOptions={{
            headerShown: true,

            header: (props) => <CustomHeader {...props} />,
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </PaperProvider>
    </AuthProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  );
}
