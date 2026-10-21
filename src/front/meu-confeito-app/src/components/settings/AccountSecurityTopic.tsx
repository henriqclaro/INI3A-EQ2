import { useMemo } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { router } from 'expo-router';

import { CustomButton, MaterialSymbol, MenuOptionButton } from '@/src/components/common';
import { UserProfile } from '@/src/contexts/AuthContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { useDeleteBakerProfile, useMyBakerProfile } from '@/src/hooks/useBakerProfile';
import { useNetwork } from '@/src/hooks/useNetwork';
import { AppTheme } from '@/src/theme/themes';
import { getRoleLabel, isBaker } from '@/src/utils/roles';
import { formatPhoneInput } from '@/src/utils/validation';

export interface AccountSecurityTopicProps {
  user: UserProfile | null;
  onOpenDeleteModal: () => void;
  isSmallScreen?: boolean;
}

export function AccountSecurityTopic({
  user,
  onOpenDeleteModal,
  isSmallScreen = false,
}: AccountSecurityTopicProps) {
  const { theme } = useThemeMode();
  const styles = useMemo(() => createStyles(theme, isSmallScreen), [theme, isSmallScreen]);

  const isBakerRole = isBaker(user?.role);
  const { isOffline } = useNetwork();
  const {
    hasBakerProfile,
    isLoading: isLoadingBakerProfile,
    refetch: refetchBakerProfile,
  } = useMyBakerProfile(isBakerRole);
  const { deleteBakerProfile, isDeleting: isDeletingBakerProfile } = useDeleteBakerProfile();

  const formattedPhone = user?.phone ? formatPhoneInput(user.phone) : null;

  const handleConfirmDeactivateBakerProfile = () => {
    if (isOffline) {
      Alert.alert(
        'Modo Offline',
        'A desativação do perfil de confeiteiro requer uma conexão ativa com a internet.',
      );
      return;
    }

    Alert.alert(
      'Tornar Perfil Privado?',
      'Ao desativar seu perfil público, sua página comercial deixará de ser encontrada pelos clientes imediatamente. Suas informações públicas serão desativadas.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desativar e Tornar Privado',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBakerProfile();
              await refetchBakerProfile();
              Alert.alert('Perfil Privado', 'Seu perfil foi desativado e agora está privado.');
            } catch (err) {
              console.error('Error deactivating baker profile:', err);
              Alert.alert(
                'Erro ao Desativar',
                'Não foi possível desativar o perfil de confeiteiro. Tente novamente.',
              );
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      {/* Account Info and Password Card */}
      {user ? (
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
              {formattedPhone ? (
                <Text style={styles.userPhone} numberOfLines={1}>
                  {formattedPhone}
                </Text>
              ) : null}
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>{getRoleLabel(user.role)}</Text>
              </View>
            </View>
          </View>

          <MenuOptionButton
            title="Alterar Senha"
            subtitle="Redefina sua senha de acesso ao aplicativo"
            icon="lock_reset"
            onPress={() => router.push('/reset-password')}
          />
        </View>
      ) : null}

      {/* Baker Commercial Profile Card (Bakers only) */}
      {isBakerRole ? (
        <View style={styles.bakerCard}>
          <View style={styles.bakerCardHeader}>
            <View style={styles.bakerIconBadge}>
              <MaterialSymbol name="storefront" size={22} color={theme.colors.primary} />
            </View>
            <View style={styles.bakerHeaderTextWrapper}>
              <Text style={styles.bakerCardTitle}>Perfil Comercial de Confeiteiro</Text>
              <Text style={styles.bakerCardSubtitle}>
                {hasBakerProfile
                  ? 'Sua confeitaria está pública e visível para clientes na busca.'
                  : 'Seu perfil comercial está atualmente desativado e privado.'}
              </Text>
            </View>
          </View>

          <CustomButton
            title={isDeletingBakerProfile ? 'Desativando...' : 'Desativar Perfil de Confeiteiro'}
            variant="secondary"
            isDisabled={!hasBakerProfile || isDeletingBakerProfile || isLoadingBakerProfile}
            style={styles.deactivateBakerBtn}
            onPress={handleConfirmDeactivateBakerProfile}
          />
        </View>
      ) : null}

      {/* Profile Management Section */}
      <View style={styles.profileSection}>
        <Text style={styles.profileSectionTitle}>Gerenciamento de Perfil</Text>
        <MenuOptionButton
          title="Editar Perfil"
          subtitle="Atualize seu nome, foto, telefone e informações cadastrais"
          icon="manage_accounts"
          onPress={() => router.push('/edit-profile')}
        />
      </View>

      {/* Visual Distinction: Danger Zone Section Header */}
      <View style={styles.dangerSectionHeader}>
        <View style={styles.dangerSectionTitleRow}>
          <MaterialSymbol name="report" size={20} color={theme.colors.error} />
          <Text style={styles.dangerSectionTitle}>Zona de Perigo</Text>
        </View>
        <Text style={styles.dangerSectionSubtitle}>
          Ações irreversíveis e críticas de encerramento da sua conta
        </Text>
      </View>

      {/* Danger Card */}
      <View style={styles.dangerCard}>
        <View style={styles.dangerCardHeader}>
          <View style={styles.dangerIconBadge}>
            <MaterialSymbol name="error" size={22} color={theme.colors.error} />
          </View>
          <View style={styles.dangerHeaderTextWrapper}>
            <Text style={styles.dangerCardTitle}>Exclusão Definitiva de Conta</Text>
            <Text style={styles.dangerCardSubtitle}>
              Esta ação é permanente e irreversível. Ao confirmar, seus dados pessoais serão
              anonimizados, receitas desvinculadas excluídas e todas as sessões ativas revogadas.
            </Text>
          </View>
        </View>

        <CustomButton
          title="Excluir Minha Conta"
          variant="danger"
          style={styles.deleteAccountBtn}
          onPress={onOpenDeleteModal}
        />
      </View>
    </View>
  );
}

const createStyles = (theme: AppTheme, isSmallScreen: boolean) =>
  StyleSheet.create({
    container: {
      width: '100%',
      gap: theme.spacing.space5,
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
    userPhone: {
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
    dangerSectionHeader: {
      marginTop: theme.spacing.space2,
      gap: 4,
    },
    dangerSectionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.space2,
    },
    dangerSectionTitle: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.error,
      letterSpacing: 0.4,
    },
    dangerSectionSubtitle: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 18,
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
    bakerCard: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.lg,
      padding: theme.spacing.space5,
      width: '100%',
      gap: theme.spacing.space4,
      ...theme.shadows.soft,
    },
    bakerCardHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: theme.spacing.space3,
    },
    bakerIconBadge: {
      width: 38,
      height: 38,
      borderRadius: theme.rounded.md,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      justifyContent: 'center',
      alignItems: 'center',
    },
    bakerHeaderTextWrapper: {
      flex: 1,
      gap: 4,
    },
    bakerCardTitle: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.espressoDark,
    },
    bakerCardSubtitle: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 18,
    },
    deactivateBakerBtn: {
      width: '100%',
      maxWidth: isSmallScreen ? undefined : 320,
      alignSelf: isSmallScreen ? 'center' : 'flex-start',
      marginVertical: 0,
    },
    profileSection: {
      gap: theme.spacing.space2,
      marginTop: theme.spacing.space2,
    },
    profileSectionTitle: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.espressoDark,
      letterSpacing: 0.4,
      marginLeft: theme.spacing.space1,
      marginBottom: 2,
    },
  });
