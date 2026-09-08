import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

import { CustomButton, Input, SavedRecipeCard } from '@/src/components';
import { useAuth } from '@/src/contexts/AuthContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { useSavedRecipes } from '@/src/hooks/useSavedRecipes';
import { AppTheme } from '@/src/theme/themes';
import { UserSavedRecipeItem } from '@/src/types';

export default function SavedRecipesScreen() {
  const { theme } = useThemeMode();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const [search, setSearch] = useState('');
  const [removingId, setRemovingId] = useState<string | null>(null);

  const isDesktop = width >= 768;
  const { savedRecipes, isLoading, refetch, removeSave } = useSavedRecipes(user?.id);

  const styles = useMemo(() => createStyles(theme, isDesktop), [theme, isDesktop]);

  const hasActiveSearch = Boolean(search.trim().length > 0);

  const filteredSaves: UserSavedRecipeItem[] = useMemo(() => {
    const trimmed = search.trim().toLowerCase();
    if (!trimmed) return savedRecipes;

    return savedRecipes.filter((item) => {
      const hasTitleMatch = item.recipe.title.toLowerCase().includes(trimmed);
      const hasTagMatch = Boolean(
        item.recipe.tags?.some((t) => t?.tag?.name?.toLowerCase().includes(trimmed)),
      );
      return hasTitleMatch || hasTagMatch;
    });
  }, [savedRecipes, search]);

  const handleRemove = (recipeId: string, recipeTitle: string) => {
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
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Receitas Salvas' }} />

      <View style={styles.container}>
        <View style={styles.header}>
          <Input
            value={search}
            placeholder="Buscar por título ou tag..."
            onChangeText={setSearch}
            containerStyle={styles.searchInput}
            leftIcon={
              <MaterialCommunityIcons name="magnify" size={22} color={theme.colors.placeholder} />
            }
            isClearable={true}
            onClear={() => setSearch('')}
          />

          {!isLoading && savedRecipes.length > 0 && (
            <View style={styles.metaRow}>
              <View style={styles.badge}>
                <MaterialCommunityIcons
                  name="bookmark-check"
                  size={14}
                  color={theme.colors.primary}
                />
                <Text style={styles.badgeText}>
                  {hasActiveSearch
                    ? `${filteredSaves.length} de ${savedRecipes.length} salvas`
                    : `${savedRecipes.length} ${savedRecipes.length === 1 ? 'receita salva' : 'receitas salvas'}`}
                </Text>
              </View>
            </View>
          )}
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
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
          ) : savedRecipes.length === 0 ? (
            <View style={styles.feedbackContainer}>
              <View style={styles.emptyIconWrapper}>
                <MaterialCommunityIcons
                  name="bookmark-multiple-outline"
                  size={48}
                  color={theme.colors.primary}
                />
              </View>
              <Text style={styles.emptyTitle}>Nenhuma receita salva ainda</Text>
              <Text style={styles.emptySubtitle}>
                Quando você encontrar receitas incríveis na comunidade, salve-as aqui para consultar
                os passos e produzir com o seu estoque.
              </Text>
              <CustomButton
                title="Explorar Receitas Públicas"
                onPress={() => router.push('/public-recipes')}
                style={styles.exploreBtn}
              />
            </View>
          ) : filteredSaves.length === 0 ? (
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
          ) : (
            <View style={styles.listContainer}>
              {filteredSaves.map((item) => (
                <SavedRecipeCard
                  key={item.recipe.id}
                  item={item}
                  onPress={() =>
                    router.push({
                      pathname: '/single-recipe',
                      params: { recipeId: item.recipe.id },
                    })
                  }
                  onRemove={() => handleRemove(item.recipe.id, item.recipe.title)}
                  isRemoving={removingId === item.recipe.id}
                />
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
    header: {
      paddingHorizontal: isDesktop ? 32 : 16,
      paddingTop: 16,
      paddingBottom: 8,
      maxWidth: 960,
      width: '100%',
      alignSelf: 'center',
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
      backgroundColor: theme.colors.pitchBackground,
      borderWidth: 1,
      borderColor: theme.colors.secBorder,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 9999,
    },
    badgeText: {
      fontFamily: 'Inter',
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.text,
    },
    scrollView: {
      flex: 1,
      width: '100%',
    },
    scrollContent: {
      paddingHorizontal: isDesktop ? 32 : 16,
      paddingBottom: 40,
      paddingTop: 8,
      maxWidth: 960,
      width: '100%',
      alignSelf: 'center',
      flexGrow: 1,
    },
    listContainer: {
      gap: 12,
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
      backgroundColor: theme.colors.pitchBackground,
      borderWidth: 1,
      borderColor: theme.colors.secBorder,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    emptyTitle: {
      fontFamily: 'Playfair Display SC',
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    emptySubtitle: {
      fontFamily: 'Inter',
      fontSize: 14,
      color: theme.colors.text,
      opacity: 0.75,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 24,
      maxWidth: 380,
    },
    exploreBtn: {
      width: '100%',
      maxWidth: 280,
    },
    clearSearchBtn: {
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
    },
    clearSearchText: {
      fontFamily: 'Inter',
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.primary,
      textDecorationLine: 'underline',
    },
  });
