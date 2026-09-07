import { useMemo } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Stack, router, useLocalSearchParams } from 'expo-router';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { RecipeForm, RecipeFormSubmitData } from '@/src/components/RecipeForm';
import { useAuth } from '@/src/contexts/AuthContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { useRecipeUpdate, useSingleRecipe } from '@/src/hooks/useRecipes';
import { AppTheme } from '@/src/theme/themes';

export default function EditRecipeScreen() {
  const { theme } = useThemeMode();
  const { user } = useAuth();
  const { recipeId } = useLocalSearchParams<{ recipeId: string }>();

  const {
    recipe,
    isLoading: isLoadingRecipe,
    error: recipeError,
  } = useSingleRecipe(recipeId, user?.id);
  const { updateRecipe, isLoading: isSubmitting } = useRecipeUpdate();

  const styles = useMemo(() => createStyles(theme), [theme]);

  const isOwner = Boolean(user?.id && recipe?.userId && user.id === recipe.userId);

  const handleSubmit = async (formData: RecipeFormSubmitData) => {
    if (!recipeId) {
      Alert.alert('Erro', 'ID da receita não encontrado.');
      return;
    }

    try {
      await updateRecipe(recipeId, {
        title: formData.title,
        coverUrl: formData.coverUrl,
        instructions: formData.instructions,
        baseYield: formData.baseYield,
        yieldUnit: formData.yieldUnit,
        profitMargin: formData.profitMargin,
        overhead: formData.overhead,
        prepTimeMinutes: formData.prepTimeMinutes,
        hourlyLabor: formData.hourlyLabor,
        packagingCost: formData.packagingCost,
        items: formData.items,
        tagIds: formData.tagIds,
      });

      Alert.alert('Sucesso', 'Receita atualizada com sucesso!', [
        {
          text: 'Visualizar',
          onPress: () => {
            router.replace({
              pathname: '/single-recipe',
              params: { recipeId },
            });
          },
        },
      ]);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
      const errorMsg =
        apiErr?.response?.data?.message ||
        apiErr?.message ||
        'Não foi possível atualizar a receita.';
      Alert.alert('Erro ao atualizar', errorMsg);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Editar Receita' }} />

      <View style={styles.container}>
        {isLoadingRecipe ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Carregando dados da receita...</Text>
          </View>
        ) : !recipe || recipeError ? (
          <View style={styles.centerContainer}>
            <MaterialCommunityIcons
              name="book-remove-outline"
              size={56}
              color={theme.colors.placeholder}
            />
            <Text style={styles.errorTitle}>Receita não encontrada</Text>
            <Text style={styles.errorSubtitle}>
              Não foi possível encontrar a receita para edição.
            </Text>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Voltar"
            >
              <Text style={styles.actionBtnText}>Voltar</Text>
            </TouchableOpacity>
          </View>
        ) : !isOwner ? (
          <View style={styles.centerContainer}>
            <MaterialCommunityIcons
              name="shield-lock-outline"
              size={56}
              color={theme.colors.danger || theme.colors.primary}
            />
            <Text style={styles.errorTitle}>Acesso Negado</Text>
            <Text style={styles.errorSubtitle}>
              Você não tem permissão para editar esta receita.
            </Text>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Voltar"
            >
              <Text style={styles.actionBtnText}>Voltar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <RecipeForm
            initialRecipe={recipe}
            isEditMode={true}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            submitButtonText="Salvar Alterações"
          />
        )}
      </View>
    </>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
      gap: 12,
    },
    loadingText: {
      fontFamily: 'Inter',
      fontSize: 14,
      color: theme.colors.text,
      marginTop: 8,
    },
    errorTitle: {
      fontFamily: 'Playfair Display SC',
      fontSize: 22,
      fontWeight: 'bold',
      color: theme.colors.text,
      textAlign: 'center',
    },
    errorSubtitle: {
      fontFamily: 'Inter',
      fontSize: 14,
      color: theme.colors.text,
      opacity: 0.8,
      textAlign: 'center',
    },
    actionBtn: {
      marginTop: 8,
      backgroundColor: theme.colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionBtnText: {
      color: theme.colors.secondaryText,
      fontFamily: 'Inter',
      fontSize: 15,
      fontWeight: '600',
    },
  });
