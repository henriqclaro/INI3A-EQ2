import { useMemo, useState } from 'react';
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

import {
  CustomButton,
  Input,
  MaterialSymbol,
  OfflineBanner,
  RecipeCompactCard,
  UserAvatar,
} from '@/src/components';
import { useAuth } from '@/src/contexts/AuthContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { useNetwork } from '@/src/hooks/useNetwork';
import { SearchUserItem, useUserBan, useUserSearch } from '@/src/hooks/useUsers';
import { RecipeService } from '@/src/services/recipe';
import { AppTheme } from '@/src/theme/themes';
import { PartialRecipe } from '@/src/types/recipe';
import { formatDate } from '@/src/utils/formatters';
import { getRoleLabel, isAdmin, isModerator, isStaff } from '@/src/utils/roles';

export default function ManagementScreen() {
  const { theme } = useThemeMode();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const { isOffline } = useNetwork();
  const isDesktop = width >= 768;

  const isStaffUser = isStaff(user?.role);
  const isAdminUser = isAdmin(user?.role);
  const isModeratorUser = isModerator(user?.role);

  const [searchEmail, setSearchEmail] = useState('');
  const [hasSearchedUsers, setHasSearchedUsers] = useState(false);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  const [recipeSearchTerm, setRecipeSearchTerm] = useState('');
  const [hasSearchedRecipes, setHasSearchedRecipes] = useState(false);
  const [isSearchingRecipes, setIsSearchingRecipes] = useState(false);
  const [recipeSearchError, setRecipeSearchError] = useState<string | null>(null);
  const [recipeResults, setRecipeResults] = useState<PartialRecipe[]>([]);
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null);
  const [suspendingRecipeId, setSuspendingRecipeId] = useState<string | null>(null);

  const {
    users,
    setUsers,
    searchUsers,
    isLoading: isSearchingUsers,
    error: searchError,
  } = useUserSearch();

  const { banUser, isLoading: isBanningUser } = useUserBan();

  const styles = useMemo(() => createStyles(theme, isDesktop), [theme, isDesktop]);

  // Protect route against unauthorized common users
  if (!user || !isStaffUser) {
    return (
      <View style={styles.unauthorizedContainer}>
        <Stack.Screen options={{ title: 'Acesso Restrito' }} />
        <View style={styles.unauthorizedCard}>
          <MaterialSymbol name="security" size={48} color={theme.colors.error} />
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
    if (isOffline) {
      Alert.alert('Modo Offline', 'A busca de usuários requer uma conexão ativa com a internet.');
      return;
    }
    const trimmed = searchEmail.trim();
    if (!trimmed) {
      Alert.alert('Termo Necessário', 'Digite um e-mail para buscar usuários.');
      return;
    }
    setExpandedUserId(null);
    setHasSearchedUsers(true);
    searchUsers(searchEmail).catch((err) => console.error('Error searching users:', err));
  };

  const handleClear = () => {
    setSearchEmail('');
    setHasSearchedUsers(false);
    setUsers([]);
    setExpandedUserId(null);
  };

  const handleToggleExpand = (id: string) => {
    setExpandedUserId((prev) => (prev === id ? null : id));
  };

  const handleRecipeSearch = async () => {
    if (isOffline) {
      Alert.alert('Modo Offline', 'A busca de receitas requer uma conexão ativa com a internet.');
      return;
    }
    const trimmed = recipeSearchTerm.trim();
    if (!trimmed) {
      Alert.alert('Termo Necessário', 'Digite ao menos uma palavra para buscar receitas.');
      return;
    }
    setExpandedRecipeId(null);
    setHasSearchedRecipes(true);
    setIsSearchingRecipes(true);
    setRecipeSearchError(null);
    try {
      const res = await RecipeService.search({ search: trimmed });
      setRecipeResults(res.data?.recipes ?? []);
    } catch (err: unknown) {
      console.error('Error searching recipes for moderation:', err);
      const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
      setRecipeSearchError(
        apiErr?.response?.data?.message || apiErr?.message || 'Erro ao buscar receitas.',
      );
    } finally {
      setIsSearchingRecipes(false);
    }
  };

  const handleClearRecipeSearch = () => {
    setRecipeSearchTerm('');
    setHasSearchedRecipes(false);
    setRecipeResults([]);
    setExpandedRecipeId(null);
    setRecipeSearchError(null);
  };

  const handleToggleExpandRecipe = (id: string) => {
    setExpandedRecipeId((prev) => (prev === id ? null : id));
  };

  const executeSuspendRecipe = async (targetRecipe: PartialRecipe) => {
    if (isOffline) {
      Alert.alert('Modo Offline', 'Operações de moderação requerem conexão com a internet.');
      return;
    }

    try {
      setSuspendingRecipeId(targetRecipe.id);
      await RecipeService.updateVisibility(targetRecipe.id, {
        userId: user.id,
        status: 'SUSPENDED',
      });
      Alert.alert(
        'Receita Suspensa',
        `A receita "${targetRecipe.title}" foi suspensa com sucesso e não está mais visível para a comunidade.`,
      );
      setRecipeResults((prev) =>
        prev.map((item) => (item.id === targetRecipe.id ? { ...item, status: 'SUSPENDED' } : item)),
      );
    } catch (err: unknown) {
      const apiErr = err as {
        response?: { data?: { message?: string }; status?: number };
        message?: string;
      };
      const msg =
        apiErr?.response?.data?.message ||
        apiErr?.message ||
        'Não foi possível suspender a receita. Verifique suas permissões.';
      Alert.alert('Erro ao Suspender', msg);
    } finally {
      setSuspendingRecipeId(null);
    }
  };

  const executeReactivateRecipe = async (targetRecipe: PartialRecipe) => {
    if (isOffline) {
      Alert.alert('Modo Offline', 'Operações de moderação requerem conexão com a internet.');
      return;
    }

    try {
      setSuspendingRecipeId(targetRecipe.id);
      await RecipeService.updateVisibility(targetRecipe.id, {
        userId: user.id,
        status: 'PUBLISHED',
      });
      Alert.alert(
        'Receita Reativada',
        `A receita "${targetRecipe.title}" foi reativada com sucesso e voltou a ser pública para a comunidade.`,
      );
      setRecipeResults((prev) =>
        prev.map((item) => (item.id === targetRecipe.id ? { ...item, status: 'PUBLISHED' } : item)),
      );
    } catch (err: unknown) {
      const apiErr = err as {
        response?: { data?: { message?: string }; status?: number };
        message?: string;
      };
      const msg =
        apiErr?.response?.data?.message ||
        apiErr?.message ||
        'Não foi possível reativar a receita. Verifique suas permissões.';
      Alert.alert('Erro ao Reativar', msg);
    } finally {
      setSuspendingRecipeId(null);
    }
  };

  const handlePromptSuspendRecipe = (targetRecipe: PartialRecipe) => {
    if (!isAdminUser && !isModeratorUser) {
      Alert.alert(
        'Acesso Restrito',
        'Apenas moderadores e administradores podem suspender receitas.',
      );
      return;
    }

    Alert.alert(
      'Confirmar Suspensão',
      `Deseja realmente suspender a receita "${targetRecipe.title}"? Ela será removida da lista pública e de buscas comunitárias.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Suspender',
          style: 'destructive',
          onPress: () => executeSuspendRecipe(targetRecipe),
        },
      ],
    );
  };

  const handlePromptReactivateRecipe = (targetRecipe: PartialRecipe) => {
    if (!isAdminUser && !isModeratorUser) {
      Alert.alert(
        'Acesso Restrito',
        'Apenas moderadores e administradores podem reativar receitas.',
      );
      return;
    }

    Alert.alert(
      'Confirmar Reativação',
      `Deseja reativar a receita "${targetRecipe.title}"? Ela voltará a ser exibida publicamente para os usuários.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reativar',
          onPress: () => executeReactivateRecipe(targetRecipe),
        },
      ],
    );
  };

  const executeBan = async (targetUser: SearchUserItem) => {
    if (isOffline) {
      Alert.alert('Modo Offline', 'Operações de moderação requerem conexão com a internet.');
      return;
    }

    try {
      await banUser(targetUser.id);
      Alert.alert(
        'Usuário Banido',
        `A conta de "${targetUser.name}" foi banida com sucesso. Todos os acessos ativos foram revogados.`,
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
        'Não foi possível banir o usuário. Verifique suas permissões.';
      Alert.alert('Erro ao Banir', msg);
    }
  };

  const handlePromptBan = (targetUser: SearchUserItem) => {
    if (targetUser.id === user.id) {
      Alert.alert(
        'Ação Inválida',
        'Você não pode banir sua própria conta através desta ferramenta administrativa.',
      );
      return;
    }

    const isTargetStaff = isStaff(targetUser.role);
    if (isModeratorUser && isTargetStaff) {
      Alert.alert(
        'Acesso Restrito',
        'Moderadores não possuem permissão para banir administradores ou outros moderadores.',
      );
      return;
    }

    if (!isAdminUser && !isModeratorUser) {
      Alert.alert('Acesso Restrito', 'Apenas moderadores e administradores podem banir usuários.');
      return;
    }

    Alert.alert(
      'Confirmar Banimento',
      `Deseja realmente banir a conta de "${targetUser.name}"? O usuário perderá o acesso imediato à plataforma, suas receitas públicas serão desativadas e novas tentativas de cadastro com este e-mail/telefone serão bloqueadas.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Banir',
          style: 'destructive',
          onPress: () => executeBan(targetUser),
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
          <OfflineBanner
            isVisible={isOffline}
            message="Você está offline. Operações de moderação requerem conexão ativa com a internet."
          />

          {/* Header Block */}
          <View style={styles.headerBlock}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>Painel de Gestão</Text>
              <View style={styles.roleBadge}>
                <MaterialSymbol
                  name={isAdminUser ? 'security' : 'admin_panel_settings'}
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
                <MaterialSymbol name="person_search" size={22} color={theme.colors.primary} />
              </View>
              <View style={styles.cardHeaderTextCol}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardTitle}>Gerenciamento de Usuários</Text>
                </View>
                <Text style={styles.cardSubtitle}>
                  Busque contas por e-mail para inspecionar perfil comercial, receitas ou aplicar
                  banimento.
                </Text>
              </View>
            </View>

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
                    <MaterialSymbol
                      name="mark_email_read"
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
                      <MaterialSymbol name="search" size={20} color={theme.colors.primary} />
                      {isDesktop && <Text style={styles.searchButtonText}>Buscar</Text>}
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {searchError ? (
                <View style={styles.errorBanner}>
                  <MaterialSymbol name="error" size={16} color={theme.colors.error} />
                  <Text style={styles.errorBannerText}>{searchError}</Text>
                </View>
              ) : null}

              {/* Users Results List */}
              {isSearchingUsers && users.length === 0 ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                  <Text style={styles.loadingText}>Buscando usuários...</Text>
                </View>
              ) : !hasSearchedUsers ? (
                <View style={styles.emptyContainer}>
                  <MaterialSymbol
                    name="person_search"
                    size={36}
                    color={theme.colors.onSurfaceVariant}
                  />
                  <Text style={styles.emptyTitle}>Buscar Usuários</Text>
                  <Text style={styles.emptySubtitle}>
                    Digite um e-mail acima e toque em Buscar para inspecionar contas, receitas ou
                    aplicar banimento.
                  </Text>
                </View>
              ) : users.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <MaterialSymbol
                    name="contact_support"
                    size={36}
                    color={theme.colors.onSurfaceVariant}
                  />
                  <Text style={styles.emptyTitle}>Nenhum usuário encontrado</Text>
                  <Text style={styles.emptySubtitle}>
                    {searchEmail.trim()
                      ? `Não encontramos usuários cadastrados com o e-mail "${searchEmail.trim()}".`
                      : 'Nenhum usuário encontrado com os filtros informados.'}
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
                    const isTargetStaff = isStaff(targetUser.role);
                    const canBanUser =
                      (isAdminUser || (isModeratorUser && !isTargetStaff)) &&
                      targetUser.id !== user.id;
                    const hasAnyAction = hasBakerProfile || hasPublicRecipes || canBanUser;

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
                                  <MaterialSymbol
                                    name="menu_book"
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

                          <MaterialSymbol
                            name={isExpanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
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
                                    <MaterialSymbol
                                      name="storefront"
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
                                    <MaterialSymbol
                                      name="menu_book"
                                      size={18}
                                      color={theme.colors.primary}
                                    />
                                    <Text style={styles.actionBtnSecondaryText} numberOfLines={1}>
                                      Receitas Públicas ({targetUser.recipes.length})
                                    </Text>
                                  </TouchableOpacity>
                                )}

                                {/* Action 3: Ban User (ADMIN or MODERATOR on non-staff) */}
                                {canBanUser && (
                                  <TouchableOpacity
                                    style={styles.actionBtnDanger}
                                    onPress={() => handlePromptBan(targetUser)}
                                    activeOpacity={0.8}
                                    accessibilityRole="button"
                                    accessibilityLabel={`Banir conta de ${targetUser.name}`}
                                    disabled={isBanningUser}
                                  >
                                    {isBanningUser ? (
                                      <ActivityIndicator
                                        size="small"
                                        color={theme.colors.onError}
                                      />
                                    ) : (
                                      <MaterialSymbol
                                        name="person_cancel"
                                        size={18}
                                        color={theme.colors.onError}
                                      />
                                    )}
                                    <Text style={styles.actionBtnDangerText} numberOfLines={1}>
                                      Banir Usuário
                                    </Text>
                                  </TouchableOpacity>
                                )}
                              </View>
                            ) : (
                              <View style={styles.noActionBox}>
                                <MaterialSymbol
                                  name="info"
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
          </View>

          {/* Section: Moderação de Conteúdo */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconCircle}>
                <MaterialSymbol name="security" size={22} color={theme.colors.primary} />
              </View>
              <View style={styles.cardHeaderTextCol}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardTitle}>Moderação de Conteúdo</Text>
                </View>
                <Text style={styles.cardSubtitle}>
                  Busque receitas públicas por título para inspecionar conteúdo ou aplicar
                  suspensão.
                </Text>
              </View>
            </View>

            <View style={styles.searchSectionWrapper}>
              {/* Recipe Search Bar Row */}
              <View style={styles.searchRow}>
                <Input
                  value={recipeSearchTerm}
                  onChangeText={setRecipeSearchTerm}
                  placeholder="Buscar receita pública por título..."
                  placeholderTextColor={theme.colors.placeholder}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                  onSubmitEditing={handleRecipeSearch}
                  containerStyle={styles.searchInput}
                  isClearable={true}
                  onClear={handleClearRecipeSearch}
                  leftIcon={
                    <MaterialSymbol
                      name="find_in_page"
                      size={20}
                      color={theme.colors.onSurfaceVariant}
                    />
                  }
                />

                <TouchableOpacity
                  style={[styles.searchButton, isSearchingRecipes && styles.buttonDisabled]}
                  onPress={handleRecipeSearch}
                  disabled={isSearchingRecipes}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Buscar receitas públicas por título"
                >
                  {isSearchingRecipes ? (
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                  ) : (
                    <>
                      <MaterialSymbol name="search" size={20} color={theme.colors.primary} />
                      {isDesktop && <Text style={styles.searchButtonText}>Buscar</Text>}
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {recipeSearchError ? (
                <View style={styles.errorBanner}>
                  <MaterialSymbol name="error" size={16} color={theme.colors.error} />
                  <Text style={styles.errorBannerText}>{recipeSearchError}</Text>
                </View>
              ) : null}

              {/* Recipe Results List */}
              {isSearchingRecipes && recipeResults.length === 0 ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                  <Text style={styles.loadingText}>Buscando receitas...</Text>
                </View>
              ) : !hasSearchedRecipes ? (
                <View style={styles.emptyContainer}>
                  <MaterialSymbol
                    name="find_in_page"
                    size={36}
                    color={theme.colors.onSurfaceVariant}
                  />
                  <Text style={styles.emptyTitle}>Buscar Receitas Públicas</Text>
                  <Text style={styles.emptySubtitle}>
                    Digite o título de uma receita acima e toque em Buscar para inspecionar ou
                    aplicar moderação.
                  </Text>
                </View>
              ) : recipeResults.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <MaterialSymbol
                    name="menu_book"
                    size={36}
                    color={theme.colors.onSurfaceVariant}
                  />
                  <Text style={styles.emptyTitle}>Nenhuma receita encontrada</Text>
                  <Text style={styles.emptySubtitle}>
                    {recipeSearchTerm.trim()
                      ? `Não encontramos receitas públicas com o título "${recipeSearchTerm.trim()}".`
                      : 'Nenhuma receita pública retornada.'}
                  </Text>
                </View>
              ) : (
                <View style={styles.usersList}>
                  <Text style={styles.resultsCountLabel}>
                    {recipeResults.length}{' '}
                    {recipeResults.length === 1 ? 'receita encontrada' : 'receitas encontradas'}
                  </Text>

                  {recipeResults.map((targetRecipe) => {
                    const isExpanded = expandedRecipeId === targetRecipe.id;
                    const isSuspended = targetRecipe.status === 'SUSPENDED';
                    const isSuspendingCurrent = suspendingRecipeId === targetRecipe.id;

                    return (
                      <RecipeCompactCard
                        key={targetRecipe.id}
                        title={targetRecipe.title}
                        coverUrl={targetRecipe.coverUrl}
                        updatedAt={targetRecipe.updatedAt}
                        status={targetRecipe.status || 'PUBLISHED'}
                        isRatingVisible={false}
                        isExpandable={true}
                        isExpanded={isExpanded}
                        onToggleExpand={() => handleToggleExpandRecipe(targetRecipe.id)}
                      >
                        <View style={styles.userExpandedMeta}>
                          <View style={styles.metaInfoRow}>
                            <Text style={styles.metaLabel}>ID:</Text>
                            <Text style={styles.metaValue} selectable numberOfLines={1}>
                              {targetRecipe.id}
                            </Text>
                          </View>

                          <View style={styles.metaInfoRow}>
                            <Text style={styles.metaLabel}>Status:</Text>
                            <Text
                              style={[styles.metaValue, isSuspended && styles.metaValueSuspended]}
                            >
                              {isSuspended ? 'Suspensa pela Moderação' : 'Pública na Comunidade'}
                            </Text>
                          </View>

                          {targetRecipe.createdAt ? (
                            <View style={styles.metaInfoRow}>
                              <Text style={styles.metaLabel}>Publicada em:</Text>
                              <Text style={styles.metaValue}>
                                {formatDate(targetRecipe.createdAt)}
                              </Text>
                            </View>
                          ) : null}
                        </View>

                        <View style={styles.actionsContainer}>
                          {/* Action 1: Access Single Recipe */}
                          <TouchableOpacity
                            style={styles.actionBtnSecondary}
                            onPress={() =>
                              router.push({
                                pathname: '/single-recipe',
                                params: { recipeId: targetRecipe.id },
                              })
                            }
                            activeOpacity={0.8}
                            accessibilityRole="button"
                            accessibilityLabel={`Acessar receita ${targetRecipe.title}`}
                          >
                            <MaterialSymbol
                              name="menu_book"
                              size={18}
                              color={theme.colors.primary}
                            />
                            <Text style={styles.actionBtnSecondaryText} numberOfLines={1}>
                              Acessar Receita
                            </Text>
                          </TouchableOpacity>

                          {/* Action 2: Suspend or Reactivate Recipe */}
                          {isSuspended ? (
                            <TouchableOpacity
                              style={styles.actionBtnSuccess}
                              onPress={() => handlePromptReactivateRecipe(targetRecipe)}
                              activeOpacity={0.8}
                              accessibilityRole="button"
                              accessibilityLabel={`Reativar receita ${targetRecipe.title}`}
                              disabled={isSuspendingCurrent}
                            >
                              {isSuspendingCurrent ? (
                                <ActivityIndicator size="small" color={theme.colors.onTertiary} />
                              ) : (
                                <MaterialSymbol
                                  name="check_circle"
                                  size={18}
                                  color={theme.colors.onTertiary}
                                />
                              )}
                              <Text style={styles.actionBtnSuccessText} numberOfLines={1}>
                                Reativar Receita
                              </Text>
                            </TouchableOpacity>
                          ) : (
                            <TouchableOpacity
                              style={styles.actionBtnDanger}
                              onPress={() => handlePromptSuspendRecipe(targetRecipe)}
                              activeOpacity={0.8}
                              accessibilityRole="button"
                              accessibilityLabel={`Suspender receita ${targetRecipe.title}`}
                              disabled={isSuspendingCurrent}
                            >
                              {isSuspendingCurrent ? (
                                <ActivityIndicator size="small" color={theme.colors.onError} />
                              ) : (
                                <MaterialSymbol
                                  name="report"
                                  size={18}
                                  color={theme.colors.onError}
                                />
                              )}
                              <Text style={styles.actionBtnDangerText} numberOfLines={1}>
                                Suspender Receita
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </RecipeCompactCard>
                    );
                  })}
                </View>
              )}
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
    metaValueSuspended: {
      color: theme.colors.error,
      fontWeight: '600',
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
    actionBtnSuccess: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      height: 48,
      minHeight: 48,
      width: isDesktop ? undefined : '100%',
      paddingHorizontal: 16,
      backgroundColor: theme.colors.tertiary,
      borderRadius: theme.rounded.default,
      ...theme.shadows.soft,
    },
    actionBtnSuccessText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.onTertiary,
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
