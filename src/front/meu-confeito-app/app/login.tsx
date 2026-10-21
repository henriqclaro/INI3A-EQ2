import { useMemo, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';

import * as Crypto from 'expo-crypto';
import { Image } from 'expo-image';
import { Link, Stack, router } from 'expo-router';

import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { ActivityIndicator } from 'react-native-paper';

import { CustomButton, Input, MaterialSymbol, RateLimitLabel } from '@/src/components';
import { useAuth } from '@/src/contexts/AuthContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { isUserAccountGoneError } from '@/src/services/api';
import { AppTheme } from '@/src/theme/themes';
import { getRateLimitInfo, isRateLimitError } from '@/src/utils/rateLimit';
import { isEmailValid } from '@/src/utils/validation';

export default function LogInScreen() {
  const { theme, isDarkMode } = useThemeMode();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setLoading] = useState(false);
  const [touched, setTouched] = useState({
    email: false,
    password: false,
  });

  const [rateLimitNotice, setRateLimitNotice] = useState<{
    message: string;
    retryAfterSeconds?: number;
  } | null>(null);

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
      if (isRateLimitError(error)) {
        const info = getRateLimitInfo(error);
        setRateLimitNotice({
          message: info.message,
          retryAfterSeconds: info.retryAfterSeconds,
        });
        Alert.alert('Limite de Tentativas', info.message);
      } else if (isUserAccountGoneError(error)) {
        const apiErr = error as { response?: { data?: { message?: string } } };
        const message =
          apiErr.response?.data?.message ||
          'Esta conta foi banida pela moderação ou desativada e não possui mais acesso à plataforma.';
        Alert.alert('Conta Banida ou Desativada', message);
      } else {
        Alert.alert('Falha no login', 'Verifique suas credenciais e tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Login' }} />

      <KeyboardAwareScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        bottomOffset={64}
      >
        <View style={styles.card}>
          {/* Header section */}
          <View style={styles.headerArea}>
            <Image
              source={
                isDarkMode
                  ? require('@/assets/images/logo-dark.png')
                  : require('@/assets/images/logo-light.png')
              }
              style={styles.logo}
              contentFit="contain"
            />
            <Text style={styles.headline}>Entrar</Text>
            <Text style={styles.subheadline}>
              Digite seus dados de acesso para entrar na sua conta
            </Text>
          </View>

          {/* Email input field */}
          <View style={styles.fieldWrapper}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>
                E-mail <Text style={styles.required}>*</Text>
              </Text>
              {touched.email && isEmailFormatValid && (
                <MaterialSymbol name="check_circle" size={16} color={theme.colors.tertiary} />
              )}
            </View>
            <Input
              value={email}
              placeholder="exemplo@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={(text) => {
                setEmail(text);
                if (rateLimitNotice) setRateLimitNotice(null);
              }}
              onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
              containerStyle={[
                styles.inputContainer,
                !!emailError && styles.inputError,
                touched.email && !emailError && isEmailFormatValid && styles.inputSuccess,
              ]}
              style={styles.inputText}
              placeholderTextColor={theme.colors.placeholder}
            />
            <View style={styles.helperRow}>
              {emailError ? (
                <>
                  <MaterialSymbol
                    name="error"
                    size={14}
                    color={theme.colors.error}
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
            <View style={styles.labelRow}>
              <Text style={styles.label}>
                Senha <Text style={styles.required}>*</Text>
              </Text>
              {touched.password && !passwordError && password.length >= 8 && (
                <MaterialSymbol name="check_circle" size={16} color={theme.colors.tertiary} />
              )}
            </View>
            <Input
              value={password}
              placeholder="Digite sua senha"
              secureTextEntry
              autoCapitalize="none"
              onChangeText={(text) => {
                setPassword(text);
                if (rateLimitNotice) setRateLimitNotice(null);
              }}
              onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
              containerStyle={[
                styles.inputContainer,
                !!passwordError && styles.inputError,
                touched.password && !passwordError && password.length >= 8 && styles.inputSuccess,
              ]}
              style={[styles.inputText, styles.passwordInput]}
              placeholderTextColor={theme.colors.placeholder}
            />
            <View style={styles.helperRow}>
              {passwordError ? (
                <>
                  <MaterialSymbol
                    name="error"
                    size={14}
                    color={theme.colors.error}
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
          {/* <View style={styles.forgotRow}>
            <Link href="/" asChild>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.forgotText}>Esqueci a Senha</Text>
              </TouchableOpacity>
            </Link>
          </View> */}

          {/* Action buttons */}
          <View style={styles.btnActionContainer}>
            {rateLimitNotice && (
              <RateLimitLabel
                message={rateLimitNotice.message}
                retryAfterSeconds={rateLimitNotice.retryAfterSeconds}
                onDismiss={() => setRateLimitNotice(null)}
              />
            )}

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
      </KeyboardAwareScrollView>
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
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.rounded.lg,
      padding: 24,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      gap: 16,
      ...theme.shadows.soft,
    },
    headerArea: {
      alignItems: 'center',
      marginBottom: 6,
    },
    logo: {
      width: 80,
      height: 80,
      marginBottom: 8,
    },
    headline: {
      fontFamily: theme.typography.headlineLg.fontFamily,
      fontSize: 26,
      color: theme.colors.espressoDark,
      textAlign: 'center',
      marginBottom: 6,
    },
    subheadline: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      lineHeight: 20,
    },
    fieldWrapper: {
      width: '100%',
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 2,
    },
    label: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    required: {
      color: theme.colors.primary,
    },
    inputContainer: {
      width: '100%',
      height: 48,
      margin: 0,
      marginTop: 4,
      paddingLeft: 14,
      paddingRight: 14,
      borderRadius: theme.rounded.sm,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surfaceContainerLowest,
    },
    inputError: {
      borderColor: theme.colors.error,
      borderWidth: 1.5,
    },
    inputSuccess: {
      borderColor: theme.colors.tertiary,
    },
    inputText: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 15,
      color: theme.colors.onSurface,
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
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
    },
    errorText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 11,
      color: theme.colors.error,
      fontWeight: '500',
    },
    forgotRow: {
      alignItems: 'flex-end',
      marginTop: -4,
    },
    forgotText: {
      fontFamily: theme.typography.labelMd.fontFamily,
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
      borderRadius: theme.rounded.default,
      height: 48,
    },
    txtRegister: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 14,
      color: theme.colors.onSurface,
    },
    linkRegister: {
      fontFamily: theme.typography.labelMd.fontFamily,
      color: theme.colors.primary,
      fontWeight: '700',
    },
  });
