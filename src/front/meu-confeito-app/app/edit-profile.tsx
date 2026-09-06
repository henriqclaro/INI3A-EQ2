import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Image } from 'expo-image';
import { Stack, router } from 'expo-router';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ActivityIndicator } from 'react-native-paper';

import { CustomButton, Input } from '@/src/components';
import { useAuth } from '@/src/contexts/AuthContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { useUserEdit } from '@/src/hooks/useUsers';
import { UserEditData } from '@/src/services/user';
import { AppTheme } from '@/src/theme/themes';
import {
  E164_REGEX,
  formatPhoneInput,
  isEmailValid,
  isNameValid,
  toE164,
} from '@/src/utils/validation';

export default function EditProfileScreen() {
  const { theme } = useThemeMode();
  const { user, updateUser } = useAuth();
  const { editUser, isLoading } = useUserEdit();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(formatPhoneInput(user?.phone || ''));

  const [touched, setTouched] = useState({
    name: false,
    email: false,
    phone: false,
  });

  const styles = useMemo(() => createStyles(theme), [theme]);

  const handlePhoneChange = (text: string) => {
    if (text.length < phone.length) {
      const rawClean = text.replace(/[^\d+]/g, '');
      setPhone(formatPhoneInput(rawClean));
      return;
    }
    setPhone(formatPhoneInput(text));
  };

  const isNameFieldValid = isNameValid(name);
  const isEmailFieldValid = isEmailValid(email);
  const isPhoneFieldValid = !phone.trim() || E164_REGEX.test(toE164(phone));

  const nameError = useMemo(() => {
    if (!touched.name) return '';
    if (!name.trim()) return 'Nome completo é obrigatório.';
    if (!isNameFieldValid) return 'O nome deve ter pelo menos 3 caracteres.';
    return '';
  }, [isNameFieldValid, name, touched.name]);

  const emailError = useMemo(() => {
    if (!touched.email) return '';
    if (!email.trim()) return 'E-mail é obrigatório.';
    if (!isEmailFieldValid) return 'Informe um e-mail válido (ex: seu@email.com).';
    return '';
  }, [email, isEmailFieldValid, touched.email]);

  const phoneError = useMemo(() => {
    if (!touched.phone || !phone.trim()) return '';
    if (!E164_REGEX.test(toE164(phone))) {
      return 'Telefone incompleto ou inválido. Ex: (11) 99999-9999.';
    }
    return '';
  }, [phone, touched.phone]);

  async function handleEdit() {
    setTouched({ name: true, email: true, phone: true });

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const formattedPhone = phone.trim() ? toE164(phone) : null;

    if (!trimmedName || trimmedName.length < 3) {
      Alert.alert('Nome inválido', 'O nome deve conter ao menos 3 caracteres.');
      return;
    }

    if (!isEmailValid(trimmedEmail)) {
      Alert.alert('E-mail inválido', 'Informe um e-mail em formato válido.');
      return;
    }

    if (phone.trim() && !E164_REGEX.test(toE164(phone))) {
      Alert.alert(
        'Telefone inválido',
        'O telefone deve estar em formato válido com DDD (ex: (11) 99999-9999).',
      );
      return;
    }

    const data: UserEditData = {};
    if (trimmedName !== user?.name) {
      data.name = trimmedName;
    }
    if (trimmedEmail !== user?.email) {
      data.email = trimmedEmail;
    }
    if (formattedPhone !== (user?.phone ?? null)) {
      data.phone = formattedPhone;
    }

    if (Object.keys(data).length === 0) {
      Alert.alert('Nenhuma alteração', 'Nenhuma alteração foi realizada.');
      return;
    }

    try {
      const response = await editUser(data, user!.id);
      if (response?.data?.user) {
        await updateUser(response.data.user);
      } else {
        await updateUser(data);
      }

      Alert.alert('Perfil atualizado', 'Seus dados foram atualizados com sucesso.', [
        {
          text: 'OK',
          onPress: () => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.push('/profile');
            }
          },
        },
      ]);
    } catch (error: unknown) {
      console.error('Error editing user: ', error);
      Alert.alert('Erro ao editar', 'Não foi possível salvar as alterações. Tente novamente.');
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Editar Perfil' }} />

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
            {/* Avatar section */}
            <View style={styles.avatarContainer}>
              {user?.pfpUrl ? (
                <Image
                  source={{ uri: user?.pfpUrl }}
                  alt="Foto de Perfil"
                  style={styles.image}
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.image, styles.placeholderImage]}>
                  <MaterialCommunityIcons
                    name="account"
                    size={64}
                    color={theme.colors.placeholder}
                  />
                </View>
              )}
              <Text style={styles.userName}>{user?.name}</Text>
              <Text style={styles.userRole}>
                {user?.role === 'BAKER' ? 'Confeiteira' : 'Cliente'}
              </Text>
            </View>

            {/* Name input */}
            <View style={styles.fieldWrapper}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>
                  Nome completo <Text style={styles.required}>*</Text>
                </Text>
                {touched.name && isNameFieldValid && (
                  <MaterialCommunityIcons
                    name="check-circle-outline"
                    size={16}
                    color={theme.colors.success}
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
                  touched.name && isNameFieldValid && styles.inputSuccess,
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
                      color={theme.colors.primary}
                      style={styles.helperIcon}
                    />
                    <Text style={styles.errorText}>{nameError}</Text>
                  </>
                ) : (
                  <Text style={styles.helperText}>Mínimo de 3 caracteres</Text>
                )}
              </View>
            </View>

            {/* Email input */}
            <View style={styles.fieldWrapper}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>
                  E-mail <Text style={styles.required}>*</Text>
                </Text>
                {touched.email && isEmailFieldValid && (
                  <MaterialCommunityIcons
                    name="check-circle-outline"
                    size={16}
                    color={theme.colors.success}
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
                  touched.email && isEmailFieldValid && styles.inputSuccess,
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
                      color={theme.colors.primary}
                      style={styles.helperIcon}
                    />
                    <Text style={styles.errorText}>{emailError}</Text>
                  </>
                ) : (
                  <Text style={styles.helperText}>Seu endereço de e-mail</Text>
                )}
              </View>
            </View>

            {/* Phone input */}
            <View style={styles.fieldWrapper}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Telefone / WhatsApp</Text>
                {touched.phone && phone.trim() && isPhoneFieldValid && (
                  <MaterialCommunityIcons
                    name="check-circle-outline"
                    size={16}
                    color={theme.colors.success}
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
                  touched.phone && phone.trim() && isPhoneFieldValid && styles.inputSuccess,
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
                      color={theme.colors.primary}
                      style={styles.helperIcon}
                    />
                    <Text style={styles.errorText}>{phoneError}</Text>
                  </>
                ) : (
                  <Text style={styles.helperText}>Opcional. Formato com DDD: (XX) 9XXXX-XXXX</Text>
                )}
              </View>
            </View>

            {/* Save Button */}
            <View style={styles.btnActionContainer}>
              {isLoading ? (
                <ActivityIndicator size="large" color={theme.colors.primary} />
              ) : (
                <CustomButton
                  title="Salvar alterações"
                  variant="primary"
                  style={styles.button}
                  onPress={handleEdit}
                />
              )}
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
      paddingBottom: 80,
    },
    card: {
      width: '100%',
      maxWidth: 460,
      backgroundColor: theme.colors.pitchBackground,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.colors.secBorder,
      gap: 14,
    },
    avatarContainer: {
      alignItems: 'center',
      marginBottom: 6,
    },
    image: {
      width: 110,
      height: 110,
      borderRadius: 55,
      borderWidth: 3,
      borderColor: theme.colors.primary,
      marginBottom: 8,
    },
    placeholderImage: {
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    userName: {
      fontFamily: 'Playfair Display SC',
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      textAlign: 'center',
    },
    userRole: {
      fontSize: 13,
      color: theme.colors.primary,
      fontWeight: '600',
      marginTop: 2,
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
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.text,
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
    inputSuccess: {
      borderColor: theme.colors.success,
    },
    inputText: {
      fontSize: 15,
      color: theme.colors.text,
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
    btnActionContainer: {
      marginTop: 10,
      alignItems: 'center',
      width: '100%',
    },
    button: {
      width: '100%',
      margin: 0,
      borderRadius: 8,
      height: 52,
    },
  });
