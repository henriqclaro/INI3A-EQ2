import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { router } from 'expo-router';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { CustomButton, MenuOptionButton } from '@/src/components/common';
import { UserProfile } from '@/src/contexts/AuthContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';
import { getRoleLabel } from '@/src/utils/roles';

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
      ) : null}

      {/* Visual Distinction: Danger Zone Section Header */}
      <View style={styles.dangerSectionHeader}>
        <View style={styles.dangerSectionTitleRow}>
          <MaterialCommunityIcons
            name="alert-octagon-outline"
            size={20}
            color={theme.colors.error}
          />
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
  });
