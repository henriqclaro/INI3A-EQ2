import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';

import { Stack, router } from 'expo-router';

import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { ActivityIndicator } from 'react-native-paper';

import { CustomButton, Input, MaterialSymbol, RateLimitLabel } from '@/src/components';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { useResetPassword } from '@/src/hooks/useUsers';
import { AppTheme } from '@/src/theme/themes';
import { getRateLimitInfo, isRateLimitError } from '@/src/utils/rateLimit';
import { isPasswordValid as checkPasswordValid } from '@/src/utils/validation';

export default function ResetPasswordScreen() {
  const { theme } = useThemeMode();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < theme.breakpoints.sm;

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [rateLimitNotice, setRateLimitNotice] = useState<{
    message: string;
    retryAfterSeconds?: number;
  } | null>(null);

  const [touched, setTouched] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const { resetPassword, isLoading } = useResetPassword();

  const styles = useMemo(() => createStyles(theme, isSmallScreen), [theme, isSmallScreen]);

  const isNewPasswordValid = checkPasswordValid(newPassword);
  const isConfirmValid = confirmPassword.length > 0 && confirmPassword === newPassword;
  const isDifferentFromOld = newPassword.length > 0 && newPassword !== oldPassword;

  const oldPasswordError = useMemo(() => {
    if (!touched.oldPassword) return '';
    if (!oldPassword) return 'Informe sua senha atual.';
    if (oldPassword.length < 8) return 'A senha deve conter ao menos 8 caracteres.';
    return '';
  }, [oldPassword, touched.oldPassword]);

  const newPasswordError = useMemo(() => {
    if (!touched.newPassword) return '';
    if (!newPassword) return 'Informe a nova senha.';
    if (newPassword.length < 8) return 'A nova senha deve ter no mínimo 8 caracteres.';
    if (oldPassword && newPassword === oldPassword) {
      return 'A nova senha deve ser diferente da senha atual.';
    }
    return '';
  }, [newPassword, oldPassword, touched.newPassword]);

  const confirmPasswordError = useMemo(() => {
    if (!touched.confirmPassword) return '';
    if (!confirmPassword) return 'Confirme a nova senha.';
    if (confirmPassword !== newPassword) return 'As senhas não conferem.';
    return '';
  }, [confirmPassword, newPassword, touched.confirmPassword]);

  const handleSubmit = async () => {
    setTouched({
      oldPassword: true,
      newPassword: true,
      confirmPassword: true,
    });

    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert('Campos Obrigatórios', 'Por favor, preencha todos os campos.');
      return;
    }

    if (oldPassword.length < 8) {
      Alert.alert('Senha Atual Inválida', 'A senha atual deve ter no mínimo 8 caracteres.');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Nova Senha Fraca', 'A nova senha deve ter no mínimo 8 caracteres.');
      return;
    }

    if (newPassword === oldPassword) {
      Alert.alert('Senha Repetida', 'A nova senha deve ser diferente da senha atual.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Senhas Diferentes', 'A confirmação não confere com a nova senha digitada.');
      return;
    }

    try {
      await resetPassword({
        oldPassword,
        newPassword,
      });

      Alert.alert('Senha Alterada!', 'Sua senha foi atualizada com sucesso.', [
        {
          text: 'Concluir',
          onPress: () => router.back(),
        },
      ]);
    } catch (err: unknown) {
      const apiErr = err as {
        response?: { data?: { code?: string; message?: string } };
        message?: string;
      };
      const errorCode = apiErr?.response?.data?.code;
      if (errorCode === 'USER_INVALID_PASSWORD') {
        Alert.alert(
          'Senha Atual Incorreta',
          'A senha atual informada não confere. Verifique seus dados e tente novamente.',
        );
      } else if (isRateLimitError(err)) {
        const info = getRateLimitInfo(err);
        setRateLimitNotice({
          message: info.message,
          retryAfterSeconds: info.retryAfterSeconds,
        });
        Alert.alert('Limite de Tentativas Excedido', info.message);
      } else {
        const errorMsg =
          apiErr?.response?.data?.message ||
          apiErr?.message ||
          'Não foi possível alterar a senha. Tente novamente mais tarde.';
        Alert.alert('Erro ao Alterar Senha', errorMsg);
      }
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Alterar Senha' }} />

      <KeyboardAwareScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bottomOffset={64}
      >
        <View style={styles.contentWrapper}>
          {/* Header / Brand Stamp */}
          <View style={styles.headerBlock}>
            <View style={styles.iconCircle}>
              <MaterialSymbol name="lock_reset" size={28} color={theme.colors.primary} />
            </View>
            <Text style={styles.title}>Redefinir Senha de Acesso</Text>
            <Text style={styles.subtitle}>
              Escolha uma senha forte de pelo menos 8 caracteres para manter sua conta e receitas
              sempre protegidas.
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            {/* Old Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Senha Atual *</Text>
              <Input
                placeholder="Digite sua senha atual"
                secureTextEntry
                value={oldPassword}
                onChangeText={(val) => {
                  setOldPassword(val);
                  if (rateLimitNotice) setRateLimitNotice(null);
                  if (!touched.oldPassword) {
                    setTouched((prev) => ({ ...prev, oldPassword: true }));
                  }
                }}
                containerStyle={[
                  styles.inputContainer,
                  Boolean(oldPasswordError) && styles.inputError,
                ]}
                leftIcon={<MaterialSymbol name="lock" size={20} color={theme.colors.placeholder} />}
              />
              {oldPasswordError ? <Text style={styles.errorText}>{oldPasswordError}</Text> : null}
            </View>

            {/* New Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nova Senha *</Text>
              <Input
                placeholder="Digite a nova senha (mínimo 8 caracteres)"
                secureTextEntry
                value={newPassword}
                onChangeText={(val) => {
                  setNewPassword(val);
                  if (rateLimitNotice) setRateLimitNotice(null);
                  if (!touched.newPassword) {
                    setTouched((prev) => ({ ...prev, newPassword: true }));
                  }
                }}
                containerStyle={[
                  styles.inputContainer,
                  Boolean(newPasswordError) && styles.inputError,
                ]}
                leftIcon={
                  <MaterialSymbol
                    name="enhanced_encryption"
                    size={20}
                    color={theme.colors.placeholder}
                  />
                }
              />
              {newPasswordError ? <Text style={styles.errorText}>{newPasswordError}</Text> : null}
            </View>

            {/* Confirm Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Confirmar Nova Senha *</Text>
              <Input
                placeholder="Repita a nova senha para confirmação"
                secureTextEntry
                value={confirmPassword}
                onChangeText={(val) => {
                  setConfirmPassword(val);
                  if (rateLimitNotice) setRateLimitNotice(null);
                  if (!touched.confirmPassword) {
                    setTouched((prev) => ({ ...prev, confirmPassword: true }));
                  }
                }}
                containerStyle={[
                  styles.inputContainer,
                  Boolean(confirmPasswordError) && styles.inputError,
                ]}
                leftIcon={
                  <MaterialSymbol name="lock_clock" size={20} color={theme.colors.placeholder} />
                }
              />
              {confirmPasswordError ? (
                <Text style={styles.errorText}>{confirmPasswordError}</Text>
              ) : null}
            </View>

            {/* Requirements checklist */}
            <View style={styles.requirementsBox}>
              <Text style={styles.requirementsTitle}>Requisitos da nova senha:</Text>
              <View style={styles.reqItemRow}>
                <MaterialSymbol
                  name={isNewPasswordValid ? 'check_circle' : 'radio_button_unchecked'}
                  size={16}
                  color={isNewPasswordValid ? theme.colors.tertiary : theme.colors.placeholder}
                />
                <Text style={[styles.reqItemText, isNewPasswordValid && styles.reqItemTextMet]}>
                  Pelo menos 8 caracteres
                </Text>
              </View>
              <View style={styles.reqItemRow}>
                <MaterialSymbol
                  name={isDifferentFromOld ? 'check_circle' : 'radio_button_unchecked'}
                  size={16}
                  color={isDifferentFromOld ? theme.colors.tertiary : theme.colors.placeholder}
                />
                <Text style={[styles.reqItemText, isDifferentFromOld && styles.reqItemTextMet]}>
                  Diferente da senha atual
                </Text>
              </View>
              <View style={styles.reqItemRow}>
                <MaterialSymbol
                  name={isConfirmValid ? 'check_circle' : 'radio_button_unchecked'}
                  size={16}
                  color={isConfirmValid ? theme.colors.tertiary : theme.colors.placeholder}
                />
                <Text style={[styles.reqItemText, isConfirmValid && styles.reqItemTextMet]}>
                  Confirmação idêntica à nova senha
                </Text>
              </View>
            </View>

            {/* Submit & Cancel Actions */}
            <View style={styles.actionsContainer}>
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
                <>
                  <CustomButton
                    title="Salvar Nova Senha"
                    variant="primary"
                    style={styles.submitBtn}
                    onPress={handleSubmit}
                  />
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => router.back()}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Cancelar alteração de senha"
                  >
                    <Text style={styles.cancelBtnText}>Cancelar</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </>
  );
}

const createStyles = (theme: AppTheme, isSmallScreen: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      paddingHorizontal: isSmallScreen ? theme.spacing.marginMobile : theme.spacing.marginTablet,
      paddingTop: theme.spacing.space4,
      paddingBottom: theme.spacing.space16,
      alignItems: 'center',
    },
    contentWrapper: {
      width: '100%',
      maxWidth: 520,
      gap: theme.spacing.space5,
    },
    headerBlock: {
      alignItems: 'center',
      marginTop: theme.spacing.space2,
      marginBottom: theme.spacing.space1,
      textAlign: 'center',
    },
    iconCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.colors.surfaceContainerHigh,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.spacing.space3,
    },
    title: {
      fontFamily: theme.typography.headlineLg.fontFamily,
      fontSize: 22,
      color: theme.colors.espressoDark,
      textAlign: 'center',
      marginBottom: 6,
    },
    subtitle: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      lineHeight: 20,
      maxWidth: 420,
    },
    formCard: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.lg,
      padding: isSmallScreen ? theme.spacing.space4 : theme.spacing.space6,
      width: '100%',
      gap: theme.spacing.space4,
      ...theme.shadows.soft,
    },
    fieldGroup: {
      width: '100%',
      gap: 4,
    },
    inputContainer: {
      width: '100%',
      margin: 0,
      alignSelf: 'center',
    },
    inputError: {
      borderColor: theme.colors.error,
      borderWidth: 1.5,
    },
    label: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: 2,
    },
    errorText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      color: theme.colors.error,
      marginTop: 2,
    },
    requirementsBox: {
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.md,
      padding: theme.spacing.space3,
      gap: 6,
      marginTop: 2,
    },
    requirementsTitle: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.onSurfaceVariant,
      marginBottom: 2,
    },
    reqItemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    reqItemText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    reqItemTextMet: {
      color: theme.colors.tertiary,
      fontWeight: '600',
    },
    actionsContainer: {
      width: '100%',
      alignItems: 'center',
      marginTop: theme.spacing.space2,
      gap: theme.spacing.space2,
    },
    submitBtn: {
      width: '100%',
      maxWidth: 360,
    },
    cancelBtn: {
      minHeight: 48,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 16,
    },
    cancelBtnText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
    },
  });
