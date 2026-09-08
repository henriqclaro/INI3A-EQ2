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
  const styles = useMemo(() => createCustomerStyles(theme), [theme]);

  const firstName = user?.name ? user.name.split(' ')[0] : 'Cliente';

  return (
    <View style={styles.container}>
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
  );
}

function BakerHomeScreen() {
  const { theme } = useThemeMode();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < theme.breakpoints.sm;
  const styles = useMemo(() => createBakerStyles(theme, isSmallScreen), [theme, isSmallScreen]);

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
  const recentRecipes = useMemo(() => recipes.slice(0, 3), [recipes]);

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
          {/* Inner Header with Greetings */}
          <View style={styles.headerBlock}>
            <Text style={styles.greetingTitle}>Olá, {firstName}!</Text>
            <Text style={styles.greetingSubtitle}>
              Painel de controle e produção da sua cozinha digital.
            </Text>
          </View>

          {/* 4 Big Buttons in 2x2 Layout (The very first thing!) */}
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

          {/* Overview Stat Banner */}
          <BakerOverviewBanner
            recipesCount={recipesCount}
            stockCount={stockCount}
            productionsCount={productionCount}
            savedCount={savedCount}
          />

          {/* Stock Health & Alert Card */}
          <BakerStockAlertCard
            lowStockCount={lowStockItems.length}
            expiringSoonCount={expiringItems.length}
            totalItemsCount={stockCount}
            onPress={() => router.push('/stock')}
          />

          {/* Recent Productions Activity */}
          <BakerRecentProductionsCard
            productions={productions}
            isLoading={isLoadingProductions}
            onViewAllPress={() => router.push('/productions')}
          />

          {/* Recent Author Recipes Section */}
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
                  Comece registrando sua primeira receita autoral para calcular custos e planejar
                  lotes com precisão.
                </Text>
                <TouchableOpacity
                  style={styles.createRecipeBtn}
                  onPress={() => router.push('/create-recipe')}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel="Criar primeira receita"
                >
                  <MaterialCommunityIcons name="plus" size={18} color={theme.colors.onPrimary} />
                  <Text style={styles.createRecipeBtnText}>Criar Primeira Receita</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
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

const createCustomerStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      paddingHorizontal: theme.spacing.space1,
      paddingTop: theme.spacing.space2,
      paddingBottom: theme.spacing.space1,
    },
    title: {
      color: theme.colors.espressoDark,
      fontFamily: theme.typography.headlineXl.fontFamily,
      fontSize: 28,
      fontWeight: '600',
      marginBottom: 4,
    },
    subtitle: {
      color: theme.colors.onSurfaceVariant,
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 15,
      lineHeight: 20,
    },
  });

const createBakerStyles = (theme: AppTheme, isSmallScreen: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      paddingHorizontal: isSmallScreen ? theme.spacing.marginMobile : theme.spacing.marginTablet,
      paddingTop: theme.spacing.space3,
      paddingBottom: theme.spacing.space16,
      alignItems: 'center',
    },
    contentWrapper: {
      width: '100%',
      maxWidth: 720,
      gap: theme.spacing.space5,
    },
    headerBlock: {
      paddingTop: theme.spacing.space1,
      gap: 4,
    },
    greetingTitle: {
      fontFamily: theme.typography.headlineXl.fontFamily,
      fontSize: 28,
      fontWeight: '700',
      color: theme.colors.espressoDark,
      letterSpacing: 0.3,
    },
    greetingSubtitle: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 20,
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
  });
