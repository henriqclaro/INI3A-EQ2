import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { router } from 'expo-router';

import { RecipeView } from '@/src/components';
import { useAuth } from '@/src/contexts/AuthContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { useUserRecipes } from '@/src/hooks/useUserRecipes';
import { AppTheme } from '@/src/theme/themes';

export default function RecipesScreen() {
  const { theme } = useThemeMode();
  const { user } = useAuth();
  const { recipes } = useUserRecipes(user!.id);

  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsHorizontalScrollIndicator={false}
      >
        {recipes.map((recipe) => (
          <RecipeView
            key={recipe.id}
            title={recipe.title}
            coverUrl={recipe.coverUrl}
            tags={recipe.tags}
            onPress={() => {
              router.push({ pathname: '/single-recipe', params: { recipeId: recipe.id } });
            }}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      alignItems: 'center',
      paddingTop: 80,
    },
    scrollContainer: {
      padding: 20,
      gap: 20,
      alignItems: 'center',
    },
  });
