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
import { Image } from 'expo-image';
import { Link, Stack, router, useLocalSearchParams } from 'expo-router';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ActivityIndicator } from 'react-native-paper';

import { CustomButton, Input } from '@/src/components';
import { useAuth } from '@/src/contexts/AuthContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { useUserRegister } from '@/src/hooks/useUsers';
import { AppTheme } from '@/src/theme/themes';
import {
  E164_REGEX,
  EMAIL_REGEX,
  isEmailValid as checkEmailValid,
  isNameValid as checkNameValid,
  isPasswordValid as checkPasswordValid,
  formatPhoneInput,
  toE164,
} from '@/src/utils/validation';

export default function RegisterScreen() {
  const params = useLocalSearchParams<{ role?: string }>();
  const initialRole = params.role === 'CUSTOMER' ? 'CUSTOMER' : 'BAKER';
  const [selectedRole, setSelectedRole] = useState<'BAKER' | 'CUSTOMER' | null>(null);
  const role = selectedRole ?? initialRole;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passVef, setPassVef] = useState('');
  const [phone, setPhone] = useState('');

  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    passVef: false,
    phone: false,
  });

  const { registerUser, isLoading } = useUserRegister();
  const { signIn } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const isSubmitting = isLoading || isLoggingIn;

  const { theme, isDarkMode } = useThemeMode();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handlePhoneChange = (text: string) => {
    if (text.length < phone.length) {
      const rawClean = text.replace(/[^\d+]/g, '');
      setPhone(formatPhoneInput(rawClean));
      return;
    }
    setPhone(formatPhoneInput(text));
  };

  const isNameValid = checkNameValid(name);
  const isEmailValid = checkEmailValid(email);
  const isPasswordValid = checkPasswordValid(password);
  const isPassVefValid = passVef.length > 0 && passVef === password;
  const isPhoneValid = role === 'CUSTOMER' || !phone.trim() || E164_REGEX.test(toE164(phone));

  const getNameError = () => {
    if (!touched.name) return '';
    if (!name.trim()) return 'Nome completo é obrigatório.';
    if (name.trim().length < 3) return 'O nome deve ter pelo menos 3 caracteres.';
    return '';
  };

  const getEmailError = () => {
    if (!touched.email) return '';
    if (!email.trim()) return 'E-mail é obrigatório.';
    if (!EMAIL_REGEX.test(email.trim())) return 'Informe um e-mail válido (ex: seu@email.com).';
    return '';
  };

  const getPasswordError = () => {
    if (!touched.password) return '';
    if (!password) return 'Senha é obrigatória.';
    if (password.length < 8) return 'A senha deve ter pelo menos 8 caracteres.';
    return '';
  };

  const getPassVefError = () => {
    if (!touched.passVef) return '';
    if (!passVef) return 'Confirmação de senha é obrigatória.';
    if (passVef !== password) return 'As senhas não coincidem.';
    return '';
  };

  const getPhoneError = () => {
    if (role !== 'BAKER' || !touched.phone || !phone.trim()) return '';
    if (!E164_REGEX.test(toE164(phone))) {
      return 'Telefone incompleto ou inválido. Ex: (11) 99999-9999.';
    }
    return '';
  };

  const nameError = getNameError();
  const emailError = getEmailError();
  const passwordError = getPasswordError();
  const passVefError = getPassVefError();
  const phoneError = getPhoneError();

  async function handleRegister() {
    setTouched({
      name: true,
      email: true,
      password: true,
      passVef: true,
      phone: true,
    });

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName || !trimmedEmail || !password || !passVef) {
      Alert.alert('Preencha os campos', 'Por favor, preencha todos os campos necessários.');
      return;
    }

    if (trimmedName.length < 3) {
      Alert.alert('Nome inválido', 'O nome deve conter ao menos 3 caracteres.');
      return;
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      Alert.alert('E-mail inválido', 'Informe um e-mail em formato válido.');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Senha fraca', 'A senha deve conter ao menos 8 caracteres.');
      return;
    }

    if (password !== passVef) {
      Alert.alert('Senhas não coincidem', 'A confirmação de senha não confere com a senha.');
      return;
    }

    let formattedPhone: string | null = null;
    if (role === 'BAKER' && phone.trim()) {
      formattedPhone = toE164(phone);
      if (!E164_REGEX.test(formattedPhone)) {
        Alert.alert(
          'Telefone inválido',
          'O telefone deve estar em formato válido com DDD (ex: (11) 99999-9999).',
        );
        return;
      }
    }

    try {
      await registerUser({
        name: trimmedName,
        email: trimmedEmail,
        password,
        phone: formattedPhone,
        role,
      });

      setIsLoggingIn(true);
      try {
        const clientType = Platform.OS;
        const sessionId = Crypto.randomUUID();

        await signIn({
          email: trimmedEmail,
          password,
          clientType,
          sessionId,
        });

        router.replace('/home');
      } catch (loginErr) {
        console.error('Auto-login error after registration:', loginErr);
        Alert.alert(
          'Cadastro realizado com sucesso!',
          'Sua conta foi criada. Por favor, entre com seu e-mail e senha para continuar.',
          [
            {
              text: 'Ir para o Login',
              onPress: () => router.replace('/login'),
            },
          ],
        );
      } finally {
        setIsLoggingIn(false);
      }
    } catch (err: unknown) {
      console.error('Registration error:', err);
      const apiError = err as { response?: { data?: { message?: string } }; message?: string };
      const message =
        apiError?.response?.data?.message ||
        apiError?.message ||
        'Erro ao realizar cadastro. Verifique seus dados e tente novamente.';
      Alert.alert('Erro no cadastro', message);
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: role === 'BAKER' ? 'Cadastro de Confeiteira' : 'Cadastro de Cliente',
        }}
      />
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
              <Image
                source={
                  isDarkMode
                    ? require('@/assets/images/logo-dark.png')
                    : require('@/assets/images/logo-light.png')
                }
                style={styles.logo}
                contentFit="contain"
              />
              <Text style={styles.headline}>Criar Conta</Text>
              <Text style={styles.subheadline}>
                {role === 'BAKER'
                  ? 'Cadastre-se para gerenciar produções e receitas'
                  : 'Cadastre-se para encomendar e ver receitas'}
              </Text>
            </View>

            {/* Role selector pill tabs */}
            <View style={styles.roleContainer}>
              <Text style={styles.roleLabel}>Tipo de Cadastro</Text>
              <View style={styles.roleButtonsRow}>
                <TouchableOpacity
                  style={[styles.roleButton, role === 'BAKER' && styles.roleButtonActive]}
                  onPress={() => setSelectedRole('BAKER')}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name="cake-variant-outline"
                    size={20}
                    color={
                      role === 'BAKER' ? theme.colors.onPrimary : theme.colors.onSurfaceVariant
                    }
                  />
                  <Text
                    style={[styles.roleButtonText, role === 'BAKER' && styles.roleButtonTextActive]}
                  >
                    Confeiteira
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.roleButton, role === 'CUSTOMER' && styles.roleButtonActive]}
                  onPress={() => setSelectedRole('CUSTOMER')}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name="account-outline"
                    size={20}
                    color={
                      role === 'CUSTOMER' ? theme.colors.onPrimary : theme.colors.onSurfaceVariant
                    }
                  />
                  <Text
                    style={[
                      styles.roleButtonText,
                      role === 'CUSTOMER' && styles.roleButtonTextActive,
                    ]}
                  >
                    Cliente
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.roleDescription}>
                {role === 'BAKER'
                  ? 'Permite organizar produções, precificar receitas e controlar estoque.'
                  : 'Permite encontrar as melhores confeiteiras perto de você'}
              </Text>
            </View>

            {/* Fieldset: Dados Pessoais */}
            <View style={styles.fieldset}>
              <View style={styles.titleContainer}>
                <MaterialCommunityIcons
                  name="account-circle-outline"
                  size={24}
                  color={theme.colors.espressoDark}
                  style={styles.icon}
                />
                <Text style={styles.title}>Dados pessoais</Text>
              </View>

              {/* Name field */}
              <View style={styles.fieldWrapper}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>
                    Nome completo <Text style={styles.required}>*</Text>
                  </Text>
                  {touched.name && isNameValid && (
                    <MaterialCommunityIcons
                      name="check-circle-outline"
                      size={16}
                      color={theme.colors.tertiary}
                    />
                  )}
                </View>
                <Input
                  value={name}
                  placeholder="Nome completo (mín. 3 caracteres)"
                  autoCapitalize="words"
                  autoCorrect={false}
                  onChangeText={setName}
                  onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
                  containerStyle={[
                    styles.inputContainer,
                    !!nameError && styles.inputError,
                    touched.name && isNameValid && styles.inputSuccess,
                  ]}
                  style={styles.inputText}
                  placeholderTextColor={theme.colors.placeholder}
                />
                <View style={styles.helperRow}>
                  {nameError ? (
                    <>
                      <MaterialCommunityIcons
                        name="alert-circle-outline"
                        size={14}
                        color={theme.colors.error}
                        style={styles.helperIcon}
                      />
                      <Text style={styles.errorText}>{nameError}</Text>
                    </>
                  ) : (
                    <Text style={styles.helperText}>Mínimo de 3 caracteres</Text>
                  )}
                </View>
              </View>

              {/* Email field */}
              <View style={styles.fieldWrapper}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>
                    E-mail <Text style={styles.required}>*</Text>
                  </Text>
                  {touched.email && isEmailValid && (
                    <MaterialCommunityIcons
                      name="check-circle-outline"
                      size={16}
                      color={theme.colors.tertiary}
                    />
                  )}
                </View>
                <Input
                  value={email}
                  placeholder="exemplo@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onChangeText={setEmail}
                  onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                  containerStyle={[
                    styles.inputContainer,
                    !!emailError && styles.inputError,
                    touched.email && isEmailValid && styles.inputSuccess,
                  ]}
                  style={styles.inputText}
                  placeholderTextColor={theme.colors.placeholder}
                />
                <View style={styles.helperRow}>
                  {emailError ? (
                    <>
                      <MaterialCommunityIcons
                        name="alert-circle-outline"
                        size={14}
                        color={theme.colors.error}
                        style={styles.helperIcon}
                      />
                      <Text style={styles.errorText}>{emailError}</Text>
                    </>
                  ) : (
                    <Text style={styles.helperText}>Informe um e-mail válido</Text>
                  )}
                </View>
              </View>

              {/* Password field */}
              <View style={styles.fieldWrapper}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>
                    Senha <Text style={styles.required}>*</Text>
                  </Text>
                  {touched.password && isPasswordValid && (
                    <MaterialCommunityIcons
                      name="check-circle-outline"
                      size={16}
                      color={theme.colors.tertiary}
                    />
                  )}
                </View>
                <Input
                  value={password}
                  placeholder="Mínimo de 8 caracteres"
                  secureTextEntry
                  autoCapitalize="none"
                  onChangeText={setPassword}
                  onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                  containerStyle={[
                    styles.inputContainer,
                    !!passwordError && styles.inputError,
                    touched.password && isPasswordValid && styles.inputSuccess,
                  ]}
                  style={[styles.inputText, styles.passwordInput]}
                  placeholderTextColor={theme.colors.placeholder}
                />
                <View style={styles.helperRow}>
                  {passwordError ? (
                    <>
                      <MaterialCommunityIcons
                        name="alert-circle-outline"
                        size={14}
                        color={theme.colors.error}
                        style={styles.helperIcon}
                      />
                      <Text style={styles.errorText}>{passwordError}</Text>
                    </>
                  ) : (
                    <Text style={styles.helperText}>Mínimo de 8 caracteres</Text>
                  )}
                </View>
              </View>

              {/* Confirm password field */}
              <View style={styles.fieldWrapper}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>
                    Confirmação da senha <Text style={styles.required}>*</Text>
                  </Text>
                  {touched.passVef && isPassVefValid && (
                    <MaterialCommunityIcons
                      name="check-circle-outline"
                      size={16}
                      color={theme.colors.tertiary}
                    />
                  )}
                </View>
                <Input
                  value={passVef}
                  placeholder="Repita sua senha"
                  secureTextEntry
                  autoCapitalize="none"
                  onChangeText={setPassVef}
                  onBlur={() => setTouched((prev) => ({ ...prev, passVef: true }))}
                  containerStyle={[
                    styles.inputContainer,
                    !!passVefError && styles.inputError,
                    touched.passVef && isPassVefValid && styles.inputSuccess,
                  ]}
                  style={[styles.inputText, styles.passwordInput]}
                  placeholderTextColor={theme.colors.placeholder}
                />
                <View style={styles.helperRow}>
                  {passVefError ? (
                    <>
                      <MaterialCommunityIcons
                        name="alert-circle-outline"
                        size={14}
                        color={theme.colors.error}
                        style={styles.helperIcon}
                      />
                      <Text style={styles.errorText}>{passVefError}</Text>
                    </>
                  ) : (
                    <Text style={styles.helperText}>As senhas devem ser iguais</Text>
                  )}
                </View>
              </View>
            </View>

            {/* Fieldset: Contato (Only shown for BAKER) */}
            {role === 'BAKER' && (
              <>
                <View style={styles.fieldset}>
                  <View style={styles.titleContainer}>
                    <MaterialCommunityIcons
                      name="phone-outline"
                      size={24}
                      color={theme.colors.espressoDark}
                      style={styles.icon}
                    />
                    <Text style={styles.title}>Contato</Text>
                  </View>

                  <View style={styles.fieldWrapper}>
                    <View style={styles.labelRow}>
                      <Text style={styles.label}>Telefone / WhatsApp</Text>
                      {touched.phone && phone.trim().length > 0 && isPhoneValid && (
                        <MaterialCommunityIcons
                          name="check-circle-outline"
                          size={16}
                          color={theme.colors.tertiary}
                        />
                      )}
                    </View>
                    <Input
                      value={phone}
                      placeholder="(11) 99999-9999"
                      keyboardType="phone-pad"
                      onChangeText={handlePhoneChange}
                      onBlur={() => setTouched((prev) => ({ ...prev, phone: true }))}
                      containerStyle={[
                        styles.inputContainer,
                        !!phoneError && styles.inputError,
                        touched.phone &&
                          phone.trim().length > 0 &&
                          isPhoneValid &&
                          styles.inputSuccess,
                      ]}
                      style={styles.inputText}
                      placeholderTextColor={theme.colors.placeholder}
                    />
                    <View style={styles.helperRow}>
                      {phoneError ? (
                        <>
                          <MaterialCommunityIcons
                            name="alert-circle-outline"
                            size={14}
                            color={theme.colors.error}
                            style={styles.helperIcon}
                          />
                          <Text style={styles.errorText}>{phoneError}</Text>
                        </>
                      ) : (
                        <Text style={styles.helperText}>
                          Opcional. Formato com DDD: (XX) 9XXXX-XXXX
                        </Text>
                      )}
                    </View>
                  </View>
                </View>

                {/*{<View style={styles.fieldset}>
                  <View style={styles.titleContainer}>
                    <MaterialCommunityIcons name="map-marker" size={26} style={styles.icon} />
                    <Text style={styles.title}>Localização</Text>
                  </View>
                  <Input placeholder="Cidade" />
                  <Input placeholder="Estado" />
                </View>} */}
              </>
            )}

            {/* Submit button & login link */}
            <View style={styles.btnRegister}>
              {isSubmitting ? (
                <ActivityIndicator size="large" color={theme.colors.primary} />
              ) : (
                <CustomButton
                  title={role === 'BAKER' ? 'Cadastrar como Confeiteira' : 'Cadastrar como Cliente'}
                  variant="primary"
                  style={styles.button}
                  onPress={handleRegister}
                />
              )}

              <Text style={styles.txtLogIn}>
                Já tem uma conta?{' '}
                <Link href="/login" asChild>
                  <Text style={styles.linkLogIn}>Entrar</Text>
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
      justifyContent: 'flex-start',
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 48,
    },
    card: {
      width: '100%',
      maxWidth: 460,
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.rounded.lg,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      gap: 16,
      ...theme.shadows.soft,
    },
    headerArea: {
      alignItems: 'center',
      marginBottom: 2,
    },
    logo: {
      width: 80,
      height: 80,
      marginBottom: 8,
    },
    headline: {
      fontFamily: theme.typography.headlineLg.fontFamily,
      fontSize: 24,
      fontWeight: '600',
      color: theme.colors.espressoDark,
      textAlign: 'center',
      marginBottom: 4,
    },
    subheadline: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      lineHeight: 20,
    },
    roleContainer: {
      width: '100%',
      backgroundColor: theme.colors.surfaceContainerLow,
      borderRadius: theme.rounded.md,
      padding: 12,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    roleLabel: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.onSurfaceVariant,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 8,
    },
    roleButtonsRow: {
      flexDirection: 'row',
      gap: 8,
    },
    roleButton: {
      flex: 1,
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderRadius: theme.rounded.full,
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      gap: 6,
    },
    roleButtonActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
      ...theme.shadows.glow,
    },
    roleButtonText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
    },
    roleButtonTextActive: {
      color: theme.colors.onPrimary,
    },
    roleDescription: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginTop: 8,
      lineHeight: 16,
    },
    fieldset: {
      width: '100%',
      gap: 12,
    },
    titleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
      paddingBottom: 6,
    },
    icon: {
      marginRight: 8,
    },
    title: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 17,
      fontWeight: '600',
      color: theme.colors.espressoDark,
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
    btnRegister: {
      marginTop: 8,
      alignItems: 'center',
      width: '100%',
      gap: 12,
    },
    button: {
      width: '100%',
      margin: 0,
      borderRadius: theme.rounded.default,
      height: 48,
    },
    txtLogIn: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 14,
      color: theme.colors.onSurface,
    },
    linkLogIn: {
      fontFamily: theme.typography.labelMd.fontFamily,
      color: theme.colors.primary,
      fontWeight: '700',
    },
  });
