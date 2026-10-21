import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

import { Input, MaterialSymbol, OfflineBanner, SavedRecipeCard } from '@/src/components';
import { useAuth } from '@/src/contexts/AuthContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { useDebounce } from '@/src/hooks/useDebounce';
import { useSavedRecipes } from '@/src/hooks/useSavedRecipes';
import { AppTheme } from '@/src/theme/themes';
import { UserSavedRecipeItem } from '@/src/types';
import { matchesSearch } from '@/src/utils/text';

export default function SavedRecipesScreen() {
  const { theme } = useThemeMode();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 200);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const isDesktop = width >= 768;
  const containerWidth = Math.min(width - (isDesktop ? 64 : 32), 1040);
  const cardWidth = isDesktop ? Math.floor((containerWidth - 16) / 2) : Math.min(width - 32, 540);
  const { savedRecipes, isLoading, isOffline, refetch, removeSave } = useSavedRecipes(user?.id);

  const styles = useMemo(
    () => createStyles(theme, isDesktop, cardWidth),
    [theme, isDesktop, cardWidth],
  );

  const hasActiveSearch = Boolean(debouncedSearch.trim().length > 0);

  const filteredSaves: UserSavedRecipeItem[] = useMemo(() => {
    if (!debouncedSearch.trim()) return savedRecipes;

    return savedRecipes.filter((item) => {
      const hasTitleMatch = matchesSearch(item.recipe.title, debouncedSearch);
      const hasTagMatch = Boolean(
        item.recipe.tags?.some((t) => matchesSearch(t?.tag?.name, debouncedSearch)),
      );
      return hasTitleMatch || hasTagMatch;
    });
  }, [savedRecipes, debouncedSearch]);

  const handleRemove = useCallback(
    (recipeId: string, recipeTitle: string) => {
      if (isOffline) {
        Alert.alert(
          'Modo Offline',
          'Remover receitas dos favoritos requer conexão com a internet.',
        );
        return;
      }

      Alert.alert(
        'Remover dos Salvos',
        `Deseja remover "${recipeTitle}" da sua lista de receitas salvas?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Remover',
            style: 'destructive',
            onPress: async () => {
              setRemovingId(recipeId);
              try {
                await removeSave(recipeId);
              } finally {
                setRemovingId(null);
              }
            },
          },
        ],
      );
    },
    [removeSave, isOffline],
  );

  const renderSavedItem = useCallback(
    ({ item }: { item: UserSavedRecipeItem }) => (
      <View style={styles.cardWrapper}>
        <SavedRecipeCard
          item={item}
          onPress={() =>
            router.push({
              pathname: '/single-recipe',
              params: { recipeId: item.recipe.id },
            })
          }
          onRemove={() => handleRemove(item.recipe.id, item.recipe.title)}
          isRemoving={removingId === item.recipe.id}
          style={isDesktop ? styles.desktopCard : undefined}
        />
      </View>
    ),
    [handleRemove, isDesktop, removingId, styles.cardWrapper, styles.desktopCard],
  );

  const listEmpty = useMemo(() => {
    if (isLoading) {
      return (
        <View style={styles.feedbackContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }
    if (savedRecipes.length === 0) {
      return (
        <View style={styles.feedbackContainer}>
          <View style={styles.emptyIconWrapper}>
            <MaterialSymbol name="bookmarks" size={48} color={theme.colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Nenhuma receita salva ainda</Text>
          <Text style={styles.emptySubtitle}>
            Toque no ícone de salvar em qualquer receita que encontrar para consultá-la rapidamente
            aqui mais tarde.
          </Text>
          <TouchableOpacity
            style={styles.emptyActionBtn}
            onPress={() => router.push('/public-recipes')}
            accessibilityRole="button"
            accessibilityLabel="Explorar receitas públicas"
          >
            <MaterialSymbol name="find_in_page" size={18} color={theme.colors.onPrimary} />
            <Text style={styles.emptyActionBtnText}>Explorar Receitas</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.feedbackContainer}>
        <View style={styles.emptyIconWrapper}>
          <MaterialSymbol name="search_off" size={48} color={theme.colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>Nenhuma receita encontrada</Text>
        <Text style={styles.emptySubtitle}>
          Não encontramos nenhuma receita salva com o termo &quot;{search}&quot;.
        </Text>
        <TouchableOpacity
          style={styles.clearSearchBtn}
          onPress={() => setSearch('')}
          accessibilityRole="button"
          accessibilityLabel="Limpar filtro de busca"
        >
          <Text style={styles.clearSearchText}>Limpar busca</Text>
        </TouchableOpacity>
      </View>
    );
  }, [
    isLoading,
    savedRecipes.length,
    search,
    styles,
    theme.colors.onPrimary,
    theme.colors.primary,
  ]);

  const itemSeparator = useCallback(() => <View style={styles.separator} />, [styles.separator]);
  const keyExtractor = useCallback((item: UserSavedRecipeItem) => item.recipe.id, []);

  return (
    <>
      <Stack.Screen options={{ title: 'Receitas Salvas' }} />

      <View style={styles.container}>
        <View style={styles.header}>
          <OfflineBanner
            isVisible={isOffline}
            message="Você está no modo offline. Exibindo receitas salvas no seu dispositivo."
            onRetry={refetch}
            style={styles.offlineBanner}
          />

          <Input
            value={search}
            placeholder="Buscar por título ou tag..."
            onChangeText={setSearch}
            containerStyle={styles.searchInput}
            leftIcon={
              <MaterialSymbol name="search" size={22} color={theme.colors.onSurfaceVariant} />
            }
            isClearable={true}
            onClear={() => setSearch('')}
          />

          {!isLoading && savedRecipes.length > 0 && (
            <View style={styles.metaRow}>
              <View style={styles.badge}>
                <MaterialSymbol name="bookmark_check" size={14} color={theme.colors.primary} />
                <Text style={styles.badgeText}>
                  {hasActiveSearch
                    ? `${filteredSaves.length} de ${savedRecipes.length} salvas`
                    : `${savedRecipes.length} ${savedRecipes.length === 1 ? 'receita salva' : 'receitas salvas'}`}
                </Text>
              </View>
            </View>
          )}
        </View>

        <FlatList
          data={isLoading ? [] : filteredSaves}
          keyExtractor={keyExtractor}
          renderItem={renderSavedItem}
          numColumns={isDesktop ? 2 : 1}
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

const createStyles = (theme: AppTheme, isDesktop: boolean, cardWidth?: number) =>
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
      margin: 0,
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
      maxWidth: 1040,
      alignSelf: 'center',
      justifyContent: 'flex-start',
    },
    separator: {
      height: 16,
    },
    cardWrapper: {
      width: cardWidth,
      maxWidth: isDesktop ? cardWidth : 540,
      alignSelf: 'center',
    },
    desktopCard: {
      height: 132,
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
    exploreBtn: {
      width: '100%',
      maxWidth: 280,
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
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
    },
    clearSearchText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.primary,
      textDecorationLine: 'underline',
    },
  });
