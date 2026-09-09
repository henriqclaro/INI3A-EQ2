import { useCallback, useMemo, useState } from 'react';
import {
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
  RecipeSmallView,
} from '@/src/components';
import { useAuth } from '@/src/contexts/AuthContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { useInventory } from '@/src/hooks/useInventory';
import { useProductions } from '@/src/hooks/useProductions';
import { useUserRecipes } from '@/src/hooks/useRecipes';
import { useSavedRecipes } from '@/src/hooks/useSavedRecipes';
import { AppTheme } from '@/src/theme/themes';
import { isExpired, isExpiringSoon } from '@/src/utils/formatters';

function CustomerHomeScreen() {
  const { theme } = useThemeMode();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= theme.breakpoints.md;
  const isLargeDesktop = width >= theme.breakpoints.lg;
  const styles = useMemo(
    () => createCustomerStyles(theme, isDesktop, isLargeDesktop),
    [theme, isDesktop, isLargeDesktop],
  );

  const firstName = user?.name ? user.name.split(' ')[0] : 'Cliente';

  return (
    <View style={styles.container}>
      <View style={styles.contentWrapper}>
        <NearbyBakersExplorer
          hasIntroHeader={false}
          headerContent={
            <View style={styles.header}>
              <Text style={styles.title}>Olá, {firstName}!</Text>
              <Text style={styles.subtitle}>
                Descubra confeitarias e doces artesanais perto de você.
              </Text>
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
  const isSmallScreen = width < theme.breakpoints.sm;
  const isDesktop = width >= theme.breakpoints.md;
  const isLargeDesktop = width >= theme.breakpoints.lg;

  const styles = useMemo(
    () => createBakerStyles(theme, isSmallScreen, isDesktop, isLargeDesktop),
    [theme, isSmallScreen, isDesktop, isLargeDesktop],
  );

  const { recipes, refetch: refetchRecipes } = useUserRecipes(user?.id);
  const { inventory, refetch: refetchInventory } = useInventory();
  const {
    productions,
    isLoading: isLoadingProductions,
    refetch: refetchProductions,
  } = useProductions();
  const { savedRecipes, refetch: refetchSavedRecipes } = useSavedRecipes(user?.id);

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

  const expiringItems = useMemo(
    () =>
      inventory.filter(
        (item) => isExpiringSoon(item.expirationDate) || isExpired(item.expirationDate),
      ),
    [inventory],
  );

  const hasStockAlert = lowStockItems.length > 0 || expiringItems.length > 0;
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
                <View style={styles.statusPill}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusPillText}>Ateliê em Atividade</Text>
                </View>

                <TouchableOpacity
                  style={styles.headerSecondaryBtn}
                  onPress={() => router.push('/register-stock')}
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

          {/* Overview Stat Banner */}
          <BakerOverviewBanner
            recipesCount={recipesCount}
            stockCount={stockCount}
            productionsCount={productionCount}
            savedCount={savedCount}
          />

          {isLargeDesktop ? (
            /* Multi-column Split View for Large Desktop Screens */
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
                  expiringSoonCount={expiringItems.length}
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
                        name="chef-hat"
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
                expiringSoonCount={expiringItems.length}
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
  const isCustomerRole = user?.role?.trim().toUpperCase() === 'CUSTOMER';

  if (isCustomerRole) {
    return <CustomerHomeScreen />;
  }

  return <BakerHomeScreen />;
}

const createCustomerStyles = (theme: AppTheme, isDesktop: boolean, isLargeDesktop: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    contentWrapper: {
      flex: 1,
      width: '100%',
      maxWidth: isDesktop ? theme.spacing.containerMax : undefined,
      alignSelf: 'center',
      paddingHorizontal: isLargeDesktop
        ? theme.spacing.marginDesktop
        : isDesktop
          ? theme.spacing.marginTablet
          : 0,
    },
    header: {
      paddingHorizontal: theme.spacing.space1,
      paddingTop: isDesktop ? theme.spacing.space4 : theme.spacing.space2,
      paddingBottom: theme.spacing.space1,
    },
    title: {
      color: theme.colors.espressoDark,
      fontFamily: theme.typography.headlineXl.fontFamily,
      fontSize: isDesktop ? 32 : 28,
      fontWeight: '600',
      marginBottom: 4,
    },
    subtitle: {
      color: theme.colors.onSurfaceVariant,
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: isDesktop ? 16 : 15,
      lineHeight: 22,
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
    headerBlock: {
      paddingTop: theme.spacing.space1,
      flexDirection: isDesktop ? 'row' : 'column',
      alignItems: isDesktop ? 'center' : 'flex-start',
      justifyContent: 'space-between',
      gap: theme.spacing.space3,
    },
    headerTextCol: {
      gap: 4,
      flex: isDesktop ? 1 : undefined,
    },
    greetingTitle: {
      fontFamily: theme.typography.headlineXl.fontFamily,
      fontSize: isDesktop ? 32 : 28,
      fontWeight: '700',
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
    statusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      paddingHorizontal: theme.spacing.space3,
      paddingVertical: 6,
      borderRadius: theme.rounded.full,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: theme.rounded.full,
      backgroundColor: theme.colors.tertiary,
    },
    statusPillText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.espressoDark,
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
      gap: theme.spacing.gutterDesktop,
      width: '100%',
      alignItems: 'flex-start',
    },
    leftColumn: {
      flex: 1.15,
      gap: theme.spacing.space5,
    },
    rightColumn: {
      flex: 0.85,
      minWidth: 320,
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
      minWidth: 260,
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
