import { useMemo } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';

import { Link, router } from 'expo-router';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { FloatingButton, RecipeView } from '@/src/components';
import { useAuth } from '@/src/contexts/AuthContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { useUserRecipes } from '@/src/hooks/useRecipes';
import { AppTheme } from '@/src/theme/themes';

export default function RecipesScreen() {
  const { theme } = useThemeMode();
  const { user } = useAuth();
  const { recipes } = useUserRecipes(user?.id);
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
    <View style={styles.container}>
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

      <Link href="/public-recipes" asChild>
        <FloatingButton variant="secondary" containerStyle={styles.button}>
          <MaterialCommunityIcons name="plus" color={theme.colors.text} size={26} />
        </FloatingButton>
      </Link>
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      alignItems: 'center',
      paddingTop: 8,
    },
    scrollContainer: {
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 80,
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
    button: {
      position: 'absolute',
      bottom: 20,
      right: 20,
    },
  });
