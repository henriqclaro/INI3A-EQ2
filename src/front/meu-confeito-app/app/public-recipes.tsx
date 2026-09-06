import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';

import { Stack, router } from 'expo-router';

import { Input, RecipeView } from '@/src/components';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { useManyRecipes } from '@/src/hooks/useRecipes';
import { AppTheme } from '@/src/theme/themes';

export default function PublicRecipesScreen() {
  const [search, setSearch] = useState('');

  const { theme } = useThemeMode();
  const { recipes } = useManyRecipes(search);
  const { width } = useWindowDimensions();

  const cardWidth = useMemo(() => {
    if (width >= 1200) {
      return (1200 - 40 - 45) / 4; // 4 columns on large desktop
    }
    if (width >= 900) {
      return (width - 40 - 30) / 3; // 3 columns on tablet / small desktop
    }
    if (width >= 600) {
      return (width - 40 - 15) / 2; // 2 columns on tablets
    }
    return undefined; // full width on mobile
  }, [width]);

  const styles = useMemo(() => createStyles(theme), [theme]);

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
          contentContainerStyle={styles.scrollContainer}
          showsHorizontalScrollIndicator={false}
        >
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
        </ScrollView>
      </View>
    </>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      alignItems: 'center',
      paddingTop: 12,
    },
    headerContent: {
      width: '100%',
      maxWidth: 1200,
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    searchInput: {
      width: '100%',
      maxWidth: 500,
      marginVertical: 8,
    },
    scrollContainer: {
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 40,
      width: '100%',
    },
    gridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 15,
      justifyContent: 'center',
      width: '100%',
      maxWidth: 1200,
    },
    cardWrapper: {
      width: '100%',
    },
  });
