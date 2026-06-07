import { useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { Stack } from 'expo-router';

import { BackButton, Input } from '@/src/components';
import { useThemeMode } from '@/src/theme/ThemeContext';
import { AppTheme } from '@/src/theme/themes';

export default function EditProfileScreen() {
  const { theme } = useThemeMode();

  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <>
      <Stack.Screen options={{ title: 'Editar Perfil' }} />

      <View style={styles.container}>
        <BackButton route="/(tabs)/profile" />
        <Image src="/assets/images/icon.png" alt="Foto de Perfil" style={styles.image} />
        <Input placeholder="Nome de Usuário" />
        <Input placeholder="Email de Usuário" keyboardType="email-address" />
        <Input placeholder="Telefone de Usuário" keyboardType="number-pad" />
      </View>
    </>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      alignItems: 'center',
    },
    image: {
      backgroundColor: theme.colors.placeholder,
      width: 200,
      height: 200,
      borderRadius: 100,
      margin: 10,
    },
  });
