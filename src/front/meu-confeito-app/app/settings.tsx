import { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

import { Image } from 'expo-image';
import { Stack, router } from 'expo-router';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ActivityIndicator } from 'react-native-paper';

import {
  CustomButton,
  InteractionSettingsCard,
  MenuOptionButton,
  SettingsSection,
  ThemeToggleCard,
} from '@/src/components';
import { useAuth } from '@/src/contexts/AuthContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { useUserDelete } from '@/src/hooks/useUsers';
import { AppTheme } from '@/src/theme/themes';

interface PlannedFeatureItem {
  id: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  subtitle: string;
}

const PLANNED_FEATURES: PlannedFeatureItem[] = [
  {
    id: 'units',
    icon: 'scale',
    title: 'Unidades de Medida Padrão',
    subtitle: 'Definir unidades padrão (g, kg, ml, xícaras) para novos cadastros',
  },
  {
    id: 'notifications',
    icon: 'bell-outline',
    title: 'Alertas de Validade do Estoque',
    subtitle: 'Receber avisos preventivos de insumos próximos ao vencimento',
  },
  {
    id: 'financial',
    icon: 'calculator-variant-outline',
    title: 'Margem de Lucro Padrão',
    subtitle: 'Valores sugeridos automaticamente ao criar novas fichas técnicas',
  },
];

export default function SettingsScreen() {
  const { theme, isDarkMode } = useThemeMode();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < theme.breakpoints.sm;
  const isDesktop = Platform.OS === 'web' || width >= theme.breakpoints.md;

  const { user, signOut } = useAuth();
  const { deleteUser, isLoading: isDeletingUser } = useUserDelete();

  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isAcknowledgeChecked, setIsAcknowledgeChecked] = useState(false);

  const styles = useMemo(() => createStyles(theme, isSmallScreen), [theme, isSmallScreen]);

  const handleOpenDeleteModal = () => {
    setIsAcknowledgeChecked(false);
    setIsDeleteModalVisible(true);
  };

  const handleCloseDeleteModal = () => {
    if (!isDeletingUser) {
      setIsDeleteModalVisible(false);
    }
  };

  const handleConfirmDeleteAccount = async () => {
    if (!isAcknowledgeChecked) {
      Alert.alert(
        'Confirmação Obrigatória',
        'Você deve marcar a caixa confirmando que está ciente da perda definitiva dos seus dados antes de prosseguir.',
      );
      return;
    }

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
                      <Text style={styles.roleBadgeText}>
                        {user.role === 'BAKER' ? 'Confeiteiro(a)' : 'Cliente'}
                      </Text>
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
            description="Alterne entre o tema claro artesanal e o tema escuro aconchegante"
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

          {/* Section 4: Planned Features (Extensible Architecture) */}
          <SettingsSection
            title="Preferências Operacionais"
            description="Recursos e personalizações em desenvolvimento para as próximas versões"
            icon="tune-variant"
          >
            <View style={styles.plannedCard}>
              <View style={styles.plannedCardHeader}>
                <MaterialCommunityIcons name="clock-fast" size={20} color={theme.colors.primary} />
                <Text style={styles.plannedCardTitle}>Em Breve na Cozinha Digital</Text>
              </View>

              <Text style={styles.plannedCardSubtitle}>
                Estamos preparando novos controles para tornar sua rotina de confeitaria ainda mais
                prática e automatizada.
              </Text>

              <View style={styles.plannedList}>
                {PLANNED_FEATURES.map((item, index) => {
                  const isLastItem = index === PLANNED_FEATURES.length - 1;
                  return (
                    <View
                      key={item.id}
                      style={[styles.plannedItemRow, !isLastItem && styles.plannedItemBorder]}
                    >
                      <View style={styles.plannedIconBox}>
                        <MaterialCommunityIcons
                          name={item.icon}
                          size={18}
                          color={theme.colors.onSurfaceVariant}
                        />
                      </View>
                      <View style={styles.plannedItemTextCol}>
                        <Text style={styles.plannedItemTitle}>{item.title}</Text>
                        <Text style={styles.plannedItemSubtitle}>{item.subtitle}</Text>
                      </View>
                      <View style={styles.soonBadge}>
                        <Text style={styles.soonBadgeText}>Em breve</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </SettingsSection>

          {/* Section 5: App Info & About */}
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

          {/* Section 6: Danger Zone (Account Deletion) */}
          <SettingsSection
            title="Zona de Perigo"
            description="Ações irreversíveis e encerramento permanente da conta"
            icon="alert-octagon-outline"
          >
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
                    Esta ação é permanente e irreversível. Ao confirmar, seu perfil, receitas,
                    insumos e fichas técnicas serão excluídos definitivamente.
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
      <Modal
        visible={isDeleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseDeleteModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconBadge}>
              <MaterialCommunityIcons
                name="delete-alert-outline"
                size={36}
                color={theme.colors.error}
              />
            </View>

            <Text style={styles.modalTitle}>Excluir Conta Permanentemente?</Text>

            <View style={styles.modalWarningBox}>
              <MaterialCommunityIcons
                name="alert-outline"
                size={18}
                color={theme.colors.onErrorContainer}
              />
              <Text style={styles.modalWarningText}>ATENÇÃO: ESTA AÇÃO NÃO PODE SER DESFEITA!</Text>
            </View>

            <Text style={styles.modalDescription}>
              Ao confirmar a exclusão, todos os seus dados serão apagados definitivamente:
            </Text>

            <View style={styles.consequencesList}>
              <View style={styles.consequenceItem}>
                <MaterialCommunityIcons
                  name="close-circle-outline"
                  size={16}
                  color={theme.colors.error}
                />
                <Text style={styles.consequenceText}>
                  Todas as receitas e fichas técnicas criadas
                </Text>
              </View>
              <View style={styles.consequenceItem}>
                <MaterialCommunityIcons
                  name="close-circle-outline"
                  size={16}
                  color={theme.colors.error}
                />
                <Text style={styles.consequenceText}>Histórico de estoque, compras e insumos</Text>
              </View>
              <View style={styles.consequenceItem}>
                <MaterialCommunityIcons
                  name="close-circle-outline"
                  size={16}
                  color={theme.colors.error}
                />
                <Text style={styles.consequenceText}>
                  Perfil público de confeitaria e receitas em destaque
                </Text>
              </View>
              <View style={styles.consequenceItem}>
                <MaterialCommunityIcons
                  name="close-circle-outline"
                  size={16}
                  color={theme.colors.error}
                />
                <Text style={styles.consequenceText}>Credenciais de acesso e sessão atual</Text>
              </View>
            </View>

            {/* Acknowledgment Checkbox */}
            <TouchableOpacity
              style={styles.checkboxRow}
              activeOpacity={0.7}
              onPress={() => setIsAcknowledgeChecked((prev) => !prev)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isAcknowledgeChecked }}
              accessibilityLabel="Confirmo que estou ciente da perda definitiva de todos os meus dados"
            >
              <MaterialCommunityIcons
                name={isAcknowledgeChecked ? 'checkbox-marked' : 'checkbox-blank-outline'}
                size={24}
                color={isAcknowledgeChecked ? theme.colors.error : theme.colors.placeholder}
              />
              <Text style={styles.checkboxLabel}>
                Estou ciente de que esta ação é definitiva e que perderei todos os meus dados.
              </Text>
            </TouchableOpacity>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              {isDeletingUser ? (
                <View style={styles.loadingWrapper}>
                  <ActivityIndicator size="large" color={theme.colors.error} />
                  <Text style={styles.loadingText}>Excluindo sua conta...</Text>
                </View>
              ) : (
                <>
                  <CustomButton
                    title="Sim, Excluir Minha Conta"
                    variant="danger"
                    isDisabled={!isAcknowledgeChecked}
                    style={styles.confirmDeleteBtn}
                    onPress={handleConfirmDeleteAccount}
                  />

                  <TouchableOpacity
                    style={styles.modalCancelBtn}
                    activeOpacity={0.7}
                    onPress={handleCloseDeleteModal}
                    accessibilityRole="button"
                    accessibilityLabel="Cancelar e manter minha conta"
                  >
                    <Text style={styles.modalCancelBtnText}>Cancelar e Manter Conta</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>
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
    plannedCard: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.lg,
      padding: theme.spacing.space5,
      width: '100%',
      ...theme.shadows.soft,
    },
    plannedCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.space2,
      marginBottom: theme.spacing.space2,
    },
    plannedCardTitle: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.espressoDark,
    },
    plannedCardSubtitle: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 18,
      marginBottom: theme.spacing.space4,
    },
    plannedList: {
      backgroundColor: theme.colors.surfaceContainerLow,
      borderRadius: theme.rounded.md,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      overflow: 'hidden',
    },
    plannedItemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.space3,
      minHeight: 52,
      gap: theme.spacing.space3,
    },
    plannedItemBorder: {
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
    },
    plannedIconBox: {
      width: 34,
      height: 34,
      borderRadius: theme.rounded.sm,
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },
    plannedItemTextCol: {
      flex: 1,
      gap: 2,
    },
    plannedItemTitle: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.espressoDark,
    },
    plannedItemSubtitle: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 16,
    },
    soonBadge: {
      backgroundColor: theme.colors.chips.secondary.background,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: theme.rounded.full,
    },
    soonBadgeText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 10,
      fontWeight: '700',
      color: theme.colors.chips.secondary.text,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
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
      maxWidth: 320,
      alignSelf: 'flex-start',
      marginVertical: 0,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: theme.colors.backdrop,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: isSmallScreen ? theme.spacing.marginMobile : theme.spacing.marginTablet,
      paddingVertical: theme.spacing.space8,
    },
    modalCard: {
      width: '100%',
      maxWidth: 480,
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.rounded.xl,
      borderWidth: 1.5,
      borderColor: theme.colors.errorContainer,
      padding: isSmallScreen ? theme.spacing.space5 : theme.spacing.space6,
      alignItems: 'center',
      gap: theme.spacing.space3,
      ...theme.shadows.modal,
    },
    modalIconBadge: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: theme.colors.errorContainer,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.spacing.space1,
    },
    modalTitle: {
      fontFamily: theme.typography.headlineLg.fontFamily,
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.espressoDark,
      textAlign: 'center',
    },
    modalWarningBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.colors.errorContainer,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: theme.rounded.sm,
      marginVertical: 2,
    },
    modalWarningText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      fontWeight: '800',
      color: theme.colors.onErrorContainer,
      letterSpacing: 0.5,
    },
    modalDescription: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      lineHeight: 18,
    },
    consequencesList: {
      width: '100%',
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.md,
      padding: theme.spacing.space3,
      gap: 8,
      marginVertical: theme.spacing.space1,
    },
    consequenceItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    consequenceText: {
      flex: 1,
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      color: theme.colors.espressoDark,
      lineHeight: 16,
    },
    checkboxRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      minHeight: theme.spacing.touchable,
      paddingVertical: 6,
      paddingHorizontal: 4,
      width: '100%',
    },
    checkboxLabel: {
      flex: 1,
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.espressoDark,
      lineHeight: 16,
    },
    modalActions: {
      width: '100%',
      alignItems: 'center',
      gap: theme.spacing.space2,
      marginTop: theme.spacing.space2,
    },
    confirmDeleteBtn: {
      width: '100%',
      marginVertical: 0,
    },
    modalCancelBtn: {
      minHeight: theme.spacing.touchable,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.space4,
    },
    modalCancelBtnText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
    },
    loadingWrapper: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.space4,
      gap: theme.spacing.space2,
    },
    loadingText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.error,
      fontWeight: '600',
    },
  });
