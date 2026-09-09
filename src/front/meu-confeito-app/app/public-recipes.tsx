import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

import { Stack, router } from 'expo-router';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { Input, RecipeView } from '@/src/components';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { useManyRecipes } from '@/src/hooks/useRecipes';
import { AppTheme } from '@/src/theme/themes';

export default function PublicRecipesScreen() {
  const [search, setSearch] = useState('');

  const { theme } = useThemeMode();
  const { recipes, isLoading, refetch } = useManyRecipes(search);
  const { width } = useWindowDimensions();

  const isDesktop = width >= 768;
  const hasActiveSearch = Boolean(search.trim().length > 0);

  const styles = useMemo(() => createStyles(theme, isDesktop), [theme, isDesktop]);

  return (
    <>
      <Stack.Screen options={{ title: 'Receitas Públicas' }} />

      <View style={styles.container}>
        <View style={styles.headerContent}>
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

          {!isLoading && (
            <View style={styles.metaRow}>
              <Text style={styles.resultCountText}>
                {hasActiveSearch
                  ? `${recipes.length} ${recipes.length === 1 ? 'receita encontrada' : 'receitas encontradas'}`
                  : `${recipes.length} ${recipes.length === 1 ? 'receita disponível' : 'receitas disponíveis'}`}
              </Text>

              <TouchableOpacity
                style={styles.savedLinkBtn}
                onPress={() => router.push('/saved-recipes')}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Ver receitas salvas"
              >
                <MaterialCommunityIcons
                  name="bookmark-multiple-outline"
                  size={16}
                  color={theme.colors.primary}
                />
                <Text style={styles.savedLinkText}>Ver Salvas</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
        >
          {isLoading ? (
            <View style={styles.feedbackContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : recipes.length === 0 ? (
            <View style={styles.feedbackContainer}>
              <View style={styles.emptyIconWrapper}>
                <MaterialCommunityIcons
                  name="book-search-outline"
                  size={44}
                  color={theme.colors.primary}
                />
              </View>
              <Text style={styles.emptyTitle}>
                {hasActiveSearch
                  ? 'Nenhuma receita encontrada'
                  : 'Nenhuma receita pública no momento'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {hasActiveSearch
                  ? `Não encontramos resultados para "${search}". Tente buscar por outros termos ou ingredientes.`
                  : 'Explore novamente mais tarde para descobrir novas receitas compartilhadas.'}
              </Text>

              {hasActiveSearch && (
                <TouchableOpacity
                  style={styles.clearSearchBtn}
                  onPress={() => setSearch('')}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons
                    name="close-circle-outline"
                    size={18}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.clearSearchBtnText}>Limpar busca</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.gridContainer}>
              {recipes.map((recipe) => (
                <View key={recipe.id} style={styles.cardWrapper}>
                  <RecipeView
                    title={recipe.title}
                    coverUrl={recipe.coverUrl}
                    tags={recipe.tags}
                    prepTimeMinutes={recipe.prepTimeMinutes}
                    onPress={() => {
                      router.push({ pathname: '/single-recipe', params: { recipeId: recipe.id } });
                    }}
                  />
                </View>
              ))}
            </View>
          )}
        </ScrollView>
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
    headerContent: {
      width: '100%',
      maxWidth: 1200,
      alignSelf: 'center',
      alignItems: 'center',
      paddingHorizontal: isDesktop ? 24 : 16,
      paddingTop: 12,
      paddingBottom: 4,
    },
    searchInput: {
      width: '100%',
      maxWidth: 600,
      height: 52,
      minHeight: 48,
      borderRadius: theme.rounded.default,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surfaceContainerLowest,
      margin: 0,
    },
    metaRow: {
      width: '100%',
      maxWidth: 600,
      flexDirection: 'row',
      justifyContent: 'space-between',
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
    savedLinkBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: theme.rounded.sm,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surfaceContainerLowest,
      minHeight: 48,
    },
    savedLinkText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.primary,
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
    gridContainer: {
      flexDirection: isDesktop ? 'row' : 'column',
      flexWrap: isDesktop ? 'wrap' : 'nowrap',
      gap: 16,
      justifyContent: isDesktop ? 'flex-start' : 'center',
      alignItems: 'center',
      width: '100%',
      maxWidth: 1200,
    },
    cardWrapper: {
      width: isDesktop ? undefined : '100%',
      flex: isDesktop ? 1 : undefined,
      minWidth: isDesktop ? 260 : undefined,
      maxWidth: isDesktop ? 360 : 480,
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
  });
