import { useMemo } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

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
  const { recipes, isLoading } = useUserRecipes(user?.id);
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
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : recipes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="book-open-variant-outline"
              size={56}
              color={theme.colors.placeholder}
            />
            <Text style={styles.emptyText}>Você ainda não possui receitas cadastradas.</Text>
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

      <Link href="/public-recipes" asChild>
        <FloatingButton variant="secondary" containerStyle={styles.button}>
          <MaterialCommunityIcons name="plus" color={theme.colors.text} size={26} />
        </FloatingButton>
      </Link>
    </View>
  );
}

const createStyles = (theme: AppTheme, isDesktop: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
      width: '100%',
    },
    scrollContainer: {
      paddingHorizontal: isDesktop ? 24 : 16,
      paddingTop: 16,
      paddingBottom: 80,
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
    loadingContainer: {
      paddingTop: 60,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyContainer: {
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
    button: {
      position: 'absolute',
      bottom: 20,
      right: 20,
    },
  });
