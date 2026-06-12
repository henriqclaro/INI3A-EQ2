import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Image } from 'expo-image';
import { Link, router } from 'expo-router';

import { CustomButton, Label } from '@/src/components';
import { useAuth } from '@/src/contexts/AuthContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';

export default function ProfileScreen() {
  const { theme } = useThemeMode();

  const { user, signOut } = useAuth();

  const styles = useMemo(() => createStyles(theme), [theme]);

  function handleLogOut() {
    try {
      signOut();

      router.replace('/');
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  }

  return (
    <View style={styles.container}>
      {user?.pfpUrl ? (
        <Image
          source={{ uri: user?.pfpUrl }}
          alt="Foto de Perfil"
          style={styles.image}
          contentFit="cover"
        />
      ) : (
        <View style={styles.image}></View>
      )}
      <Label text={user?.name} placeholder="Nome de Usuário" />

      {/*Botão que chama outra tela (utilizando Link): */}
      <Link href="/edit-profile" asChild>
        <CustomButton title="Editar Perfil" />
      </Link>

      <CustomButton
        title="Sair da Conta"
        variant="secondary"
        style={styles.logoutButton}
        onPress={handleLogOut}
      />
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      alignItems: 'center',
      paddingTop: 80,
    },
    image: {
      backgroundColor: theme.colors.placeholder,
      width: 200,
      height: 200,
      borderRadius: 100,
      margin: 10,
    },
    logoutButton: {
      position: 'absolute',
      bottom: 20,
    },
  });
