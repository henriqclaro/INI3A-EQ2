import { useMemo } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Stack, router, useLocalSearchParams } from 'expo-router';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { OfflineBanner, RecipeForm, RecipeFormSubmitData } from '@/src/components';
import { useAuth } from '@/src/contexts/AuthContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { useNetwork } from '@/src/hooks/useNetwork';
import { useRecipeDelete, useRecipeUpdate, useSingleRecipe } from '@/src/hooks/useRecipes';
import { RecipeService } from '@/src/services/recipe';
import { AppTheme } from '@/src/theme/themes';
import { clearImageCache, createImageFormData, getStorageUrl } from '@/src/utils/image';

export default function EditRecipeScreen() {
  const { theme } = useThemeMode();
  const { user } = useAuth();
  const { recipeId } = useLocalSearchParams<{ recipeId: string }>();
  const { isOffline } = useNetwork();

  const {
    recipe,
    isLoading: isLoadingRecipe,
    error: recipeError,
  } = useSingleRecipe(recipeId, user?.id);
  const { updateRecipe, isLoading: isSubmitting } = useRecipeUpdate();
  const { deleteRecipe, isLoading: isDeletingRecipe } = useRecipeDelete();

  const styles = useMemo(() => createStyles(theme), [theme]);

  const isOwner = Boolean(user?.id && recipe?.userId && user.id === recipe.userId);

  const handleDeleteRecipe = () => {
    if (!recipeId) return;

    if (isOffline) {
      Alert.alert('Modo Offline', 'Excluir receitas requer conexão com a internet.');
      return;
    }

    Alert.alert(
      'Excluir Receita',
      'Tem certeza de que deseja excluir permanentemente esta receita? Se ela não estiver vinculada a fichas técnicas ou produções anteriores, todos os dados e a imagem de capa serão removidos definitivamente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRecipe(recipeId);
              Alert.alert('Receita Excluída', 'A receita foi excluída com sucesso.', [
                {
                  text: 'OK',
                  onPress: () => router.replace('/(tabs)/recipes'),
                },
              ]);
            } catch (err: unknown) {
              const apiErr = err as {
                response?: { data?: { message?: string } };
                message?: string;
              };
              const msg =
                apiErr?.response?.data?.message ||
                apiErr?.message ||
                'Não foi possível excluir a receita.';
              Alert.alert('Falha na Exclusão', msg);
            }
          },
        },
      ],
    );
  };

  const handleSubmit = async (formData: RecipeFormSubmitData) => {
    if (isOffline) {
      Alert.alert(
        'Modo Offline',
        'Você está sem conexão com a internet. Conecte-se para salvar alterações na receita.',
      );
      return;
    }

    if (!recipeId) {
      Alert.alert('Erro', 'ID da receita não encontrado.');
      return;
    }

    try {
      let finalCoverUrl = formData.coverUrl;

      if (formData.hasRemovedCover) {
        try {
          await RecipeService.deleteCover(recipeId);
        } catch (deleteError) {
          console.warn('Failed to delete cover on server:', deleteError);
        }
        finalCoverUrl = null;
        await clearImageCache();
      } else if (formData.coverImageFile) {
        const coverFormData = await createImageFormData('cover', formData.coverImageFile);
        const uploadRes = await RecipeService.uploadCover(recipeId, coverFormData);
        finalCoverUrl = getStorageUrl(uploadRes.data.url);
        await clearImageCache();
      }

      await updateRecipe(recipeId, {
        title: formData.title,
        coverUrl: finalCoverUrl,
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
      <Stack.Screen
        options={{
          title: 'Editar Receita',
          headerRight: () =>
            isOwner && recipeId ? (
              <TouchableOpacity
                onPress={handleDeleteRecipe}
                disabled={isDeletingRecipe}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.headerDeleteBtn}
                accessibilityRole="button"
                accessibilityLabel="Excluir receita"
              >
                {isDeletingRecipe ? (
                  <ActivityIndicator size="small" color={theme.colors.error} />
                ) : (
                  <MaterialCommunityIcons
                    name="trash-can-outline"
                    size={22}
                    color={theme.colors.error}
                  />
                )}
              </TouchableOpacity>
            ) : null,
        }}
      />

      <View style={styles.container}>
        {isLoadingRecipe ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Carregando dados da receita...</Text>
          </View>
        ) : !recipe || recipeError ? (
          <View style={styles.centerContainer}>
            <View style={styles.errorCard}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons
                  name="book-remove-outline"
                  size={40}
                  color={theme.colors.onSurfaceVariant}
                />
              </View>
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
          </View>
        ) : !isOwner ? (
          <View style={styles.centerContainer}>
            <View style={styles.errorCard}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons
                  name={recipe?.status === 'PUBLISHED' ? 'source-fork' : 'shield-lock-outline'}
                  size={40}
                  color={recipe?.status === 'PUBLISHED' ? theme.colors.primary : theme.colors.error}
                />
              </View>
              <Text style={styles.errorTitle}>
                {recipe?.status === 'PUBLISHED' ? 'Receita Pública' : 'Acesso Negado'}
              </Text>
              <Text style={styles.errorSubtitle}>
                {recipe?.status === 'PUBLISHED'
                  ? 'Esta é uma receita pública e não pode ser alterada diretamente. Deseja criar sua própria versão personalizada na sua confeitaria?'
                  : 'Você não tem permissão para editar esta receita diretamente.'}
              </Text>
              {recipe?.status === 'PUBLISHED' && (
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() =>
                    router.replace({
                      pathname: '/create-recipe',
                      params: { forkFromId: recipeId },
                    })
                  }
                  accessibilityRole="button"
                  accessibilityLabel="Personalizar receita e criar minha versão"
                >
                  <Text style={styles.actionBtnText}>Personalizar e Criar Minha Versão</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={recipe?.status === 'PUBLISHED' ? styles.secondaryBtn : styles.actionBtn}
                onPress={() => router.back()}
                accessibilityRole="button"
                accessibilityLabel="Voltar"
              >
                <Text
                  style={
                    recipe?.status === 'PUBLISHED' ? styles.secondaryBtnText : styles.actionBtnText
                  }
                >
                  Voltar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.formWrapper}>
            <OfflineBanner
              isVisible={isOffline}
              message="Você está offline. Salvar alterações ou excluir receitas requer conexão com a internet."
              style={styles.offlineBanner}
            />
            <RecipeForm
              initialRecipe={recipe}
              isEditMode={true}
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit}
              submitButtonText="Salvar Alterações"
            />
          </View>
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
    formWrapper: {
      flex: 1,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    errorCard: {
      width: '100%',
      maxWidth: 400,
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.rounded.lg,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: 24,
      alignItems: 'center',
      gap: 12,
      ...theme.shadows.soft,
    },
    iconCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    loadingText: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginTop: 8,
    },
    errorTitle: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 22,
      fontWeight: 'bold',
      color: theme.colors.espressoDark,
      textAlign: 'center',
    },
    errorSubtitle: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      lineHeight: 20,
    },
    actionBtn: {
      marginTop: 8,
      backgroundColor: theme.colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: theme.rounded.default,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
      ...theme.shadows.soft,
    },
    actionBtnText: {
      color: theme.colors.onPrimary,
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 15,
      fontWeight: '600',
    },
    secondaryBtn: {
      marginTop: 4,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: theme.rounded.default,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
    },
    secondaryBtnText: {
      color: theme.colors.onSurfaceVariant,
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 15,
      fontWeight: '600',
    },
    headerDeleteBtn: {
      minWidth: 48,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 8,
    },
    offlineBanner: {
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 4,
    },
  });
