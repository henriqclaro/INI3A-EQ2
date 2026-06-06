import { StyleSheet, Text, View } from 'react-native';

import { useThemeMode } from '@/src/theme/ThemeContext';
import { AppTheme } from '@/src/theme/themes';

export default function HomeScreen() {
  const { theme } = useThemeMode();

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <Text>Oie</Text>
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      alignItems: 'center',
    },
  });
