import { useMemo } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

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

  async function handleLogOut() {
    try {
      await signOut();
      router.replace('/');
    } catch (error) {
      console.error('Error signing out: ', error);
      Alert.alert('Erro ao sair da conta.');
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {user?.pfpUrl ? (
          <Image
            source={{ uri: user.pfpUrl }}
            alt="Foto de Perfil"
            style={styles.image}
            contentFit="cover"
          />
        ) : (
          <View style={styles.image} />
        )}

        <Label
          text={user?.name ? user.name.toUpperCase() : undefined}
          placeholder="Nome de Usuário"
          //style={styles.name}
        />

        {user?.email ? <Text style={styles.email}>{user.email}</Text> : null}

        <Link href="/edit-profile" asChild>
          <CustomButton title="Editar Perfil" style={styles.editButton} />
        </Link>

        <CustomButton
          title="Sair da Conta"
          variant="secondary"
          style={styles.logoutButton}
          onPress={handleLogOut}
        />
      </View>
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.md,
    },
    card: {
      backgroundColor: theme.colors.pitchBackground,
      borderWidth: 1,
      borderColor: theme.colors.secBorder,
      borderRadius: 16,
      paddingVertical: theme.spacing.lg,
      paddingHorizontal: theme.spacing.md,
      alignItems: 'center',
      width: '100%',
    },
    image: {
      width: 110,
      height: 110,
      borderRadius: 55,
      borderWidth: 3,
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.lightGray,
      marginBottom: theme.spacing.md,
    },
    name: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      textAlign: 'center',
      letterSpacing: 0.5,
    },
    email: {
      fontSize: 14,
      color: theme.colors.text,
      marginTop: 4,
      marginBottom: theme.spacing.sm,
      textAlign: 'center',
    },
    editButton: {
      width: '100%',
      marginTop: theme.spacing.md,
    },
    logoutButton: {
      width: '100%',
      marginTop: theme.spacing.sm,
    },
  });
