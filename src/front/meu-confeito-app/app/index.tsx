import { useMemo } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Link, Stack, router } from 'expo-router';

import { CustomButton } from '@/src/components';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';

export default function ReportsScreen() {
  const { theme } = useThemeMode();

  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <>
      <Stack.Screen options={{ title: 'Bem-Vindo' }} />

      <View style={styles.container}>
        <Image source={require('../assets/images/logo.svg')} style={styles.logo} />
        <Text style={styles.text}>
          Seja bem-vindo(a) ao MeuConfeito! Um aplicativo pensado para auxiliar confeiteiras que
          desejam organizar suas produções, projetar suas vendas e armazenar suas receitas.
        </Text>
        <Link href="/login">
          <CustomButton title="Sou Confeiteira" />
        </Link>
        <Link href="/login">
          <CustomButton title="Sou Cliente" />
        </Link>
        <TouchableOpacity style={styles.botaoCadastrar} onPress={() => router.push('/register')}>
          <Text style={styles.textoBotao}>Cadastrar</Text>
        </TouchableOpacity>
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
    text: {
      color: theme.colors.text,
      textAlign: 'center',
      padding: 20,
    },
    logo: {
      width: 150,
      height: 150,
      resizeMode: 'contain',
      marginBottom: 20,
    },
    botaoCadastrar: {
      backgroundColor: '#FFFFFF',
      width: '85%',
      height: 48,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: '#F69AA5',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 10,
      elevation: 1,
    },
    textoBotao: {
      color: '#40242B',
      fontSize: 16,
      fontWeight: 'bold',
    },
  });
