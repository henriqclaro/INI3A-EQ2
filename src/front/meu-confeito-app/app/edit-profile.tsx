import { useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { Stack } from 'expo-router';

import { BackButton, Input } from '@/src/components';
import { useAuth } from '@/src/contexts/AuthContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';

export default function EditProfileScreen() {
  const { theme } = useThemeMode();

  const { user } = useAuth();

  const styles = useMemo(() => createStyles(theme), [theme]);

  // Telas fora da pasta de abas necessitam de declaração de nome:
  return (
    <>
      <Stack.Screen options={{ title: 'Editar Perfil' }} />

      <View style={styles.container}>
        <BackButton route="/(tabs)/profile" />
        <Image alt="Foto de Perfil" style={styles.image} />
        <Input value={user?.name} placeholder="Nome de Usuário" />
        <Input value={user?.email} placeholder="Email de Usuário" keyboardType="email-address" />
        <Input
          value={user?.phone ? user.phone : ''}
          placeholder="Telefone de Usuário"
          keyboardType="number-pad"
        />
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
