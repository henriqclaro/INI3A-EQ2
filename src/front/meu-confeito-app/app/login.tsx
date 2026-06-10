import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Link, Stack } from 'expo-router';

import { BackButton, CustomButton, Input } from '@/src/components';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';

export default function ReportsScreen() {
  const { theme } = useThemeMode();

  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <>
      <Stack.Screen options={{ title: 'Login' }} />

      <View style={styles.container}>
        <BackButton route="/" />

        <Text style={styles.mainText}>Digite seus dados:</Text>

        <Input
          placeholder="@email"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Input placeholder="senha" secureTextEntry autoCapitalize="none" />

        {/*<Link href="/forgot" style={styles.forgotContainer}>
          <TouchableOpacity>
            <Text style={styles.forgotText}>Esqueci a sSenha</Text>
          </TouchableOpacity>
        </Link>*/}

        <Link href="/home">
          <CustomButton title="Cadastrar" variant="secondary" />
        </Link>
      </View>
      <CustomButton title="Esqueci a Senha" />
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
      marginTop: 20,
      marginBottom: 1,
      padding: 60,
      fontSize: 28,
      fontWeight: 'bold',
      fontFamily: 'Playfair Display SC',
    },
    forgotContainer: {
      marginBottom: 20,
    },
    forgotText: {
      color: theme.colors.text,
      fontSize: 14,
      fontWeight: 'bold',
    },
  });
