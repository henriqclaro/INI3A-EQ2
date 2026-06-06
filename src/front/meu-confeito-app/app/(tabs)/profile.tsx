import { StyleSheet, View } from 'react-native';

import { Link } from 'expo-router';

import { PrimaryButton } from '@/src/components/PrimaryButton';
import { useThemeMode } from '@/src/theme/ThemeContext';
import { AppTheme } from '@/src/theme/themes';

export default function ProfileScreen() {
  const { theme } = useThemeMode();

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <Link href="/edit-profile" asChild>
        <PrimaryButton name="Editar Perfil" />
      </Link>
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
