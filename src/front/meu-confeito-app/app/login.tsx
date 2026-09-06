import { useMemo, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import * as Crypto from 'expo-crypto';
import { Link, Stack, router } from 'expo-router';

import { ActivityIndicator } from 'react-native-paper';

import { CustomButton, Input } from '@/src/components';
import { useAuth } from '@/src/contexts/AuthContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';

export default function LogInScreen() {
  const { theme } = useThemeMode();

  const styles = useMemo(() => createStyles(theme), [theme]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setLoading] = useState(false);

  const { signIn } = useAuth();

  async function handleLogIn() {
    if (!email || !password) {
      Alert.alert('Preencha todos os campos.');
      return;
    }

    setLoading(true);

    const clientType = Platform.OS;

    const sessionId = Crypto.randomUUID();

    try {
      await signIn({ email, password, clientType, sessionId });

      router.replace('/home');
    } catch (error) {
      console.log(error);
      Alert.alert('Falha no LogIn');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Login' }} />

      <View style={styles.container}>
        {/* <BackButton /> */}
        <Text style={styles.mainText}>Digite seus dados:</Text>
        <Input
          value={email}
          placeholder="@email"
          keyboardType="email-address"
          autoCapitalize="none"
          onChangeText={setEmail}
        />
        <Input
          value={password}
          placeholder="senha"
          secureTextEntry
          autoCapitalize="none"
          onChangeText={setPassword}
        />
        <Link href="/" style={styles.forgotContainer}>
          <TouchableOpacity>
            <Text style={styles.forgotText}>Esqueci a Senha</Text>
          </TouchableOpacity>
        </Link>
        {isLoading ? (
          <ActivityIndicator size="large" />
        ) : (
          <CustomButton title="Entrar" variant="secondary" onPress={handleLogIn} />
        )}
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
      paddingHorizontal: 20,
      paddingTop: 16,
    },
    mainText: {
      color: theme.colors.text,
      textAlign: 'center',
      marginTop: 16,
      marginBottom: 24,
      fontSize: 24,
      fontWeight: 'bold',
      fontFamily: 'Playfair Display SC',
    },
    forgotContainer: {
      width: 100,
      marginBottom: 15,
    },
    forgotText: {
      textAlign: 'center',
      color: theme.colors.text,
      fontSize: 14,
      fontWeight: 'bold',
    },
  });
