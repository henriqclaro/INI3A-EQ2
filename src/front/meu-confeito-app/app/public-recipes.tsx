import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
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
  const { recipes, isLoading } = useManyRecipes(search);
  const { width } = useWindowDimensions();

  const isDesktop = width >= 768;

  const cardWidth = useMemo(() => {
    if (width >= 1200) {
      return (1200 - 48 - 48) / 4; // 4 columns on large desktop
    }
    if (width >= 960) {
      return (width - 48 - 32) / 3; // 3 columns on tablet / small desktop
    }
    if (width >= 768) {
      return (width - 48 - 16) / 2; // 2 columns on tablets
    }
    return undefined; // full width on mobile
  }, [width]);

  const styles = useMemo(() => createStyles(theme, isDesktop), [theme, isDesktop]);

  return (
    <>
      <Stack.Screen options={{ title: 'Receitas Públicas' }} />

      <View style={styles.container}>
        {/* <BackButton /> */}
        <View style={styles.headerContent}>
          <Input
            value={search}
            placeholder="Pesquisar receitas..."
            onChangeText={setSearch}
            containerStyle={styles.searchInput}
          />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <View style={styles.feedbackContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : recipes.length === 0 ? (
            <View style={styles.feedbackContainer}>
              <MaterialCommunityIcons
                name="book-search-outline"
                size={56}
                color={theme.colors.placeholder}
              />
              <Text style={styles.emptyText}>
                {search.trim()
                  ? 'Nenhuma receita encontrada para a busca.'
                  : 'Nenhuma receita pública disponível no momento.'}
              </Text>
            </View>
          ) : (
            <View style={styles.gridContainer}>
              {recipes.map((recipe) => (
                <View
                  key={recipe.id}
                  style={[styles.cardWrapper, cardWidth ? { width: cardWidth } : null]}
                >
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
      paddingTop: 8,
    },
    searchInput: {
      width: '100%',
      maxWidth: 500,
      marginVertical: 8,
    },
    scrollView: {
      flex: 1,
      width: '100%',
    },
    scrollContainer: {
      paddingHorizontal: isDesktop ? 24 : 16,
      paddingTop: 8,
      paddingBottom: 40,
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
      width: '100%',
      maxWidth: isDesktop ? undefined : 480,
    },
    feedbackContainer: {
      paddingTop: 60,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },
    emptyText: {
      color: theme.colors.text,
      fontSize: 16,
      fontStyle: 'italic',
      textAlign: 'center',
    },
  });
