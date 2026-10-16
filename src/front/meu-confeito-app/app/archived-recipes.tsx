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

import { Input, OfflineBanner, RecipeView } from '@/src/components';
import { useAuth } from '@/src/contexts/AuthContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { useUserRecipes } from '@/src/hooks/useRecipes';
import { AppTheme } from '@/src/theme/themes';
import { PartialRecipe } from '@/src/types';

export default function ArchivedRecipesScreen() {
  const { theme } = useThemeMode();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const [search, setSearch] = useState('');

  const isDesktop = width >= 768;
  const numCols = isDesktop ? 2 : 1;
  const { recipes, isLoading, isOffline, refetch } = useUserRecipes(user?.id, 'ARCHIVED');

  const styles = useMemo(() => createStyles(theme, isDesktop), [theme, isDesktop]);

  const hasActiveSearch = Boolean(search.trim().length > 0);

  const archivedRecipes: PartialRecipe[] = useMemo(() => {
    // Ensure all displayed items have ARCHIVED status
    const list = recipes.filter((r) => r.status === 'ARCHIVED');
    const trimmed = search.trim().toLowerCase();
    if (!trimmed) return list;

    return list.filter((item) => {
      const hasTitleMatch = item.title.toLowerCase().includes(trimmed);
      const hasTagMatch = Boolean(
        item.tags?.some((t) => t?.tag?.name?.toLowerCase().includes(trimmed)),
      );
      return hasTitleMatch || hasTagMatch;
    });
  }, [recipes, search]);

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
          status="ARCHIVED"
          isCustomized={Boolean(item.parent)}
          hasParent={Boolean(item.parent)}
          style={isDesktop ? styles.desktopCard : undefined}
          onPress={() =>
            router.push({
              pathname: '/single-recipe',
              params: { recipeId: item.id },
            })
          }
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

    if (recipes.length === 0) {
      return (
        <View style={styles.feedbackContainer}>
          <View style={styles.emptyIconWrapper}>
            <MaterialCommunityIcons name="archive-outline" size={48} color={theme.colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Nenhuma receita arquivada</Text>
          <Text style={styles.emptySubtitle}>
            Receitas que você arquivar serão guardadas aqui e ficarão ocultas da sua lista principal
            e das buscas públicas.
          </Text>
          <TouchableOpacity
            style={styles.emptyActionBtn}
            onPress={() => router.push('/(tabs)/recipes')}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Voltar para Suas Receitas"
          >
            <MaterialCommunityIcons
              name="book-open-outline"
              size={18}
              color={theme.colors.onPrimary}
            />
            <Text style={styles.emptyActionBtnText}>Ver Suas Receitas</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.feedbackContainer}>
        <View style={styles.emptyIconWrapper}>
          <MaterialCommunityIcons
            name="magnify-remove-outline"
            size={48}
            color={theme.colors.primary}
          />
        </View>
        <Text style={styles.emptyTitle}>Nenhuma receita encontrada</Text>
        <Text style={styles.emptySubtitle}>
          Não encontramos nenhuma receita arquivada com o termo &quot;{search}&quot;.
        </Text>
        <TouchableOpacity
          style={styles.clearSearchBtn}
          onPress={() => setSearch('')}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Limpar busca"
        >
          <MaterialCommunityIcons
            name="close-circle-outline"
            size={18}
            color={theme.colors.primary}
          />
          <Text style={styles.clearSearchText}>Limpar busca</Text>
        </TouchableOpacity>
      </View>
    );
  }, [isLoading, recipes.length, search, styles, theme.colors.onPrimary, theme.colors.primary]);

  const itemSeparator = useCallback(() => <View style={styles.separator} />, [styles.separator]);
  const keyExtractor = useCallback((item: PartialRecipe) => item.id, []);

  return (
    <>
      <Stack.Screen options={{ title: 'Receitas Arquivadas' }} />

      <View style={styles.container}>
        <View style={styles.header}>
          <OfflineBanner
            isVisible={isOffline}
            message="Você está offline. Exibindo receitas arquivadas salvas no dispositivo."
            onRetry={refetch}
            style={styles.offlineBanner}
          />

          <Input
            value={search}
            placeholder="Buscar por título ou tag..."
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

          {!isLoading && archivedRecipes.length > 0 && (
            <View style={styles.metaRow}>
              <View style={styles.badge}>
                <MaterialCommunityIcons
                  name="archive-check-outline"
                  size={14}
                  color={theme.colors.primary}
                />
                <Text style={styles.badgeText}>
                  {hasActiveSearch
                    ? `${archivedRecipes.length} de ${recipes.length} arquivadas`
                    : `${archivedRecipes.length} ${
                        archivedRecipes.length === 1 ? 'receita arquivada' : 'receitas arquivadas'
                      }`}
                </Text>
              </View>
            </View>
          )}
        </View>

        <FlatList
          data={isLoading ? [] : archivedRecipes}
          keyExtractor={keyExtractor}
          renderItem={renderRecipeItem}
          numColumns={numCols}
          key={isDesktop ? 'desktop-grid' : 'mobile-list'}
          columnWrapperStyle={isDesktop ? styles.columnWrapper : undefined}
          ItemSeparatorComponent={itemSeparator}
          ListEmptyComponent={listEmpty}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
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

const createStyles = (theme: AppTheme, isDesktop: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      paddingHorizontal: isDesktop ? 32 : 16,
      paddingTop: 16,
      paddingBottom: 8,
      maxWidth: isDesktop ? 1040 : 960,
      width: '100%',
      alignSelf: 'center',
    },
    offlineBanner: {
      marginBottom: 12,
    },
    searchInput: {
      width: '100%',
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 10,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: theme.rounded.full,
    },
    badgeText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.espressoDark,
    },
    scrollView: {
      flex: 1,
      width: '100%',
    },
    scrollContent: {
      paddingHorizontal: isDesktop ? 32 : 16,
      paddingBottom: 40,
      paddingTop: 8,
      maxWidth: isDesktop ? 1040 : 960,
      width: '100%',
      alignSelf: 'center',
      flexGrow: 1,
    },
    columnWrapper: {
      gap: 16,
      width: '100%',
    },
    separator: {
      height: 16,
    },
    cardWrapper: {
      width: isDesktop ? undefined : '100%',
      flex: isDesktop ? 1 : undefined,
      minWidth: isDesktop ? 320 : '100%',
      maxWidth: isDesktop ? 510 : '100%',
    },
    desktopCard: {
      height: '100%',
    },
    feedbackContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
      paddingHorizontal: 24,
    },
    emptyIconWrapper: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    emptyTitle: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.espressoDark,
      textAlign: 'center',
      marginBottom: 8,
    },
    emptySubtitle: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 24,
      maxWidth: 380,
    },
    emptyActionBtn: {
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
    emptyActionBtnText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.onPrimary,
    },
    clearSearchBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      minHeight: 48,
      paddingHorizontal: 16,
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.default,
      ...theme.shadows.soft,
    },
    clearSearchText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.primary,
    },
  });
