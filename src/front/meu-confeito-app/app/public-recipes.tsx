import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Stack, router } from 'expo-router';

import { BackButton, Input, RecipeView } from '@/src/components';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { useManyRecipes } from '@/src/hooks/useRecipes';
import { AppTheme } from '@/src/theme/themes';

export default function PublicRecipesScreen() {
  const [search, setSearch] = useState('');

  const { theme } = useThemeMode();
  const { recipes } = useManyRecipes(search);

  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <>
      <Stack.Screen options={{ title: 'Receitas Públicas' }} />

      <View style={styles.container}>
        <BackButton />
        <Input value={search} placeholder="Pesquisar receitas..." onBlur={() => setSearch} />

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
    </>
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
      flexDirection: 'row',
      flexWrap: 'wrap',
      padding: 20,
      gap: 15,
      justifyContent: 'center',
      minWidth: '99%',
    },
  });
