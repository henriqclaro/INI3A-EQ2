import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Image } from 'expo-image';
import { Link, Stack } from 'expo-router';

import { CustomButton } from '@/src/components';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';

export default function WelcomeScreen() {
  const { theme } = useThemeMode();

  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <>
      <Stack.Screen options={{ title: 'Bem-Vindo' }} />

      <View style={styles.container}>
        <Image source={require('../assets/images/logo.svg')} style={styles.logo} />

        <Text style={styles.mainText}>Seja bem-vindo(a) ao MeuConfeito!</Text>
        <Text style={styles.text}>
          Um aplicativo pensado para auxiliar confeiteiras que desejam organizar suas produções,
          projetar suas vendas e armazenar suas receitas.
        </Text>

        <Link href="/register" asChild>
          <CustomButton title="Cadastrar como Confeiteira" variant='primary' />
        </Link>

        <Link href="/register" asChild>
          <CustomButton title="Cadastrar como Cliente" variant='secondary' /> 
        </Link>

        <Link href="/login" asChild>
          <CustomButton title="Já tenho cadastro" variant='neutral' />
        </Link>
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
    mainText: {
      color: theme.colors.text,
      textAlign: 'center',
      padding: 15,
      fontSize: 25,
      fontWeight: 'bold',
      fontFamily: 'Playfair Display SC',
    },
    text: {
      color: theme.colors.text,
      textAlign: 'center',
      padding: 20,
      fontSize: 20,
      marginBottom: 35,
    },
    logo: {
      width: 225,
      height: 225,
      resizeMode: 'contain',
      marginBottom: 10,
    },
  });
