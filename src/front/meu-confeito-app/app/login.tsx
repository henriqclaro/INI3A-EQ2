import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import * as Crypto from 'expo-crypto';
import { Link, Stack, router } from 'expo-router';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ActivityIndicator } from 'react-native-paper';

import { CustomButton, Input } from '@/src/components';
import { useAuth } from '@/src/contexts/AuthContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';
import { isEmailValid } from '@/src/utils/validation';

export default function LogInScreen() {
  const { theme } = useThemeMode();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setLoading] = useState(false);
  const [touched, setTouched] = useState({
    email: false,
    password: false,
  });

  const { signIn } = useAuth();

  const isEmailFormatValid = isEmailValid(email);
  const emailError = useMemo(() => {
    if (!touched.email) return '';
    if (!email.trim()) return 'E-mail é obrigatório.';
    if (!isEmailFormatValid) return 'Informe um e-mail válido (ex: seu@email.com).';
    return '';
  }, [email, isEmailFormatValid, touched.email]);

  const passwordError = useMemo(() => {
    if (!touched.password) return '';
    if (!password) return 'Senha é obrigatória.';
    return '';
  }, [password, touched.password]);

  async function handleLogIn() {
    setTouched({ email: true, password: true });

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      Alert.alert('Campos incompletos', 'Preencha o e-mail e a senha para continuar.');
      return;
    }

    if (!isEmailValid(trimmedEmail)) {
      Alert.alert('E-mail inválido', 'Por favor, digite um e-mail em formato válido.');
      return;
    }

    setLoading(true);

    const clientType = Platform.OS;
    const sessionId = Crypto.randomUUID();

    try {
      await signIn({ email: trimmedEmail, password, clientType, sessionId });
      router.replace('/home');
    } catch (error: unknown) {
      console.log('Login error: ', error);
      Alert.alert('Falha no login', 'Verifique suas credenciais e tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Login' }} />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets
        >
          <View style={styles.card}>
            {/* Header section */}
            <View style={styles.headerArea}>
              <Text style={styles.headline}>Entrar</Text>
              <Text style={styles.subheadline}>
                Digite seus dados de acesso para entrar na sua conta
              </Text>
            </View>

            {/* Email input field */}
            <View style={styles.fieldWrapper}>
              <Text style={styles.label}>
                E-mail <Text style={styles.required}>*</Text>
              </Text>
              <Input
                value={email}
                placeholder="exemplo@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={setEmail}
                onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                containerStyle={[styles.inputContainer, !!emailError && styles.inputError]}
                style={styles.inputText}
                placeholderTextColor={theme.colors.placeholder}
              />
              <View style={styles.helperRow}>
                {emailError ? (
                  <>
                    <MaterialCommunityIcons
                      name="alert-circle-outline"
                      size={14}
                      color={theme.colors.primary}
                      style={styles.helperIcon}
                    />
                    <Text style={styles.errorText}>{emailError}</Text>
                  </>
                ) : (
                  <Text style={styles.helperText}>Seu e-mail cadastrado</Text>
                )}
              </View>
            </View>

            {/* Password input field */}
            <View style={styles.fieldWrapper}>
              <Text style={styles.label}>
                Senha <Text style={styles.required}>*</Text>
              </Text>
              <Input
                value={password}
                placeholder="Digite sua senha"
                secureTextEntry
                autoCapitalize="none"
                onChangeText={setPassword}
                onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                containerStyle={[styles.inputContainer, !!passwordError && styles.inputError]}
                style={[styles.inputText, styles.passwordInput]}
                placeholderTextColor={theme.colors.placeholder}
              />
              <View style={styles.helperRow}>
                {passwordError ? (
                  <>
                    <MaterialCommunityIcons
                      name="alert-circle-outline"
                      size={14}
                      color={theme.colors.primary}
                      style={styles.helperIcon}
                    />
                    <Text style={styles.errorText}>{passwordError}</Text>
                  </>
                ) : (
                  <Text style={styles.helperText}>Sua senha de acesso</Text>
                )}
              </View>
            </View>

            {/* Forgot password */}
            <View style={styles.forgotRow}>
              <Link href="/" asChild>
                <TouchableOpacity activeOpacity={0.7}>
                  <Text style={styles.forgotText}>Esqueci a Senha</Text>
                </TouchableOpacity>
              </Link>
            </View>

            {/* Action buttons */}
            <View style={styles.btnActionContainer}>
              {isLoading ? (
                <ActivityIndicator size="large" color={theme.colors.primary} />
              ) : (
                <CustomButton
                  title="Entrar"
                  variant="primary"
                  style={styles.button}
                  onPress={handleLogIn}
                />
              )}

              <Text style={styles.txtRegister}>
                Ainda não tem uma conta?{' '}
                <Link href="/register" asChild>
                  <Text style={styles.linkRegister}>Cadastre-se</Text>
                </Link>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContainer: {
      flexGrow: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
      paddingTop: 24,
      paddingBottom: 80,
    },
    card: {
      width: '100%',
      maxWidth: 460,
      backgroundColor: theme.colors.pitchBackground,
      borderRadius: 16,
      padding: 24,
      borderWidth: 1,
      borderColor: theme.colors.lightGray,
      elevation: 2,
      shadowColor: theme.colors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 10,
      gap: 16,
    },
    headerArea: {
      alignItems: 'center',
      marginBottom: 6,
    },
    headline: {
      fontFamily: 'Playfair Display SC',
      fontSize: 26,
      fontWeight: 'bold',
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: 6,
    },
    subheadline: {
      fontSize: 14,
      color: theme.colors.text,
      opacity: 0.8,
      textAlign: 'center',
      lineHeight: 20,
    },
    fieldWrapper: {
      width: '100%',
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 2,
    },
    required: {
      color: theme.colors.primary,
    },
    inputContainer: {
      width: '100%',
      height: 52,
      margin: 0,
      marginTop: 4,
      paddingLeft: 14,
      paddingRight: 14,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.lightGray,
      backgroundColor: theme.colors.pitchBackground,
    },
    inputError: {
      borderColor: theme.colors.primary,
      borderWidth: 1.5,
    },
    inputText: {
      fontSize: 15,
      color: theme.colors.text,
    },
    passwordInput: {
      paddingRight: 36,
    },
    helperRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
      minHeight: 16,
    },
    helperIcon: {
      marginRight: 4,
    },
    helperText: {
      fontSize: 11,
      color: theme.colors.placeholder,
    },
    errorText: {
      fontSize: 11,
      color: theme.colors.primary,
      fontWeight: '500',
    },
    forgotRow: {
      alignItems: 'flex-end',
      marginTop: -4,
    },
    forgotText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    btnActionContainer: {
      marginTop: 8,
      alignItems: 'center',
      width: '100%',
      gap: 14,
    },
    button: {
      width: '100%',
      margin: 0,
      borderRadius: 8,
      height: 52,
    },
    txtRegister: {
      fontSize: 14,
      color: theme.colors.text,
    },
    linkRegister: {
      color: theme.colors.primary,
      fontWeight: 'bold',
    },
  });
