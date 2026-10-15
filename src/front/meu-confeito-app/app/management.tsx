import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

import { Stack, router } from 'expo-router';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { CustomButton, Input, UserAvatar } from '@/src/components';
import { useAuth } from '@/src/contexts/AuthContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { SearchUserItem, useUserSearch, useUserSuspend } from '@/src/hooks/useUsers';
import { AppTheme } from '@/src/theme/themes';
import { getRoleLabel, isAdmin, isStaff } from '@/src/utils/roles';

export default function ManagementScreen() {
  const { theme } = useThemeMode();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const isStaffUser = isStaff(user?.role);
  const isAdminUser = isAdmin(user?.role);

  const [searchEmail, setSearchEmail] = useState('');
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  const {
    users,
    setUsers,
    searchUsers,
    isLoading: isSearchingUsers,
    error: searchError,
  } = useUserSearch();

  const { suspendUser, isLoading: isSuspendingUser } = useUserSuspend();

  const styles = useMemo(() => createStyles(theme, isDesktop), [theme, isDesktop]);

  // Load initial active users when admin enters the screen
  useEffect(() => {
    if (isAdminUser) {
      searchUsers('').catch((err) => console.error('Error fetching initial users list:', err));
    }
  }, [isAdminUser, searchUsers]);

  // Protect route against unauthorized common users
  if (!user || !isStaffUser) {
    return (
      <View style={styles.unauthorizedContainer}>
        <Stack.Screen options={{ title: 'Acesso Restrito' }} />
        <View style={styles.unauthorizedCard}>
          <MaterialCommunityIcons
            name="shield-alert-outline"
            size={48}
            color={theme.colors.error}
          />
          <Text style={styles.unauthorizedTitle}>Acesso Restrito</Text>
          <Text style={styles.unauthorizedSubtitle}>
            Esta área é reservada exclusivamente para moderadores e administradores da plataforma.
          </Text>
          <CustomButton
            title="Voltar ao Início"
            variant="primary"
            onPress={() => router.replace('/(tabs)/home')}
          />
        </View>
      </View>
    );
  }

  const handleSearch = () => {
    setExpandedUserId(null);
    searchUsers(searchEmail).catch((err) => console.error('Error searching users:', err));
  };

  const handleClear = () => {
    setSearchEmail('');
    setExpandedUserId(null);
    searchUsers('').catch((err) => console.error('Error resetting users list:', err));
  };

  const handleToggleExpand = (id: string) => {
    setExpandedUserId((prev) => (prev === id ? null : id));
  };

  const executeSuspension = async (targetUser: SearchUserItem) => {
    try {
      await suspendUser(targetUser.id);
      Alert.alert(
        'Usuário Suspenso',
        `A conta de "${targetUser.name}" foi suspensa com sucesso. Todos os acessos ativos foram revogados.`,
      );
      setUsers((prev) => prev.filter((item) => item.id !== targetUser.id));
      if (expandedUserId === targetUser.id) {
        setExpandedUserId(null);
      }
    } catch (err: unknown) {
      const apiErr = err as {
        response?: { data?: { message?: string }; status?: number };
        message?: string;
      };
      const msg =
        apiErr?.response?.data?.message ||
        apiErr?.message ||
        'Não foi possível suspender o usuário. Verifique suas permissões.';
      Alert.alert('Erro ao Suspender', msg);
    }
  };

  const handlePromptSuspend = (targetUser: SearchUserItem) => {
    if (!isAdminUser) {
      Alert.alert('Acesso Restrito', 'Apenas administradores podem suspender usuários.');
      return;
    }

    if (targetUser.id === user.id) {
      Alert.alert(
        'Ação Inválida',
        'Você não pode suspender sua própria conta através desta ferramenta administrativa.',
      );
      return;
    }

    Alert.alert(
      'Confirmar Suspensão',
      `Deseja realmente suspender a conta de "${targetUser.name}"? O usuário perderá o acesso imediato à plataforma e suas receitas e perfil público serão desativados.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Suspender',
          style: 'destructive',
          onPress: () => executeSuspension(targetUser),
        },
      ],
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Painel de Gestão' }} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrapper}>
          {/* Header Block */}
          <View style={styles.headerBlock}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>Painel de Gestão</Text>
              <View style={styles.roleBadge}>
                <MaterialCommunityIcons
                  name={isAdminUser ? 'shield-crown' : 'shield-account'}
                  size={14}
                  color={isAdminUser ? theme.colors.tertiary : theme.colors.primary}
                />
                <Text
                  style={[styles.roleBadgeText, isAdminUser && { color: theme.colors.tertiary }]}
                >
                  {getRoleLabel(user.role).toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={styles.headerSubtitle}>
              Ferramentas restritas para controle e segurança da comunidade.
            </Text>
          </View>

          {/* Section: Gerenciamento e Busca de Usuários */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconCircle}>
                <MaterialCommunityIcons
                  name="account-search-outline"
                  size={22}
                  color={theme.colors.primary}
                />
              </View>
              <View style={styles.cardHeaderTextCol}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardTitle}>Gerenciamento de Usuários</Text>
                  {!isAdminUser && (
                    <View style={styles.restrictedBadge}>
                      <MaterialCommunityIcons
                        name="lock-outline"
                        size={12}
                        color={theme.colors.onSurfaceVariant}
                      />
                      <Text style={styles.restrictedBadgeText}>Apenas Admin</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cardSubtitle}>
                  Busque contas por e-mail para inspecionar perfil comercial, receitas ou suspender.
                </Text>
              </View>
            </View>

            {isAdminUser ? (
              <View style={styles.searchSectionWrapper}>
                {/* Search Bar Row */}
                <View style={styles.searchRow}>
                  <Input
                    value={searchEmail}
                    onChangeText={setSearchEmail}
                    placeholder="Buscar usuário por e-mail..."
                    placeholderTextColor={theme.colors.placeholder}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="search"
                    onSubmitEditing={handleSearch}
                    containerStyle={styles.searchInput}
                    isClearable={true}
                    onClear={handleClear}
                    leftIcon={
                      <MaterialCommunityIcons
                        name="email-search-outline"
                        size={20}
                        color={theme.colors.onSurfaceVariant}
                      />
                    }
                  />

                  <TouchableOpacity
                    style={[styles.searchButton, isSearchingUsers && styles.buttonDisabled]}
                    onPress={handleSearch}
                    disabled={isSearchingUsers}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel="Buscar usuários por e-mail"
                  >
                    {isSearchingUsers ? (
                      <ActivityIndicator size="small" color={theme.colors.primary} />
                    ) : (
                      <>
                        <MaterialCommunityIcons
                          name="magnify"
                          size={20}
                          color={theme.colors.primary}
                        />
                        {isDesktop && <Text style={styles.searchButtonText}>Buscar</Text>}
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                {searchError ? (
                  <View style={styles.errorBanner}>
                    <MaterialCommunityIcons
                      name="alert-circle-outline"
                      size={16}
                      color={theme.colors.error}
                    />
                    <Text style={styles.errorBannerText}>{searchError}</Text>
                  </View>
                ) : null}

                {/* Users Results List */}
                {isSearchingUsers && users.length === 0 ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={styles.loadingText}>Buscando usuários...</Text>
                  </View>
                ) : users.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <MaterialCommunityIcons
                      name="account-question-outline"
                      size={36}
                      color={theme.colors.onSurfaceVariant}
                    />
                    <Text style={styles.emptyTitle}>Nenhum usuário encontrado</Text>
                    <Text style={styles.emptySubtitle}>
                      {searchEmail.trim()
                        ? `Não encontramos usuários cadastrados com o e-mail "${searchEmail.trim()}".`
                        : 'Nenhum usuário ativo retornado.'}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.usersList}>
                    <Text style={styles.resultsCountLabel}>
                      {users.length}{' '}
                      {users.length === 1 ? 'usuário encontrado' : 'usuários encontrados'}
                    </Text>

                    {users.map((targetUser) => {
                      const isExpanded = expandedUserId === targetUser.id;
                      const hasBakerProfile = Boolean(targetUser.publicName);
                      const hasPublicRecipes = Boolean(
                        targetUser.recipes && targetUser.recipes.length > 0,
                      );
                      const canSuspendUser = isAdminUser && targetUser.id !== user.id;
                      const hasAnyAction = hasBakerProfile || hasPublicRecipes || canSuspendUser;

                      const roleColors = getRoleBadgeColors(targetUser.role, theme);

                      return (
                        <View key={targetUser.id} style={styles.userCard}>
                          {/* Card Header (clickable accordion toggle) */}
                          <TouchableOpacity
                            style={styles.userCardHeader}
                            onPress={() => handleToggleExpand(targetUser.id)}
                            activeOpacity={0.7}
                            accessibilityRole="button"
                            accessibilityLabel={`Detalhes de ${targetUser.name}`}
                          >
                            <UserAvatar
                              url={targetUser.pfpUrl}
                              name={targetUser.name}
                              size={44}
                              fallbackType="initial"
                            />

                            <View style={styles.userDetailsCol}>
                              <View style={styles.userNameRow}>
                                <Text style={styles.userNameText} numberOfLines={1}>
                                  {targetUser.name}
                                </Text>
                                {targetUser.publicName ? (
                                  <Text style={styles.userPublicNameText} numberOfLines={1}>
                                    ({targetUser.publicName})
                                  </Text>
                                ) : null}
                              </View>

                              <View style={styles.userMetaBadgesRow}>
                                <View
                                  style={[
                                    styles.userRoleBadge,
                                    {
                                      backgroundColor: roleColors.bg,
                                      borderColor: roleColors.border,
                                    },
                                  ]}
                                >
                                  <Text style={[styles.userRoleText, { color: roleColors.text }]}>
                                    {getRoleLabel(targetUser.role)}
                                  </Text>
                                </View>

                                {hasPublicRecipes ? (
                                  <View style={styles.recipesCountBadge}>
                                    <MaterialCommunityIcons
                                      name="book-open-outline"
                                      size={12}
                                      color={theme.colors.onSurfaceVariant}
                                    />
                                    <Text style={styles.recipesCountBadgeText}>
                                      {targetUser.recipes.length}{' '}
                                      {targetUser.recipes.length === 1 ? 'receita' : 'receitas'}
                                    </Text>
                                  </View>
                                ) : null}
                              </View>
                            </View>

                            <MaterialCommunityIcons
                              name={isExpanded ? 'chevron-up' : 'chevron-down'}
                              size={24}
                              color={theme.colors.onSurfaceVariant}
                            />
                          </TouchableOpacity>

                          {/* Expanded Action Menu */}
                          {isExpanded && (
                            <View style={styles.userExpandedContent}>
                              {/* Metadata Info */}
                              <View style={styles.userExpandedMeta}>
                                <View style={styles.metaInfoRow}>
                                  <Text style={styles.metaLabel}>ID:</Text>
                                  <Text style={styles.metaValue} selectable numberOfLines={1}>
                                    {targetUser.id}
                                  </Text>
                                </View>

                                {targetUser.publicName ? (
                                  <View style={styles.metaInfoRow}>
                                    <Text style={styles.metaLabel}>Nome Comercial:</Text>
                                    <Text style={styles.metaValue} numberOfLines={1}>
                                      {targetUser.publicName}
                                    </Text>
                                  </View>
                                ) : null}

                                <View style={styles.metaInfoRow}>
                                  <Text style={styles.metaLabel}>Receitas Públicas:</Text>
                                  <Text style={styles.metaValue}>
                                    {targetUser.recipes?.length ?? 0}
                                  </Text>
                                </View>
                              </View>

                              {/* Action Buttons Row / Column */}
                              {hasAnyAction ? (
                                <View style={styles.actionsContainer}>
                                  {/* Action 1: Public Profile (Baker) */}
                                  {hasBakerProfile && (
                                    <TouchableOpacity
                                      style={styles.actionBtnSecondary}
                                      onPress={() =>
                                        router.push({
                                          pathname: '/public-profile',
                                          params: { id: targetUser.id },
                                        })
                                      }
                                      activeOpacity={0.8}
                                      accessibilityRole="button"
                                      accessibilityLabel={`Ver perfil público de ${targetUser.name}`}
                                    >
                                      <MaterialCommunityIcons
                                        name="storefront-outline"
                                        size={18}
                                        color={theme.colors.primary}
                                      />
                                      <Text style={styles.actionBtnSecondaryText} numberOfLines={1}>
                                        Perfil Comercial
                                      </Text>
                                    </TouchableOpacity>
                                  )}

                                  {/* Action 2: Public Recipes */}
                                  {hasPublicRecipes && (
                                    <TouchableOpacity
                                      style={styles.actionBtnSecondary}
                                      onPress={() =>
                                        router.push({
                                          pathname: '/public-recipes',
                                          params: {
                                            userId: targetUser.id,
                                            userName: targetUser.publicName || targetUser.name,
                                          },
                                        })
                                      }
                                      activeOpacity={0.8}
                                      accessibilityRole="button"
                                      accessibilityLabel={`Ver receitas públicas de ${targetUser.name}`}
                                    >
                                      <MaterialCommunityIcons
                                        name="book-open-page-variant"
                                        size={18}
                                        color={theme.colors.primary}
                                      />
                                      <Text style={styles.actionBtnSecondaryText} numberOfLines={1}>
                                        Receitas Públicas ({targetUser.recipes.length})
                                      </Text>
                                    </TouchableOpacity>
                                  )}

                                  {/* Action 3: Suspend User (ADMIN only) */}
                                  {canSuspendUser && (
                                    <TouchableOpacity
                                      style={styles.actionBtnDanger}
                                      onPress={() => handlePromptSuspend(targetUser)}
                                      activeOpacity={0.8}
                                      accessibilityRole="button"
                                      accessibilityLabel={`Suspender conta de ${targetUser.name}`}
                                      disabled={isSuspendingUser}
                                    >
                                      {isSuspendingUser ? (
                                        <ActivityIndicator
                                          size="small"
                                          color={theme.colors.onError}
                                        />
                                      ) : (
                                        <MaterialCommunityIcons
                                          name="account-cancel-outline"
                                          size={18}
                                          color={theme.colors.onError}
                                        />
                                      )}
                                      <Text style={styles.actionBtnDangerText} numberOfLines={1}>
                                        Suspender Usuário
                                      </Text>
                                    </TouchableOpacity>
                                  )}
                                </View>
                              ) : (
                                <View style={styles.noActionBox}>
                                  <MaterialCommunityIcons
                                    name="information-outline"
                                    size={16}
                                    color={theme.colors.onSurfaceVariant}
                                  />
                                  <Text style={styles.noActionText}>
                                    Nenhuma ação disponível para esta conta.
                                  </Text>
                                </View>
                              )}
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.moderatorNoticeBox}>
                <MaterialCommunityIcons
                  name="shield-lock-outline"
                  size={20}
                  color={theme.colors.onSurfaceVariant}
                />
                <Text style={styles.moderatorNoticeText}>
                  A busca direta de usuários e suspensão de contas exige privilégio administrativo
                  (ADMIN). Como moderador, utilize as ferramentas de análise de denúncias.
                </Text>
              </View>
            )}
          </View>

          {/* Section: Ferramentas de Moderação (Em Breve) */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconCircle}>
                <MaterialCommunityIcons
                  name="flag-outline"
                  size={22}
                  color={theme.colors.primary}
                />
              </View>
              <View style={styles.cardHeaderTextCol}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardTitle}>Moderação de Conteúdo</Text>
                  <View style={styles.upcomingBadge}>
                    <Text style={styles.upcomingBadgeText}>Em Breve</Text>
                  </View>
                </View>
                <Text style={styles.cardSubtitle}>
                  Fila de análise de denúncias de receitas, fotos e avaliações públicas.
                </Text>
              </View>
            </View>

            <View style={styles.upcomingContentBox}>
              <Text style={styles.upcomingDescription}>
                Recursos de moderação de publicações e denúncias da comunidade estão em
                desenvolvimento e serão disponibilizados para moderadores e administradores.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const getRoleBadgeColors = (role: string, theme: AppTheme) => {
  switch (role) {
    case 'ADMIN':
      return {
        bg: theme.colors.tertiaryContainer,
        text: theme.colors.onTertiaryContainer,
        border: theme.colors.outlineVariant,
      };
    case 'MODERATOR':
      return {
        bg: theme.colors.secondaryContainer,
        text: theme.colors.onSecondaryContainer,
        border: theme.colors.outlineVariant,
      };
    case 'BAKER':
      return {
        bg: theme.colors.primaryContainer,
        text: theme.colors.onPrimaryContainer,
        border: theme.colors.outlineVariant,
      };
    default:
      return {
        bg: theme.colors.surfaceContainerHigh,
        text: theme.colors.onSurfaceVariant,
        border: theme.colors.outlineVariant,
      };
  }
};

const createStyles = (theme: AppTheme, isDesktop: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      paddingHorizontal: isDesktop ? 24 : 16,
      paddingVertical: 20,
      alignItems: 'center',
    },
    contentWrapper: {
      width: '100%',
      maxWidth: 680,
      gap: 16,
    },
    headerBlock: {
      width: '100%',
      gap: 6,
      marginBottom: 4,
    },
    headerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    headerTitle: {
      fontFamily: theme.typography.headlineLg.fontFamily,
      fontSize: 24,
      color: theme.colors.espressoDark,
      letterSpacing: 0.5,
    },
    roleBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: theme.rounded.full,
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    roleBadgeText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.primary,
      letterSpacing: 0.5,
    },
    headerSubtitle: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
    card: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.rounded.lg,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: isDesktop ? 20 : 16,
      gap: 16,
      ...theme.shadows.soft,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    cardIconCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.surfaceContainerLow,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    cardHeaderTextCol: {
      flex: 1,
      gap: 4,
    },
    cardTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
    },
    cardTitle: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 17,
      color: theme.colors.espressoDark,
      fontWeight: '700',
    },
    cardSubtitle: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 18,
    },
    restrictedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: theme.rounded.full,
      backgroundColor: theme.colors.surfaceContainerHigh,
    },
    restrictedBadgeText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
    },
    searchSectionWrapper: {
      gap: 16,
      width: '100%',
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      width: '100%',
    },
    searchInput: {
      flex: 1,
      width: undefined,
      margin: 0,
      height: 48,
      minHeight: 48,
    },
    searchButton: {
      height: 48,
      minHeight: 48,
      paddingHorizontal: isDesktop ? 18 : 14,
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.rounded.default,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      ...theme.shadows.soft,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    searchButtonText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: 10,
      borderRadius: theme.rounded.md,
      backgroundColor: theme.colors.errorContainer,
    },
    errorBannerText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onErrorContainer,
      flex: 1,
    },
    loadingContainer: {
      paddingVertical: 28,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    loadingText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
    emptyContainer: {
      paddingVertical: 28,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderRadius: theme.rounded.md,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      paddingHorizontal: 16,
    },
    emptyTitle: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 15,
      color: theme.colors.espressoDark,
      fontWeight: '600',
    },
    emptySubtitle: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
    },
    usersList: {
      gap: 12,
      width: '100%',
    },
    resultsCountLabel: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      fontWeight: '600',
    },
    userCard: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.rounded.md,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      overflow: 'hidden',
      ...theme.shadows.soft,
    },
    userCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 14,
      minHeight: 64,
    },
    userDetailsCol: {
      flex: 1,
      gap: 4,
    },
    userNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexWrap: 'wrap',
    },
    userNameText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.espressoDark,
    },
    userPublicNameText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.primary,
      fontWeight: '500',
    },
    userMetaBadgesRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexWrap: 'wrap',
    },
    userRoleBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: theme.rounded.sm,
      borderWidth: 1,
    },
    userRoleText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      fontWeight: '600',
    },
    recipesCountBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: theme.rounded.sm,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    recipesCountBadgeText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
    },
    userExpandedContent: {
      backgroundColor: theme.colors.surfaceContainerLow,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
      padding: 14,
      gap: 12,
    },
    userExpandedMeta: {
      gap: 6,
      paddingBottom: 4,
    },
    metaInfoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    metaLabel: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      fontWeight: '600',
    },
    metaValue: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      color: theme.colors.espressoDark,
      flex: 1,
    },
    actionsContainer: {
      flexDirection: isDesktop ? 'row' : 'column',
      alignItems: isDesktop ? 'center' : 'stretch',
      gap: 10,
      flexWrap: isDesktop ? 'wrap' : 'nowrap',
      width: '100%',
    },
    actionBtnSecondary: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      height: 48,
      minHeight: 48,
      width: isDesktop ? undefined : '100%',
      paddingHorizontal: 16,
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.rounded.default,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      ...theme.shadows.soft,
    },
    actionBtnSecondaryText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.primary,
      textAlign: 'center',
    },
    actionBtnDanger: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      height: 48,
      minHeight: 48,
      width: isDesktop ? undefined : '100%',
      paddingHorizontal: 16,
      backgroundColor: theme.colors.error,
      borderRadius: theme.rounded.default,
      ...theme.shadows.soft,
    },
    actionBtnDangerText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.onError,
      textAlign: 'center',
    },
    noActionBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 6,
    },
    noActionText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      fontStyle: 'italic',
    },
    moderatorNoticeBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: theme.colors.surfaceContainerLow,
      padding: 12,
      borderRadius: theme.rounded.md,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    moderatorNoticeText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      flex: 1,
      lineHeight: 18,
    },
    upcomingBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: theme.rounded.full,
      backgroundColor: theme.colors.surfaceContainerHigh,
    },
    upcomingBadgeText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
    },
    upcomingContentBox: {
      backgroundColor: theme.colors.surfaceContainerLow,
      padding: 14,
      borderRadius: theme.rounded.md,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    upcomingDescription: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 18,
    },
    unauthorizedContainer: {
      flex: 1,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    unauthorizedCard: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.rounded.lg,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: 24,
      alignItems: 'center',
      gap: 12,
      maxWidth: 400,
      width: '100%',
      ...theme.shadows.soft,
    },
    unauthorizedTitle: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 20,
      color: theme.colors.error,
      fontWeight: '700',
    },
    unauthorizedSubtitle: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      lineHeight: 20,
    },
  });
