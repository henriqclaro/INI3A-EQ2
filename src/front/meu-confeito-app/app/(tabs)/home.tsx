import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

import { router } from 'expo-router';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import {
  BakerOverviewBanner,
  BakerQuickActionsGrid,
  BakerRecentProductionsCard,
  BakerStockAlertCard,
  NearbyBakersExplorer,
  OfflineBanner,
  OnboardingCard,
  RecipeSmallView,
} from '@/src/components';
import { useAuth } from '@/src/contexts/AuthContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { useInventory } from '@/src/hooks/useInventory';
import { useNetwork } from '@/src/hooks/useNetwork';
import { useProductions } from '@/src/hooks/useProductions';
import { useUserRecipes } from '@/src/hooks/useRecipes';
import { useSavedRecipes } from '@/src/hooks/useSavedRecipes';
import { AppTheme } from '@/src/theme/themes';
import { isExpired, isExpiringSoon } from '@/src/utils/formatters';
import { isBaker, isCustomer } from '@/src/utils/roles';

function CustomerHomeScreen() {
  const { theme } = useThemeMode();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isWebSidebarPresent = Platform.OS === 'web' && width >= theme.breakpoints.lg;
  const effectiveWidth = isWebSidebarPresent ? width - 260 : width;
  const isDesktop = effectiveWidth >= theme.breakpoints.md;
  const styles = useMemo(() => createCustomerStyles(theme, isDesktop), [theme, isDesktop]);

  const firstName = user?.name ? user.name.split(' ')[0] : 'Cliente';

  return (
    <View style={styles.container}>
      <View style={styles.contentWrapper}>
        <NearbyBakersExplorer
          hasIntroHeader={false}
          isTwoColumnDesktop={isDesktop}
          headerContent={
            <View style={styles.header}>
              <Text style={styles.title}>Olá, {firstName}!</Text>
              <Text style={styles.subtitle}>
                Descubra confeitarias e doces artesanais por proximidade ou por cidade.
              </Text>
              <OnboardingCard
                id="home_welcome"
                isHero={true}
                icon="cake-variant-outline"
                title="Bem-vindo ao Meu Confeito!"
                description="Conecte-se com os melhores confeiteiros da sua região, descubra delícias artesanais e encontre receitas exclusivas para qualquer ocasião."
                actionText="Explorar Confeitarias"
                style={styles.welcomeHeroCard}
              />
            </View>
          }
        />
      </View>
    </View>
  );
}

function BakerHomeScreen() {
  const { theme } = useThemeMode();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isWebSidebarPresent = Platform.OS === 'web' && width >= theme.breakpoints.lg;
  const effectiveWidth = isWebSidebarPresent ? width - 260 : width;

  const isSmallScreen = effectiveWidth < theme.breakpoints.sm;
  const isDesktop = effectiveWidth >= theme.breakpoints.md;
  const isLargeDesktop = effectiveWidth >= theme.breakpoints.lg;
  const hasTwoColumns = effectiveWidth >= theme.breakpoints.md;

  const styles = useMemo(
    () => createBakerStyles(theme, isSmallScreen, isDesktop, isLargeDesktop),
    [theme, isSmallScreen, isDesktop, isLargeDesktop],
  );

  const { isOffline: isNetworkOffline } = useNetwork();
  const isBakerRole = isBaker(user?.role);
  const {
    recipes,
    isOffline: isRecipesOffline,
    refetch: refetchRecipes,
  } = useUserRecipes(user?.id);
  const {
    inventory,
    isOffline: isInventoryOffline,
    refetch: refetchInventory,
  } = useInventory(isBakerRole);
  const {
    productions,
    isLoading: isLoadingProductions,
    isOffline: isProductionsOffline,
    refetch: refetchProductions,
  } = useProductions(undefined, isBakerRole);
  const {
    savedRecipes,
    isOffline: isSavedOffline,
    refetch: refetchSavedRecipes,
  } = useSavedRecipes(user?.id);

  const isHomeOffline =
    isNetworkOffline ||
    isRecipesOffline ||
    isInventoryOffline ||
    isProductionsOffline ||
    isSavedOffline;

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.allSettled([
        refetchRecipes(),
        refetchInventory(),
        refetchProductions(),
        refetchSavedRecipes(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchRecipes, refetchInventory, refetchProductions, refetchSavedRecipes]);

  const firstName = user?.name ? user.name.split(' ')[0] : 'Confeiteira';

  const stockCount = inventory.length;
  const savedCount = savedRecipes.length;
  const productionCount = productions.length;
  const recipesCount = recipes.length;

  const lowStockItems = useMemo(
    () => inventory.filter((item) => Number(item.currentQuantity) <= 0),
    [inventory],
  );

  const expiredItems = useMemo(
    () =>
      inventory.filter(
        (item) => Number(item.currentQuantity) > 0 && isExpired(item.expirationDate),
      ),
    [inventory],
  );

  const expiringSoonItems = useMemo(
    () =>
      inventory.filter(
        (item) =>
          Number(item.currentQuantity) > 0 &&
          !isExpired(item.expirationDate) &&
          isExpiringSoon(item.expirationDate),
      ),
    [inventory],
  );

  const hasStockAlert =
    lowStockItems.length > 0 || expiringSoonItems.length > 0 || expiredItems.length > 0;
  const recentRecipes = useMemo(
    () => recipes.slice(0, isLargeDesktop ? 4 : 3),
    [recipes, isLargeDesktop],
  );

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        <View style={styles.contentWrapper}>
          {/* Inner Header with Greetings & Desktop Quick Actions */}
          <View style={styles.headerBlock}>
            <View style={styles.headerTextCol}>
              <Text style={styles.greetingTitle}>Olá, {firstName}!</Text>
              <Text style={styles.greetingSubtitle}>
                Painel de controle e produção da sua cozinha digital.
              </Text>
            </View>

            {isDesktop && (
              <View style={styles.headerActionsRow}>
                <TouchableOpacity
                  style={styles.headerSecondaryBtn}
                  onPress={() => {
                    if (isHomeOffline) {
                      Alert.alert(
                        'Modo Offline',
                        'O cadastro de novos insumos requer conexão com a internet.',
                      );
                      return;
                    }
                    router.push('/register-stock');
                  }}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Cadastrar novo insumo no estoque"
                >
                  <MaterialCommunityIcons
                    name="package-variant-plus"
                    size={18}
                    color={theme.colors.espressoDark}
                  />
                  <Text style={styles.headerSecondaryBtnText}>Novo Insumo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.headerPrimaryBtn}
                  onPress={() => router.push('/create-recipe')}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel="Cadastrar nova receita"
                >
                  <MaterialCommunityIcons name="plus" size={18} color={theme.colors.onPrimary} />
                  <Text style={styles.headerPrimaryBtnText}>Nova Receita</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Welcome & App Presentation Hero Card */}
          <OnboardingCard
            id="home_welcome"
            isHero={true}
            icon="cake-variant-outline"
            title="Bem-vindo ao Meu Confeito!"
            description="Sua confeitaria digital para calcular custos precisos de receitas, monitorar estoque em tempo real e organizar produções artesanais com foco no lucro real."
            actionText="Explorar Meu Confeito"
            style={styles.welcomeHeroCard}
          />

          {/* Offline Mode Banner */}
          <OfflineBanner
            isVisible={isHomeOffline}
            message="Você está no modo offline. Exibindo dados salvos no seu dispositivo."
            onRetry={handleRefresh}
          />

          {/* Overview Stat Banner */}
          <BakerOverviewBanner
            recipesCount={recipesCount}
            stockCount={stockCount}
            productionsCount={productionCount}
            savedCount={savedCount}
            onRecipesPress={() => router.push('/recipes')}
            onStockPress={() => router.push('/stock')}
            onProductionsPress={() => router.push('/productions')}
            onSavedPress={() => router.push('/saved-recipes')}
          />

          {hasTwoColumns ? (
            /* Multi-column Split View for Tablet and Desktop Screens */
            <View style={styles.columnsContainer}>
              {/* Left Column: Quick Actions & Recent Author Recipes */}
              <View style={styles.leftColumn}>
                <BakerQuickActionsGrid
                  stockCount={stockCount}
                  hasStockAlert={hasStockAlert}
                  savedCount={savedCount}
                  productionCount={productionCount}
                  onStockPress={() => router.push('/stock')}
                  onSavedRecipesPress={() => router.push('/saved-recipes')}
                  onPublicRecipesPress={() => router.push('/public-recipes')}
                  onProductionsPress={() => router.push('/productions')}
                />

                <View style={styles.recipesSection}>
                  <View style={styles.sectionHeaderRow}>
                    <View style={styles.sectionTitleGroup}>
                      <MaterialCommunityIcons
                        name="book-open-page-variant-outline"
                        size={20}
                        color={theme.colors.primary}
                      />
                      <Text style={styles.sectionTitle}>Suas Criações Recentes</Text>
                    </View>

                    {recipes.length > 0 ? (
                      <TouchableOpacity
                        onPress={() => router.push('/recipes')}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        accessibilityRole="button"
                        accessibilityLabel="Ver todas as receitas cadastradas"
                      >
                        <Text style={styles.viewAllText}>Ver todas</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  {recipes.length > 0 ? (
                    <View style={styles.recipesGrid}>
                      {recentRecipes.map((recipe) => (
                        <View key={recipe.id} style={styles.recipeGridItem}>
                          <RecipeSmallView
                            title={recipe.title}
                            coverUrl={recipe.coverUrl}
                            updatedAt={recipe.updatedAt}
                            prepTimeMinutes={recipe.prepTimeMinutes}
                            onPress={() => {
                              router.push({
                                pathname: '/single-recipe',
                                params: { recipeId: recipe.id },
                              });
                            }}
                          />
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View style={styles.emptyRecipesCard}>
                      <MaterialCommunityIcons
                        name="notebook-plus-outline"
                        size={36}
                        color={theme.colors.primary}
                      />
                      <Text style={styles.emptyRecipesTitle}>Seu caderno está vazio</Text>
                      <Text style={styles.emptyRecipesSubtitle}>
                        Comece registrando sua primeira receita autoral para calcular custos e
                        planejar lotes com precisão.
                      </Text>
                      <TouchableOpacity
                        style={styles.createRecipeBtn}
                        onPress={() => router.push('/create-recipe')}
                        activeOpacity={0.85}
                        accessibilityRole="button"
                        accessibilityLabel="Criar primeira receita"
                      >
                        <MaterialCommunityIcons
                          name="plus"
                          size={18}
                          color={theme.colors.onPrimary}
                        />
                        <Text style={styles.createRecipeBtnText}>Criar Primeira Receita</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>

              {/* Right Column: Stock Health, Productions, and Confectionery Management Tip */}
              <View style={styles.rightColumn}>
                <BakerStockAlertCard
                  lowStockCount={lowStockItems.length}
                  expiredCount={expiredItems.length}
                  expiringSoonCount={expiringSoonItems.length}
                  totalItemsCount={stockCount}
                  onPress={() => router.push('/stock')}
                />

                <BakerRecentProductionsCard
                  productions={productions}
                  isLoading={isLoadingProductions}
                  onViewAllPress={() => router.push('/productions')}
                />

                <View style={styles.managementTipCard}>
                  <View style={styles.tipCardTop}>
                    <View style={styles.tipIconBox}>
                      <MaterialCommunityIcons
                        name="calculator-variant-outline"
                        size={20}
                        color={theme.colors.primary}
                      />
                    </View>
                    <Text style={styles.tipCardTitle}>Gestão de Custos</Text>
                  </View>
                  <Text style={styles.tipCardBody}>
                    O custo unitário e a margem de lucro de cada receita são recalculados
                    automaticamente sempre que você atualiza o preço dos insumos no estoque.
                  </Text>
                  <TouchableOpacity
                    style={styles.tipActionBtn}
                    onPress={() => router.push('/stock')}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                    accessibilityLabel="Acessar estoque de insumos"
                  >
                    <Text style={styles.tipActionText}>Conferir Estoque</Text>
                    <MaterialCommunityIcons
                      name="arrow-right"
                      size={16}
                      color={theme.colors.primary}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            /* Single Column Flow for Tablet and Mobile Screens */
            <>
              <BakerQuickActionsGrid
                stockCount={stockCount}
                hasStockAlert={hasStockAlert}
                savedCount={savedCount}
                productionCount={productionCount}
                onStockPress={() => router.push('/stock')}
                onSavedRecipesPress={() => router.push('/saved-recipes')}
                onPublicRecipesPress={() => router.push('/public-recipes')}
                onProductionsPress={() => router.push('/productions')}
              />

              <BakerStockAlertCard
                lowStockCount={lowStockItems.length}
                expiredCount={expiredItems.length}
                expiringSoonCount={expiringSoonItems.length}
                totalItemsCount={stockCount}
                onPress={() => router.push('/stock')}
              />

              <BakerRecentProductionsCard
                productions={productions}
                isLoading={isLoadingProductions}
                onViewAllPress={() => router.push('/productions')}
              />

              <View style={styles.recipesSection}>
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.sectionTitleGroup}>
                    <MaterialCommunityIcons
                      name="book-open-page-variant-outline"
                      size={20}
                      color={theme.colors.primary}
                    />
                    <Text style={styles.sectionTitle}>Suas Criações Recentes</Text>
                  </View>

                  {recipes.length > 0 ? (
                    <TouchableOpacity
                      onPress={() => router.push('/recipes')}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      accessibilityRole="button"
                      accessibilityLabel="Ver todas as receitas cadastradas"
                    >
                      <Text style={styles.viewAllText}>Ver todas</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                {recipes.length > 0 ? (
                  <View style={styles.recipesList}>
                    {recentRecipes.map((recipe) => (
                      <RecipeSmallView
                        key={recipe.id}
                        title={recipe.title}
                        coverUrl={recipe.coverUrl}
                        updatedAt={recipe.updatedAt}
                        prepTimeMinutes={recipe.prepTimeMinutes}
                        onPress={() => {
                          router.push({
                            pathname: '/single-recipe',
                            params: { recipeId: recipe.id },
                          });
                        }}
                      />
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptyRecipesCard}>
                    <MaterialCommunityIcons
                      name="notebook-plus-outline"
                      size={36}
                      color={theme.colors.primary}
                    />
                    <Text style={styles.emptyRecipesTitle}>Seu caderno está vazio</Text>
                    <Text style={styles.emptyRecipesSubtitle}>
                      Comece registrando sua primeira receita autoral para calcular custos e
                      planejar lotes com precisão.
                    </Text>
                    <TouchableOpacity
                      style={styles.createRecipeBtn}
                      onPress={() => router.push('/create-recipe')}
                      activeOpacity={0.85}
                      accessibilityRole="button"
                      accessibilityLabel="Criar primeira receita"
                    >
                      <MaterialCommunityIcons
                        name="plus"
                        size={18}
                        color={theme.colors.onPrimary}
                      />
                      <Text style={styles.createRecipeBtnText}>Criar Primeira Receita</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

export default function HomeScreen() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const isCustomerRole = isCustomer(user?.role);

  if (isCustomerRole) {
    return <CustomerHomeScreen />;
  }

  return <BakerHomeScreen />;
}

const createCustomerStyles = (theme: AppTheme, isDesktop: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    contentWrapper: {
      flex: 1,
      width: '100%',
    },
    header: {
      paddingHorizontal: theme.spacing.space1,
      paddingTop: isDesktop ? theme.spacing.space2 : theme.spacing.space1,
      paddingBottom: theme.spacing.space1,
    },
    title: {
      color: theme.colors.espressoDark,
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: isDesktop ? 32 : 28,
      marginBottom: 4,
    },
    subtitle: {
      color: theme.colors.onSurfaceVariant,
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: isDesktop ? 16 : 15,
      lineHeight: 22,
    },
    welcomeHeroCard: {
      marginTop: theme.spacing.space3,
    },
  });

const createBakerStyles = (
  theme: AppTheme,
  isSmallScreen: boolean,
  isDesktop: boolean,
  isLargeDesktop: boolean,
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      paddingHorizontal: isLargeDesktop
        ? theme.spacing.marginDesktop
        : isDesktop
          ? theme.spacing.marginTablet
          : isSmallScreen
            ? theme.spacing.marginMobile
            : theme.spacing.marginTablet,
      paddingTop: isDesktop ? theme.spacing.space5 : theme.spacing.space3,
      paddingBottom: theme.spacing.space16,
      alignItems: 'center',
    },
    contentWrapper: {
      width: '100%',
      maxWidth: isDesktop ? theme.spacing.containerMax : 720,
      gap: isDesktop ? theme.spacing.space6 : theme.spacing.space5,
    },
    welcomeHeroCard: {
      width: '100%',
    },
    headerBlock: {
      paddingTop: theme.spacing.space1,
      flexDirection: isLargeDesktop ? 'row' : 'column',
      alignItems: isLargeDesktop ? 'center' : 'flex-start',
      justifyContent: 'space-between',
      gap: theme.spacing.space3,
    },
    headerTextCol: {
      gap: 4,
      flex: isLargeDesktop ? 1 : undefined,
    },
    greetingTitle: {
      fontFamily: theme.typography.headlineXl.fontFamily,
      fontSize: isDesktop ? 32 : 28,
      color: theme.colors.espressoDark,
      letterSpacing: 0.3,
    },
    greetingSubtitle: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: isDesktop ? 15 : 14,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 20,
    },
    headerActionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.space3,
      flexWrap: 'wrap',
    },
    headerSecondaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.space2,
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      paddingHorizontal: theme.spacing.space4,
      borderRadius: theme.rounded.full,
      minHeight: 48,
      ...theme.shadows.soft,
    },
    headerSecondaryBtnText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.espressoDark,
    },
    headerPrimaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.space2,
      backgroundColor: theme.colors.primary,
      paddingHorizontal: theme.spacing.space4,
      borderRadius: theme.rounded.full,
      minHeight: 48,
      ...theme.shadows.glow,
    },
    headerPrimaryBtnText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.onPrimary,
      letterSpacing: 0.3,
    },
    columnsContainer: {
      flexDirection: 'row',
      gap: isLargeDesktop ? theme.spacing.gutterDesktop : theme.spacing.space4,
      width: '100%',
      alignItems: 'flex-start',
    },
    leftColumn: {
      flex: isLargeDesktop ? 1.15 : 1,
      minWidth: 0,
      gap: theme.spacing.space5,
    },
    rightColumn: {
      flex: isLargeDesktop ? 0.85 : 1,
      minWidth: 0,
      gap: theme.spacing.space5,
    },
    recipesSection: {
      width: '100%',
      gap: theme.spacing.space3,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.space1,
    },
    sectionTitleGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.space2,
    },
    sectionTitle: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.espressoDark,
      letterSpacing: 0.2,
    },
    viewAllText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    recipesList: {
      width: '100%',
      gap: theme.spacing.space3,
    },
    recipesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.space3,
      width: '100%',
    },
    recipeGridItem: {
      flex: 1,
      minWidth: isLargeDesktop ? 260 : '100%',
    },
    emptyRecipesCard: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.rounded.lg,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: theme.spacing.space5,
      alignItems: 'center',
      textAlign: 'center',
      gap: theme.spacing.space3,
      ...theme.shadows.soft,
    },
    emptyRecipesTitle: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.espressoDark,
    },
    emptyRecipesSubtitle: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      lineHeight: 18,
      maxWidth: 360,
    },
    createRecipeBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.space2,
      backgroundColor: theme.colors.primary,
      paddingHorizontal: theme.spacing.space4,
      paddingVertical: theme.spacing.space2,
      borderRadius: theme.rounded.full,
      minHeight: 48,
      ...theme.shadows.glow,
    },
    createRecipeBtnText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.onPrimary,
    },
    managementTipCard: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.rounded.lg,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: theme.spacing.space4,
      gap: theme.spacing.space2,
      ...theme.shadows.soft,
    },
    tipCardTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.space2,
    },
    tipIconBox: {
      width: 32,
      height: 32,
      borderRadius: theme.rounded.sm,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tipCardTitle: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.espressoDark,
      letterSpacing: 0.2,
    },
    tipCardBody: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 18,
    },
    tipActionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingTop: theme.spacing.space1,
      minHeight: 40,
    },
    tipActionText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.primary,
      letterSpacing: 0.3,
    },
  });
