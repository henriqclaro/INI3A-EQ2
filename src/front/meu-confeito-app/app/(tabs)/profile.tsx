import { useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { Link } from 'expo-router';

import { Label, PrimaryButton } from '@/src/components';
import { useThemeMode } from '@/src/theme/ThemeContext';
import { AppTheme } from '@/src/theme/themes';

export default function ProfileScreen() {
  const { theme } = useThemeMode();

  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <Image src="/assets/images/icon.png" alt="Foto de Perfil" style={styles.image} />
      <Label placeholder="Nome de Usuário" />

      {/*Botão que chama outra tela (utilizando Link): */}
      <Link href="/edit-profile" asChild>
        <PrimaryButton name="Editar Perfil" />
      </Link>
      
      <PrimaryButton name="Sair da Conta" style={styles.logoutButton} />
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
