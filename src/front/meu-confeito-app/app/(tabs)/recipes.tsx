import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

import { router } from 'expo-router';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { FloatingActionItem, FloatingButton, RecipeFilterChip, RecipeView } from '@/src/components';
import { useAuth } from '@/src/contexts/AuthContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { useUserRecipes } from '@/src/hooks/useRecipes';
import { useSavedRecipes } from '@/src/hooks/useSavedRecipes';
import { AppTheme } from '@/src/theme/themes';
import { PartialRecipe } from '@/src/types';
import { isBaker, isCustomer } from '@/src/utils/roles';

export default function RecipesScreen() {
  const { theme } = useThemeMode();
  const { user } = useAuth();
  const isBakerRole = isBaker(user?.role);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFT' | 'SAVED'>('ALL');

  const statusParam = useMemo(() => {
    if (activeFilter === 'PUBLISHED') return 'PUBLISHED' as const;
    if (activeFilter === 'DRAFT') return 'DRAFT' as const;
    return undefined;
  }, [activeFilter]);

  const {
    recipes: userRecipes,
    isLoading: isLoadingUserRecipes,
    isLoadingMore: isLoadingMoreUserRecipes,
    hasMore: hasMoreUserRecipes,
    loadMore: loadMoreUserRecipes,
    refetch: refetchUserRecipes,
  } = useUserRecipes(user?.id, statusParam);
  const {
    savedRecipes,
    isLoading: isLoadingSavedRecipes,
    refetch: refetchSavedRecipes,
  } = useSavedRecipes(user?.id);

  const { width } = useWindowDimensions();
  const [isSpeedDialOpen, setIsSpeedDialOpen] = useState(false);

  useEffect(() => {
    if (isCustomer(user?.role)) {
      router.replace('/(tabs)/home');
    }
  }, [user]);

  const displayedRecipes: PartialRecipe[] = useMemo(() => {
    if (activeFilter === 'SAVED') {
      return savedRecipes.map((s) => ({
        id: s.recipe.id,
        title: s.recipe.title,
        coverUrl: s.recipe.coverUrl,
        prepTimeMinutes: s.recipe.prepTimeMinutes,
        tags: s.recipe.tags ?? [],
        parent: null,
        createdAt: s.savedAt,
        updatedAt: s.savedAt,
        profitMargin: s.recipe.profitMargin,
        overhead: s.recipe.overhead,
        hourlyLabor: s.recipe.hourlyLabor,
        packagingCost: s.recipe.packagingCost,
      }));
    }
    return userRecipes.filter((r) => r.status !== 'ARCHIVED');
  }, [activeFilter, savedRecipes, userRecipes]);

  const isLoading = isLoadingUserRecipes || (activeFilter === 'SAVED' && isLoadingSavedRecipes);
  const hasMore = activeFilter !== 'SAVED' && hasMoreUserRecipes;
  const isLoadingMore = activeFilter !== 'SAVED' && isLoadingMoreUserRecipes;

  const handleEndReached = useCallback(() => {
    if (activeFilter !== 'SAVED' && hasMoreUserRecipes && !isLoading && !isLoadingMoreUserRecipes) {
      loadMoreUserRecipes();
    }
  }, [activeFilter, hasMoreUserRecipes, isLoading, isLoadingMoreUserRecipes, loadMoreUserRecipes]);

  const handleRefresh = useCallback(async () => {
    if (activeFilter === 'SAVED') {
      await refetchSavedRecipes();
    } else {
      await Promise.all([refetchUserRecipes(), refetchSavedRecipes()]);
    }
  }, [activeFilter, refetchSavedRecipes, refetchUserRecipes]);

  const isWebSidebarPresent = Platform.OS === 'web' && width >= theme.breakpoints.lg;
  const effectiveWidth = isWebSidebarPresent ? width - 260 : width;

  const isMobile = effectiveWidth < 768;
  const isTablet = effectiveWidth >= 768 && effectiveWidth < 1024;
  const hasHeaderActions = effectiveWidth >= 768;

  const numCols = isMobile ? 1 : isTablet ? 2 : 3;
  const containerWidth = Math.min(effectiveWidth - (isMobile ? 32 : 48), 1200);
  const cardWidth =
    numCols === 1
      ? Math.min(effectiveWidth - 32, 480)
      : Math.floor((containerWidth - (numCols - 1) * 16) / numCols);

  const speedDialActions: FloatingActionItem[] = useMemo(
    () => [
      {
        id: 'create-recipe',
        label: 'Criar Nova Receita',
        icon: 'notebook-plus-outline',
        variant: 'primary',
        onPress: () => router.push('/create-recipe'),
        accessibilityLabel: 'Criar nova receita',
      },
      {
        id: 'saved-recipes',
        label: 'Receitas Salvas',
        icon: 'bookmark-multiple-outline',
        variant: 'secondary',
        onPress: () => router.push('/saved-recipes'),
        accessibilityLabel: 'Ver receitas salvas',
      },
      {
        id: 'public-recipes',
        label: 'Buscar Receitas Públicas',
        icon: 'book-search-outline',
        variant: 'secondary',
        onPress: () => router.push('/public-recipes'),
        accessibilityLabel: 'Buscar receitas públicas',
      },
    ],
    [],
  );

  const isWeb = Platform.OS === 'web';

  const styles = useMemo(
    () => createStyles(theme, isMobile, isTablet, numCols, containerWidth, cardWidth, isWeb),
    [theme, isMobile, isTablet, numCols, containerWidth, cardWidth, isWeb],
  );

  const renderRecipeItem = useCallback(
    ({ item }: { item: PartialRecipe }) => (
      <View style={styles.cardWrapper}>
        <RecipeView
          title={item.title}
          coverUrl={item.coverUrl}
          updatedAt={item.updatedAt}
          tags={item.tags}
          prepTimeMinutes={item.prepTimeMinutes}
          rating={item.averageRating}
          totalReviews={item.totalReviews}
          status={activeFilter !== 'SAVED' ? item.status : undefined}
          isCustomized={Boolean(item.parent)}
          hasParent={Boolean(item.parent)}
          style={numCols > 1 ? styles.desktopCard : undefined}
          onPress={() => {
            router.push({ pathname: '/single-recipe', params: { recipeId: item.id } });
          }}
        />
      </View>
    ),
    [activeFilter, numCols, styles.cardWrapper, styles.desktopCard],
  );

  const listHeader = useMemo(() => {
    return (
      <View style={styles.headerWrapper}>
        {hasHeaderActions && (
          <View style={styles.desktopHeader}>
            <View style={styles.desktopHeaderTitleCol}>
              <Text style={styles.desktopHeaderTitle}>Suas Receitas</Text>
              <Text style={styles.desktopHeaderSubtitle}>
                {displayedRecipes.length}
                {hasMore ? '+' : ''}{' '}
                {displayedRecipes.length === 1 ? 'receita listada' : 'receitas listadas'}
              </Text>
            </View>
            <View style={styles.desktopHeaderActions}>
              <TouchableOpacity
                style={styles.desktopHeaderSecondaryBtn}
                onPress={() => router.push('/public-recipes')}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Buscar receitas públicas"
              >
                <MaterialCommunityIcons
                  name="book-search-outline"
                  size={18}
                  color={theme.colors.onSurface}
                />
                <Text style={styles.desktopHeaderSecondaryBtnText}>Públicas</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.desktopHeaderPrimaryBtn}
                onPress={() => router.push('/create-recipe')}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Criar nova receita"
              >
                <MaterialCommunityIcons
                  name="notebook-plus-outline"
                  size={18}
                  color={theme.colors.onPrimary}
                />
                <Text style={styles.desktopHeaderPrimaryBtnText}>Nova Receita</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.filterChipsRow}>
          <RecipeFilterChip
            label="Todas"
            icon="book-open-outline"
            isSelected={activeFilter === 'ALL'}
            onPress={() => setActiveFilter('ALL')}
          />
          <RecipeFilterChip
            label="Publicadas"
            icon="earth"
            isSelected={activeFilter === 'PUBLISHED'}
            onPress={() => setActiveFilter('PUBLISHED')}
          />
          <RecipeFilterChip
            label="Rascunhos"
            icon="file-document-edit-outline"
            isSelected={activeFilter === 'DRAFT'}
            onPress={() => setActiveFilter('DRAFT')}
          />
          <RecipeFilterChip
            label="Salvas"
            icon="bookmark-multiple-outline"
            isSelected={activeFilter === 'SAVED'}
            onPress={() => setActiveFilter('SAVED')}
          />
        </View>
      </View>
    );
  }, [
    activeFilter,
    displayedRecipes.length,
    hasHeaderActions,
    hasMore,
    styles,
    theme.colors.onPrimary,
    theme.colors.onSurface,
  ]);

  const listFooter = useMemo(() => {
    if (isLoading || displayedRecipes.length === 0) return null;
    return (
      <View style={styles.footerWrapper}>
        {isLoadingMore ? (
          <View style={styles.footerLoadingWrapper}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={styles.footerLoadingText}>Carregando mais receitas...</Text>
          </View>
        ) : hasMore ? (
          <View style={styles.loadMoreWrapper}>
            <TouchableOpacity
              style={styles.loadMoreBtn}
              onPress={loadMoreUserRecipes}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Carregar mais receitas"
            >
              <MaterialCommunityIcons
                name="chevron-down-circle-outline"
                size={18}
                color={theme.colors.primary}
              />
              <Text style={styles.loadMoreBtnText}>Carregar mais receitas</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.bottomSuggestionCard}>
          <View style={styles.suggestionHeader}>
            <View style={styles.suggestionIconWrapper}>
              <MaterialCommunityIcons
                name="cake-variant-outline"
                size={26}
                color={theme.colors.primary}
              />
            </View>
            <View style={styles.suggestionHeaderText}>
              <Text style={styles.suggestionTitle}>Quer expandir seu cardápio?</Text>
              <Text style={styles.suggestionSubtitle}>
                Cadastre uma nova criação autoral ou descubra receitas compartilhadas pela
                comunidade.
              </Text>
            </View>
          </View>
          <View style={styles.suggestionButtonsRow}>
            <TouchableOpacity
              style={styles.suggestionPrimaryBtn}
              onPress={() => router.push('/create-recipe')}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons
                name="notebook-plus-outline"
                size={18}
                color={theme.colors.onPrimary}
              />
              <Text style={styles.suggestionPrimaryBtnText}>Criar Nova Receita</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.suggestionSecondaryBtn}
              onPress={() => router.push('/public-recipes')}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons
                name="book-search-outline"
                size={18}
                color={theme.colors.onSurface}
              />
              <Text style={styles.suggestionSecondaryBtnText}>Explorar Públicas</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }, [
    displayedRecipes.length,
    hasMore,
    isLoading,
    isLoadingMore,
    loadMoreUserRecipes,
    styles,
    theme.colors.onPrimary,
    theme.colors.onSurface,
    theme.colors.primary,
  ]);

  const listEmpty = useMemo(() => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    let emptyTitle = 'Seu caderno está esperando!';
    let emptySubtitle =
      'Você ainda não possui receitas cadastradas. Que tal registrar sua primeira receita ou buscar inspiração nas receitas públicas?';

    if (activeFilter === 'PUBLISHED') {
      emptyTitle = 'Nenhuma receita publicada';
      emptySubtitle =
        'Você ainda não possui receitas publicadas para a comunidade. Ao publicar, sua receita ficará disponível para outros artesãos.';
    } else if (activeFilter === 'DRAFT') {
      emptyTitle = 'Nenhum rascunho';
      emptySubtitle =
        'Você não possui receitas em rascunho. Receitas salvas em modo rascunho ficam visíveis apenas para você.';
    } else if (activeFilter === 'SAVED') {
      emptyTitle = 'Nenhuma receita salva';
      emptySubtitle =
        'Você ainda não salvou receitas da comunidade. Navegue pelas receitas públicas e salve suas favoritas para acessá-las aqui.';
    }

    return (
      <View style={styles.emptyWrapper}>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <MaterialCommunityIcons
              name={activeFilter === 'SAVED' ? 'bookmark-multiple-outline' : 'cake-variant-outline'}
              size={44}
              color={theme.colors.primary}
            />
          </View>
          <Text style={styles.emptyTitle}>{emptyTitle}</Text>
          <Text style={styles.emptySubtitle}>{emptySubtitle}</Text>
          <View style={styles.emptyActionsRow}>
            {activeFilter !== 'SAVED' ? (
              <TouchableOpacity
                style={styles.emptyPrimaryBtn}
                onPress={() => router.push('/create-recipe')}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons
                  name="notebook-plus-outline"
                  size={18}
                  color={theme.colors.onPrimary}
                />
                <Text style={styles.emptyPrimaryBtnText}>Criar Primeira Receita</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={activeFilter === 'SAVED' ? styles.emptyPrimaryBtn : styles.emptySecondaryBtn}
              onPress={() => router.push('/public-recipes')}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons
                name="book-search-outline"
                size={18}
                color={activeFilter === 'SAVED' ? theme.colors.onPrimary : theme.colors.onSurface}
              />
              <Text
                style={
                  activeFilter === 'SAVED'
                    ? styles.emptyPrimaryBtnText
                    : styles.emptySecondaryBtnText
                }
              >
                Ver Receitas Públicas
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }, [
    activeFilter,
    isLoading,
    styles,
    theme.colors.onPrimary,
    theme.colors.onSurface,
    theme.colors.primary,
  ]);

  const itemSeparator = useCallback(() => <View style={styles.separator} />, [styles.separator]);
  const keyExtractor = useCallback((item: PartialRecipe) => item.id, []);

  if (!user || !isBakerRole) {
    return null;
  }

  return (
    <View style={styles.container}>
      {isSpeedDialOpen && (
        <Pressable
          style={styles.backdrop}
          onPress={() => setIsSpeedDialOpen(false)}
          accessibilityRole="button"
          accessibilityLabel="Fechar menu de opções"
        />
      )}

      <FlatList
        data={isLoading ? [] : displayedRecipes}
        keyExtractor={keyExtractor}
        renderItem={renderRecipeItem}
        numColumns={numCols}
        key={`recipes-grid-${numCols}`}
        columnWrapperStyle={numCols > 1 ? styles.columnWrapper : undefined}
        ItemSeparatorComponent={itemSeparator}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        ListEmptyComponent={listEmpty}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        initialNumToRender={6}
        maxToRenderPerBatch={8}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      />

      {isMobile && (
        <FloatingButton
          variant="primary"
          containerStyle={styles.button}
          actions={speedDialActions}
          isOpen={isSpeedDialOpen}
          onToggleOpen={setIsSpeedDialOpen}
          accessibilityLabel="Opções de receita"
        />
      )}
    </View>
  );
}

const createStyles = (
  theme: AppTheme,
  isMobile: boolean,
  isTablet: boolean,
  numCols: number,
  containerWidth: number,
  cardWidth: number,
  isWeb: boolean,
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    backdrop: {
      ...StyleSheet.absoluteFill,
      backgroundColor: theme.colors.backdrop,
      zIndex: 40,
    },
    scrollView: {
      flex: 1,
      width: '100%',
    },
    scrollContainer: {
      paddingHorizontal: isMobile ? 16 : 24,
      paddingTop: isMobile ? 16 : 24,
      paddingBottom: 100,
      alignItems: 'center',
    },
    contentWrapper: {
      width: '100%',
      maxWidth: containerWidth,
      alignItems: 'center',
      gap: 24,
    },
    desktopHeader: {
      width: '100%',
      flexDirection: isTablet ? 'column' : 'row',
      alignItems: isTablet ? 'flex-start' : 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 16,
      paddingVertical: 4,
      paddingHorizontal: 4,
    },
    desktopHeaderTitleCol: {
      gap: 6,
      minWidth: 200,
    },
    desktopHeaderTitle: {
      fontFamily: theme.typography.headlineLg.fontFamily,
      fontSize: 28,
      fontWeight: '700',
      color: theme.colors.espressoDark,
    },
    desktopHeaderSubtitle: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
    desktopHeaderActions: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 12,
    },
    desktopHeaderSecondaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      minHeight: 48,
      paddingHorizontal: 16,
      borderRadius: theme.rounded.default,
      gap: 8,
    },
    desktopHeaderSecondaryBtnText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    desktopHeaderPrimaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      minHeight: 48,
      paddingHorizontal: 20,
      borderRadius: theme.rounded.default,
      gap: 8,
      ...theme.shadows.glow,
    },
    desktopHeaderPrimaryBtnText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.onPrimary,
    },
    gridContainer: {
      flexDirection: numCols > 1 ? 'row' : 'column',
      flexWrap: numCols > 1 ? 'wrap' : 'nowrap',
      gap: 16,
      justifyContent: numCols > 1 ? 'flex-start' : 'center',
      alignItems: 'center',
      width: '100%',
    },
    headerWrapper: {
      width: '100%',
      maxWidth: containerWidth,
      alignSelf: 'center',
      marginBottom: 20,
      gap: 16,
    },
    filterChipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: isWeb ? 'center' : 'flex-start',
      gap: 8,
      width: '100%',
      paddingHorizontal: 4,
      paddingVertical: 4,
    },
    footerWrapper: {
      width: isMobile ? cardWidth : '100%',
      maxWidth: isMobile ? cardWidth : containerWidth,
      alignSelf: 'center',
      marginTop: 24,
    },
    footerLoadingWrapper: {
      paddingVertical: 20,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 10,
      width: '100%',
    },
    footerLoadingText: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
    loadMoreWrapper: {
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
    },
    loadMoreBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: theme.rounded.default,
      minHeight: 48,
      ...theme.shadows.soft,
    },
    loadMoreBtnText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    emptyWrapper: {
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    columnWrapper: {
      gap: 16,
      width: '100%',
      maxWidth: containerWidth,
      alignSelf: 'center',
      justifyContent: 'flex-start',
    },
    separator: {
      height: 16,
    },
    cardWrapper: {
      width: cardWidth,
      maxWidth: '100%',
      minHeight: numCols > 1 ? 360 : undefined,
      alignSelf: 'center',
    },
    desktopCard: {
      minHeight: 360,
      height: '100%',
    },
    loadingContainer: {
      paddingTop: 80,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyContainer: {
      paddingTop: 48,
      paddingHorizontal: 20,
      alignItems: 'center',
      justifyContent: 'center',
      maxWidth: 480,
      width: '100%',
    },
    emptyIconCircle: {
      width: 76,
      height: 76,
      borderRadius: 38,
      backgroundColor: theme.colors.secondaryContainer,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      marginBottom: 16,
    },
    emptyTitle: {
      color: theme.colors.espressoDark,
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 22,
      fontWeight: '600',
      textAlign: 'center',
      marginBottom: 8,
    },
    emptySubtitle: {
      color: theme.colors.onSurfaceVariant,
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
      marginBottom: 24,
    },
    emptyActionsRow: {
      width: '100%',
      gap: 12,
    },
    emptyPrimaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      minHeight: 48,
      borderRadius: theme.rounded.default,
      paddingHorizontal: 20,
      gap: 8,
      ...theme.shadows.glow,
    },
    emptyPrimaryBtnText: {
      color: theme.colors.onPrimary,
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 15,
      fontWeight: '600',
    },
    emptySecondaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      minHeight: 48,
      borderRadius: theme.rounded.default,
      paddingHorizontal: 20,
      gap: 8,
    },
    emptySecondaryBtnText: {
      color: theme.colors.onSurface,
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 15,
      fontWeight: '600',
    },
    bottomSuggestionCard: {
      width: '100%',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.rounded.lg,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: 20,
      marginTop: 8,
      gap: isMobile ? 18 : 16,
      ...theme.shadows.soft,
    },
    suggestionHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: isMobile ? 14 : 12,
    },
    suggestionIconWrapper: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.secondaryContainer,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      marginTop: isMobile ? 2 : 0,
    },
    suggestionHeaderText: {
      flex: 1,
      minWidth: 0,
    },
    suggestionTitle: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: !isMobile ? 18 : 17,
      fontWeight: '600',
      color: theme.colors.espressoDark,
      lineHeight: isMobile ? 23 : 24,
      marginBottom: 4,
    },
    suggestionSubtitle: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      lineHeight: isMobile ? 19 : 18,
      color: theme.colors.onSurfaceVariant,
    },
    suggestionButtonsRow: {
      flexDirection: !isMobile ? 'row' : 'column',
      gap: isMobile ? 12 : 10,
    },
    suggestionPrimaryBtn: {
      flex: !isMobile ? 1 : undefined,
      width: !isMobile ? undefined : '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      minHeight: 48,
      borderRadius: theme.rounded.default,
      paddingHorizontal: 16,
      gap: 8,
      ...theme.shadows.glow,
    },
    suggestionPrimaryBtnText: {
      color: theme.colors.onPrimary,
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 14,
      fontWeight: '600',
    },
    suggestionSecondaryBtn: {
      flex: !isMobile ? 1 : undefined,
      width: !isMobile ? undefined : '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      minHeight: 48,
      borderRadius: theme.rounded.default,
      paddingHorizontal: 16,
      gap: 8,
    },
    suggestionSecondaryBtnText: {
      color: theme.colors.onSurface,
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 14,
      fontWeight: '600',
    },
    button: {
      position: 'absolute',
      bottom: 24,
      right: 24,
    },
  });
