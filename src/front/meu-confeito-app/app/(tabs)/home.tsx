import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { router } from 'expo-router';

import { RecipeSmallView } from '@/src/components';
import { useAuth } from '@/src/contexts/AuthContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { useUserRecipes } from '@/src/hooks/useUserRecipes';
import { AppTheme } from '@/src/theme/themes';

export default function HomeScreen() {
  const { theme } = useThemeMode();
  const { user } = useAuth();
  const { recipes } = useUserRecipes(user?.id || '');

  const styles = useMemo(() => createStyles(theme), [theme]);

  const firstName = user?.name ? user.name.split(' ')[0] : 'Confeiteiro';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Olá, {firstName}!</Text>
        <Text style={styles.subtitle}>Bem-vindo de volta.</Text>
      </View>

      <View style={styles.topicContainer}>
        <Text style={styles.topicTitle}>Suas Receitas</Text>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          {recipes.length > 0 ? (
            recipes.map((recipe) => (
              <RecipeSmallView
                key={recipe.id}
                title={recipe.title}
                coverUrl={recipe.coverUrl}
                prepTimeMinutes={recipe.prepTimeMinutes}
                onPress={() => {
                  router.push({ pathname: '/single-recipe', params: { recipeId: recipe.id } });
                }}
              />
            ))
          ) : (
            <Text style={styles.emptyText}>Você ainda não possui receitas públicas.</Text>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingTop: 80,
    },
    header: {
      paddingHorizontal: 20,
      marginBottom: 30,
    },
    title: {
      color: theme.colors.primary,
      fontFamily: 'Playfair Display SC',
      fontSize: 32,
      fontWeight: 'bold',
      marginBottom: 5,
    },
    subtitle: {
      color: theme.colors.text,
      fontSize: 16,
    },
    topicContainer: {
      flex: 1,
    },
    topicTitle: {
      color: theme.colors.primary,
      fontFamily: 'Playfair Display SC',
      fontSize: 24,
      fontWeight: 'bold',
      paddingHorizontal: 20,
      marginBottom: 15,
    },
    scrollContainer: {
      paddingHorizontal: 20,
      gap: 15,
      paddingBottom: 20,
    },
    emptyText: {
      color: theme.colors.text,
      fontSize: 16,
      fontStyle: 'italic',
      marginTop: 20,
    },
  });
