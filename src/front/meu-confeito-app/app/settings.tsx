import { useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { Image } from 'expo-image';
import { Stack, router } from 'expo-router';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import {
  CustomButton,
  DeleteAccountModal,
  InteractionSettingsCard,
  MenuOptionButton,
  OperationalPreferencesCard,
  SettingsSection,
  StorageSettingsCard,
  ThemeToggleCard,
} from '@/src/components';
import { useAuth } from '@/src/contexts/AuthContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { useUserDelete, useUserSuspend } from '@/src/hooks/useUsers';
import { AppTheme } from '@/src/theme/themes';
import { getRoleLabel, isCustomer } from '@/src/utils/roles';

export default function SettingsScreen() {
  const { theme, isDarkMode } = useThemeMode();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < theme.breakpoints.sm;
  const isDesktop = Platform.OS === 'web' || width >= theme.breakpoints.md;

  const { user, signOut } = useAuth();
  const { deleteUser, isLoading: isDeletingUser } = useUserDelete();
  const { suspendUser, isLoading: isSuspendingUser } = useUserSuspend();

  const isCustomerRole = isCustomer(user?.role);

  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

  const styles = useMemo(() => createStyles(theme, isSmallScreen), [theme, isSmallScreen]);

  const handleOpenDeleteModal = () => {
    setIsDeleteModalVisible(true);
  };

  const handleCloseDeleteModal = () => {
    if (!isDeletingUser) {
      setIsDeleteModalVisible(false);
    }
  };

  const handleConfirmDeleteAccount = async () => {
    if (!user?.id) {
      Alert.alert('Erro', 'Usuário não autenticado.');
      return;
    }

    try {
      await deleteUser(user.id);
      setIsDeleteModalVisible(false);
      await signOut();
      Alert.alert(
        'Conta Excluída',
        'Sua conta e todos os dados vinculados a ela foram excluídos com sucesso.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/login'),
          },
        ],
      );
    } catch (err: unknown) {
      const apiErr = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const errorMsg =
        apiErr?.response?.data?.message ||
        apiErr?.message ||
        'Não foi possível excluir sua conta. Verifique sua conexão e tente novamente.';
      Alert.alert('Falha na Exclusão', errorMsg);
    }
  };

  const handleConfirmSuspendAccount = () => {
    if (!user?.id) {
      Alert.alert('Erro', 'Usuário não autenticado.');
      return;
    }

    Alert.alert(
      'Desativar Conta',
      'Tem certeza de que deseja suspender sua conta temporariamente? Suas receitas públicas e perfil de confeitaria serão ocultados e sua sessão será encerrada. Suas credenciais e dados serão preservados para quando você desejar reativar sua conta.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desativar',
          style: 'destructive',
          onPress: async () => {
            try {
              await suspendUser(user.id);
              await signOut();
              Alert.alert(
                'Conta Desativada',
                'Sua conta foi suspensa temporariamente. Seus dados foram preservados para posterior recuperação.',
                [
                  {
                    text: 'OK',
                    onPress: () => router.replace('/login'),
                  },
                ],
              );
            } catch (err: unknown) {
              const apiErr = err as {
                response?: { data?: { message?: string } };
                message?: string;
              };
              const errorMsg =
                apiErr?.response?.data?.message ||
                apiErr?.message ||
                'Não foi possível desativar sua conta. Tente novamente.';
              Alert.alert('Falha na Desativação', errorMsg);
            }
          },
        },
      ],
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Configurações' }} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrapper}>
          {/* Header Editorial Stamp */}
          <View style={styles.headerBlock}>
            <Text style={styles.headerTitle}>Configurações</Text>
            <Text style={styles.headerSubtitle}>
              Personalize a aparência do Meu Confeito e configure sua experiência na cozinha
              digital.
            </Text>
          </View>

          {/* Section 1: Account & Security */}
          {user && (
            <SettingsSection
              title="Conta e Segurança"
              description="Gerencie seus dados de acesso e credenciais de segurança"
              icon="shield-account-outline"
            >
              <View style={styles.accountCard}>
                <View style={styles.userInfoRow}>
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </Text>
                  </View>
                  <View style={styles.userDetailsCol}>
                    <Text style={styles.userName} numberOfLines={1}>
                      {user.name}
                    </Text>
                    <Text style={styles.userEmail} numberOfLines={1}>
                      {user.email}
                    </Text>
                    <View style={styles.roleBadge}>
                      <Text style={styles.roleBadgeText}>{getRoleLabel(user.role)}</Text>
                    </View>
                  </View>
                </View>

                <MenuOptionButton
                  title="Alterar Senha"
                  subtitle="Redefina sua senha de acesso ao aplicativo"
                  icon="lock-reset"
                  onPress={() => router.push('/reset-password')}
                />
              </View>
            </SettingsSection>
          )}

          {/* Section 2: Appearance & Theme Toggle */}
          <SettingsSection
            title="Aparência"
            description="Personalize cores, alto contraste e economia de bateria em telas OLED"
            icon="palette-outline"
          >
            <ThemeToggleCard />
          </SettingsSection>

          {/* Section 3: Navigation & Haptics (Mobile only) */}
          {!isDesktop && (
            <SettingsSection
              title="Gestos e Resposta Tátil"
              description="Controle a navegação por deslizamento e o retorno de vibração do aplicativo"
              icon="cellphone-sound"
            >
              <InteractionSettingsCard />
            </SettingsSection>
          )}

          {/* Section 4: Operational Preferences */}
          {!isCustomerRole && (
            <SettingsSection
              title="Preferências Operacionais"
              description="Defina valores padrão para custos de receitas e a precisão de exibição das precificações"
              icon="tune-variant"
            >
              <OperationalPreferencesCard />
            </SettingsSection>
          )}

          {/* Section 5: Data & Storage */}
          <SettingsSection
            title="Dados e Armazenamento"
            description="Gerencie o cache local, arquivos temporários e o uso de memória do aplicativo"
            icon="database-outline"
          >
            <StorageSettingsCard />
          </SettingsSection>

          {/* Section 6: App Info & About */}
          <SettingsSection
            title="Sobre o Aplicativo"
            description="Informações da versão e suporte"
            icon="information-outline"
          >
            <View style={styles.aboutCard}>
              <View style={styles.aboutHeader}>
                <View style={styles.brandBadge}>
                  <Image
                    source={
                      isDarkMode
                        ? require('@/assets/images/logo-dark.png')
                        : require('@/assets/images/logo-light.png')
                    }
                    style={styles.brandLogoImage}
                    contentFit="contain"
                  />
                </View>
                <View style={styles.brandTextWrapper}>
                  <Text style={styles.brandName}>Meu Confeito</Text>
                  <Text style={styles.appVersion}>Versão 1.0.0 (Beta)</Text>
                </View>
              </View>

              <Text style={styles.aboutDescription}>
                Desenvolvido especialmente para confeiteiras e confeiteiros independentes que buscam
                precisão no cálculo de custos e valorização do seu trabalho artesanal.
              </Text>
            </View>
          </SettingsSection>

          {/* Section 7: Danger Zone (Account Deletion) */}
          <SettingsSection
            title="Zona de Perigo"
            description="Ações de encerramento temporário ou permanente da conta"
            icon="alert-octagon-outline"
          >
            {/* Desativação Temporária */}
            <View style={styles.suspendCard}>
              <View style={styles.dangerCardHeader}>
                <View style={styles.suspendIconBadge}>
                  <MaterialCommunityIcons
                    name="pause-circle-outline"
                    size={22}
                    color={theme.colors.onSurfaceVariant}
                  />
                </View>
                <View style={styles.dangerHeaderTextWrapper}>
                  <Text style={styles.suspendCardTitle}>Desativação Temporária de Conta</Text>
                  <Text style={styles.dangerCardSubtitle}>
                    Suspenda sua conta temporariamente. Suas receitas e perfil público serão
                    ocultados da comunidade e sua sessão será encerrada, mas seus dados serão
                    preservados para posterior recuperação.
                  </Text>
                </View>
              </View>

              <CustomButton
                title={isSuspendingUser ? 'Desativando...' : 'Desativar Minha Conta'}
                variant="outline"
                isDisabled={isSuspendingUser}
                style={styles.deleteAccountBtn}
                onPress={handleConfirmSuspendAccount}
              />
            </View>

            {/* Exclusão Definitiva */}
            <View style={styles.dangerCard}>
              <View style={styles.dangerCardHeader}>
                <View style={styles.dangerIconBadge}>
                  <MaterialCommunityIcons
                    name="alert-circle-outline"
                    size={22}
                    color={theme.colors.error}
                  />
                </View>
                <View style={styles.dangerHeaderTextWrapper}>
                  <Text style={styles.dangerCardTitle}>Exclusão Definitiva de Conta</Text>
                  <Text style={styles.dangerCardSubtitle}>
                    Esta ação é permanente e irreversível. Ao confirmar, seus dados pessoais serão
                    anonimizados, receitas desvinculadas excluídas e todas as sessões ativas
                    revogadas.
                  </Text>
                </View>
              </View>

              <CustomButton
                title="Excluir Minha Conta"
                variant="danger"
                style={styles.deleteAccountBtn}
                onPress={handleOpenDeleteModal}
              />
            </View>
          </SettingsSection>
        </View>
      </ScrollView>

      {/* Destructive Deletion Confirmation Modal */}
      <DeleteAccountModal
        isVisible={isDeleteModalVisible}
        isDeleting={isDeletingUser}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDeleteAccount}
      />
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
      maxWidth: 680,
      gap: theme.spacing.space6,
    },
    headerBlock: {
      marginTop: theme.spacing.space2,
      marginBottom: theme.spacing.space1,
    },
    headerTitle: {
      fontFamily: theme.typography.headlineLg.fontFamily,
      fontSize: 26,
      fontWeight: '600',
      color: theme.colors.espressoDark,
      letterSpacing: 0.5,
    },
    headerSubtitle: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 15,
      color: theme.colors.onSurfaceVariant,
      marginTop: 6,
      lineHeight: 22,
    },
    aboutCard: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.lg,
      padding: theme.spacing.space5,
      width: '100%',
      ...theme.shadows.soft,
    },
    aboutHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.space3,
      marginBottom: theme.spacing.space3,
    },
    brandBadge: {
      width: 44,
      height: 44,
      borderRadius: theme.rounded.md,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    brandLogoImage: {
      width: 34,
      height: 34,
    },
    brandTextWrapper: {
      flex: 1,
      gap: 2,
    },
    brandName: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.espressoDark,
    },
    appVersion: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    aboutDescription: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      lineHeight: 20,
      color: theme.colors.onSurfaceVariant,
    },
    accountCard: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.lg,
      padding: theme.spacing.space4,
      width: '100%',
      gap: theme.spacing.space4,
      ...theme.shadows.soft,
    },
    userInfoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.space3,
    },
    avatarPlaceholder: {
      width: 48,
      height: 48,
      borderRadius: theme.rounded.full,
      backgroundColor: theme.colors.primaryFixed,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.onPrimaryFixed,
    },
    userDetailsCol: {
      flex: 1,
      gap: 2,
    },
    userName: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.espressoDark,
    },
    userEmail: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
    roleBadge: {
      alignSelf: 'flex-start',
      backgroundColor: theme.colors.surfaceContainerHigh,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: theme.rounded.full,
      marginTop: 2,
    },
    roleBadgeText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 10,
      fontWeight: '700',
      color: theme.colors.onSurfaceVariant,
      textTransform: 'uppercase',
    },
    suspendCard: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.lg,
      padding: theme.spacing.space5,
      width: '100%',
      gap: theme.spacing.space4,
      ...theme.shadows.soft,
    },
    suspendIconBadge: {
      width: 38,
      height: 38,
      borderRadius: theme.rounded.md,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      justifyContent: 'center',
      alignItems: 'center',
    },
    suspendCardTitle: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.espressoDark,
    },
    dangerCard: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1.5,
      borderColor: theme.colors.errorContainer,
      borderRadius: theme.rounded.lg,
      padding: theme.spacing.space5,
      width: '100%',
      gap: theme.spacing.space4,
      ...theme.shadows.soft,
    },
    dangerCardHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: theme.spacing.space3,
    },
    dangerIconBadge: {
      width: 38,
      height: 38,
      borderRadius: theme.rounded.md,
      backgroundColor: theme.colors.errorContainer,
      justifyContent: 'center',
      alignItems: 'center',
    },
    dangerHeaderTextWrapper: {
      flex: 1,
      gap: 4,
    },
    dangerCardTitle: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.error,
    },
    dangerCardSubtitle: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 18,
    },
    deleteAccountBtn: {
      width: '100%',
      maxWidth: isSmallScreen ? undefined : 320,
      alignSelf: isSmallScreen ? 'center' : 'flex-start',
      marginVertical: 0,
    },
  });
