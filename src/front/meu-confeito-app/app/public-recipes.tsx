import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

import { Stack, router } from 'expo-router';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { Input, RecipeDateFilterModal, RecipeFilterChip, RecipeView } from '@/src/components';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { useDebounce } from '@/src/hooks/useDebounce';
import { useManyRecipes } from '@/src/hooks/useRecipes';
import { AppTheme } from '@/src/theme/themes';
import { PartialRecipe } from '@/src/types';

export default function PublicRecipesScreen() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [activeSort, setActiveSort] = useState<'saves' | 'reviews' | 'rating' | null>(null);
  const [dateLimit, setDateLimit] = useState<number | undefined>(undefined);
  const [isDateModalVisible, setIsDateModalVisible] = useState(false);

  const { theme } = useThemeMode();
  const { recipes, isLoading, isLoadingMore, hasMore, loadMore, refetch } = useManyRecipes({
    search: debouncedSearch,
    sort: activeSort ?? undefined,
    dateLimit,
  });
  const { width } = useWindowDimensions();

  const isDesktop = width >= 768;
  const isWeb = Platform.OS === 'web';
  const numCols = isDesktop ? 3 : 1;
  const containerWidth = Math.min(width - (isDesktop ? 48 : 32), 1200);
  const cardWidth = isDesktop
    ? Math.floor((containerWidth - (numCols - 1) * 16) / numCols)
    : Math.min(width - 32, 480);
  const hasActiveSearch = Boolean(search.trim().length > 0);
  const hasDateFilter = typeof dateLimit === 'number' && dateLimit > 0;
  const hasActiveFilters = Boolean(hasActiveSearch || activeSort !== null || hasDateFilter);

  const dateFilterLabel = useMemo(() => {
    if (dateLimit === 7) return '7 dias';
    if (dateLimit === 30) return '30 dias';
    return 'Sem data';
  }, [dateLimit]);

  const styles = useMemo(
    () => createStyles(theme, isDesktop, cardWidth, isWeb),
    [theme, isDesktop, cardWidth, isWeb],
  );

  const renderRecipeItem = useCallback(
    ({ item }: { item: PartialRecipe }) => (
      <View style={styles.cardWrapper}>
        <RecipeView
          title={item.title}
          coverUrl={item.coverUrl}
          tags={item.tags}
          prepTimeMinutes={item.prepTimeMinutes}
          rating={item.averageRating}
          totalReviews={item.totalReviews}
          maxTagRows={2}
          isCustomized={Boolean(item.parent)}
          hasParent={Boolean(item.parent)}
          style={isDesktop ? styles.desktopCard : undefined}
          onPress={() => {
            router.push({ pathname: '/single-recipe', params: { recipeId: item.id } });
          }}
        />
      </View>
    ),
    [isDesktop, styles.cardWrapper, styles.desktopCard],
  );

  const listEmpty = useMemo(() => {
    if (isLoading) {
      return (
        <View style={styles.feedbackContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }
    return (
      <View style={styles.emptyWrapper}>
        <View style={styles.feedbackContainer}>
          <View style={styles.emptyIconWrapper}>
            <MaterialCommunityIcons
              name="book-search-outline"
              size={44}
              color={theme.colors.primary}
            />
          </View>
          <Text style={styles.emptyTitle}>
            {hasActiveFilters ? 'Nenhuma receita encontrada' : 'Nenhuma receita pública no momento'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {hasActiveFilters
              ? `Não encontramos resultados com os filtros aplicados. Tente buscar por outros termos, alterar a ordenação ou o período selecionado.`
              : 'Explore novamente mais tarde para descobrir novas receitas compartilhadas.'}
          </Text>

          {hasActiveFilters && (
            <TouchableOpacity
              style={styles.clearSearchBtn}
              onPress={() => {
                setSearch('');
                setActiveSort(null);
                setDateLimit(undefined);
              }}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Limpar todos os filtros"
            >
              <MaterialCommunityIcons
                name="close-circle-outline"
                size={18}
                color={theme.colors.primary}
              />
              <Text style={styles.clearSearchBtnText}>Limpar filtros</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }, [
    hasActiveFilters,
    isLoading,
    styles.clearSearchBtn,
    styles.clearSearchBtnText,
    styles.emptyIconWrapper,
    styles.emptySubtitle,
    styles.emptyTitle,
    styles.emptyWrapper,
    styles.feedbackContainer,
    theme.colors.primary,
  ]);

  const handleEndReached = useCallback(() => {
    if (hasMore && !isLoading && !isLoadingMore) {
      loadMore();
    }
  }, [hasMore, isLoading, isLoadingMore, loadMore]);

  const listFooter = useMemo(() => {
    if (isLoading || recipes.length === 0) return null;

    if (isLoadingMore) {
      return (
        <View style={styles.footerLoadingWrapper}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={styles.footerLoadingText}>Carregando mais receitas...</Text>
        </View>
      );
    }

    if (hasMore) {
      return (
        <View style={styles.loadMoreWrapper}>
          <TouchableOpacity
            style={styles.loadMoreBtn}
            onPress={loadMore}
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
      );
    }

    if (recipes.length >= 10) {
      return (
        <View style={styles.footerEndOfList}>
          <Text style={styles.footerEndOfListText}>
            Todas as receitas públicas foram carregadas.
          </Text>
        </View>
      );
    }

    return null;
  }, [hasMore, isLoading, isLoadingMore, loadMore, recipes.length, styles, theme.colors.primary]);

  const itemSeparator = useCallback(() => <View style={styles.separator} />, [styles.separator]);
  const keyExtractor = useCallback((item: PartialRecipe) => item.id, []);

  return (
    <>
      <Stack.Screen options={{ title: 'Receitas Públicas' }} />

      <RecipeDateFilterModal
        isVisible={isDateModalVisible}
        selectedLimit={dateLimit}
        onSelectLimit={setDateLimit}
        onClose={() => setIsDateModalVisible(false)}
      />

      <View style={styles.container}>
        <View style={styles.headerContent}>
          <View style={styles.searchFilterContainer}>
            <Input
              value={search}
              placeholder="Buscar por título ou ingredientes..."
              onChangeText={setSearch}
              containerStyle={styles.searchInput}
              leftIcon={
                <MaterialCommunityIcons
                  name="magnify"
                  size={22}
                  color={theme.colors.onSurfaceVariant}
                />
              }
              isClearable={true}
              onClear={() => setSearch('')}
            />

            <View style={styles.filtersRow}>
              <RecipeFilterChip
                label="Mais Salvas"
                icon="bookmark-multiple-outline"
                isSelected={activeSort === 'saves'}
                onPress={() => setActiveSort((prev) => (prev === 'saves' ? null : 'saves'))}
              />
              <RecipeFilterChip
                label="Mais Avaliadas"
                icon="comment-text-multiple-outline"
                isSelected={activeSort === 'reviews'}
                onPress={() => setActiveSort((prev) => (prev === 'reviews' ? null : 'reviews'))}
              />
              <RecipeFilterChip
                label="Melhores Avaliações"
                icon="star"
                isSelected={activeSort === 'rating'}
                onPress={() => setActiveSort((prev) => (prev === 'rating' ? null : 'rating'))}
              />
              <RecipeFilterChip
                label={dateFilterLabel}
                icon="calendar-clock-outline"
                trailingIcon="chevron-down"
                isSelected={hasDateFilter}
                onPress={() => setIsDateModalVisible(true)}
                accessibilityLabel={`Filtrar por período. Seleção atual: ${dateFilterLabel}`}
              />
            </View>

            {!isLoading && (
              <View style={styles.metaRow}>
                <Text style={styles.resultCountText}>
                  {hasActiveFilters
                    ? `${recipes.length}${hasMore ? '+' : ''} ${recipes.length === 1 ? 'receita encontrada' : 'receitas encontradas'}`
                    : `${recipes.length}${hasMore ? '+' : ''} ${recipes.length === 1 ? 'receita disponível' : 'receitas disponíveis'}`}
                </Text>
              </View>
            )}
          </View>
        </View>

        <FlatList
          data={isLoading ? [] : recipes}
          keyExtractor={keyExtractor}
          renderItem={renderRecipeItem}
          numColumns={isDesktop ? 3 : 1}
          key={isDesktop ? 'desktop-grid' : 'mobile-list'}
          columnWrapperStyle={isDesktop ? styles.columnWrapper : undefined}
          ItemSeparatorComponent={itemSeparator}
          ListEmptyComponent={listEmpty}
          ListFooterComponent={listFooter}
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
              onRefresh={refetch}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
        />
      </View>
    </>
  );
}

const createStyles = (theme: AppTheme, isDesktop: boolean, cardWidth?: number, isWeb?: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    headerContent: {
      width: '100%',
      maxWidth: 1200,
      alignSelf: 'center',
      alignItems: 'center',
      paddingHorizontal: isDesktop ? 24 : 16,
      paddingTop: 12,
      paddingBottom: 4,
    },
    searchFilterContainer: {
      width: '100%',
      maxWidth: isDesktop ? 860 : '100%',
      alignItems: isWeb ? 'center' : 'stretch',
    },
    searchInput: {
      width: '100%',
      height: 52,
      minHeight: 48,
      borderRadius: theme.rounded.default,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surfaceContainerLowest,
      margin: 0,
    },
    filtersRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: isWeb ? 'center' : 'flex-start',
      gap: 8,
      width: '100%',
      marginTop: 10,
      marginBottom: 4,
    },
    metaRow: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: isWeb ? 'center' : 'flex-start',
      alignItems: 'center',
      paddingHorizontal: 4,
      marginTop: 8,
      marginBottom: 4,
    },
    resultCountText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
    scrollView: {
      flex: 1,
      width: '100%',
    },
    scrollContainer: {
      paddingHorizontal: isDesktop ? 24 : 16,
      paddingTop: 8,
      paddingBottom: 60,
      alignItems: 'center',
    },
    columnWrapper: {
      gap: 16,
      width: '100%',
      maxWidth: 1200,
      alignSelf: 'center',
      justifyContent: 'flex-start',
    },
    separator: {
      height: 16,
    },
    cardWrapper: {
      width: cardWidth,
      maxWidth: '100%',
      height: isDesktop ? 410 : undefined,
      alignSelf: 'center',
    },
    desktopCard: {
      height: '100%',
    },
    emptyWrapper: {
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    feedbackContainer: {
      paddingTop: 48,
      paddingHorizontal: 20,
      alignItems: 'center',
      justifyContent: 'center',
      maxWidth: 420,
    },
    emptyIconWrapper: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: theme.colors.surfaceContainerLow,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      marginBottom: 16,
    },
    emptyTitle: {
      color: theme.colors.espressoDark,
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 20,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 8,
    },
    emptySubtitle: {
      color: theme.colors.onSurfaceVariant,
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
      marginBottom: 20,
    },
    clearSearchBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: theme.rounded.default,
      minHeight: 48,
      ...theme.shadows.soft,
    },
    clearSearchBtnText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    footerLoadingWrapper: {
      paddingVertical: 24,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 10,
    },
    footerLoadingText: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
    loadMoreWrapper: {
      paddingVertical: 20,
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
    footerEndOfList: {
      paddingVertical: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    footerEndOfListText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
  });
