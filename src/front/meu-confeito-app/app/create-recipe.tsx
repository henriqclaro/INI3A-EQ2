import { useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

import { Stack, router, useLocalSearchParams } from 'expo-router';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { RecipeForm, RecipeFormSubmitData } from '@/src/components/RecipeForm';
import { useAuth } from '@/src/contexts/AuthContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { useRecipeRegister, useRecipeUpdate, useSingleRecipe } from '@/src/hooks/useRecipes';
import { AppTheme } from '@/src/theme/themes';
import { RecipeRegisterInput } from '@/src/types';

export default function CreateRecipeScreen() {
  const { theme } = useThemeMode();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const { recipeId, forkFromId, parentId } = useLocalSearchParams<{
    recipeId?: string;
    forkFromId?: string;
    parentId?: string;
  }>();

  const sourceRecipeId = forkFromId || parentId;
  const isCustomizing = Boolean(sourceRecipeId);
  const isEditMode = Boolean(recipeId) && !isCustomizing;
  const targetRecipeId = isCustomizing ? sourceRecipeId : recipeId;

  const {
    recipe,
    isLoading: isLoadingRecipe,
    error: recipeError,
  } = useSingleRecipe(targetRecipeId || '', user?.id);
  const { registerRecipe, isLoading: isRegistering } = useRecipeRegister();
  const { updateRecipe, isLoading: isUpdating } = useRecipeUpdate();

  const isSubmitting = isEditMode ? isUpdating : isRegistering;
  const isOwner = Boolean(!isEditMode || (user?.id && recipe?.userId && user.id === recipe.userId));

  const styles = useMemo(() => createStyles(theme, isDesktop), [theme, isDesktop]);

  const handleSubmit = async (formData: RecipeFormSubmitData) => {
    if (!user?.id) {
      Alert.alert('Erro', 'Usuário não autenticado. Por favor, faça login novamente.');
      return;
    }

    try {
      if (isEditMode && recipeId) {
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
      } else {
        const payload: RecipeRegisterInput = {
          userId: user.id,
          parentId: isCustomizing && sourceRecipeId ? sourceRecipeId : null,
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
        };

        const res = await registerRecipe(payload);

        const successTitle = isCustomizing ? 'Receita Personalizada!' : 'Sucesso';
        const successMessage = isCustomizing
          ? 'Sua versão personalizada foi criada com sucesso e vinculada à receita original!'
          : 'Receita cadastrada com sucesso!';

        Alert.alert(successTitle, successMessage, [
          {
            text: 'Visualizar',
            onPress: () => {
              if (res?.data?.recipe?.id) {
                router.replace({
                  pathname: '/single-recipe',
                  params: { recipeId: res.data.recipe.id },
                });
              } else {
                router.replace('/(tabs)/recipes');
              }
            },
          },
        ]);
      }
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
      const errorMsg =
        apiErr?.response?.data?.message ||
        apiErr?.message ||
        (isEditMode
          ? 'Não foi possível atualizar a receita.'
          : isCustomizing
            ? 'Não foi possível criar sua versão personalizada.'
            : 'Não foi possível salvar a receita.');
      Alert.alert(
        isEditMode
          ? 'Erro ao atualizar'
          : isCustomizing
            ? 'Erro ao personalizar'
            : 'Erro ao cadastrar',
        errorMsg,
      );
    }
  };

  const pageTitle = isCustomizing
    ? 'Personalizar Receita'
    : isEditMode
      ? 'Editar Receita'
      : 'Cadastrar Receita';

  return (
    <>
      <Stack.Screen options={{ title: pageTitle }} />

      <View style={styles.container}>
        {(isEditMode || isCustomizing) && isLoadingRecipe ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>
              {isCustomizing
                ? 'Carregando dados da receita pública...'
                : 'Carregando dados da receita...'}
            </Text>
          </View>
        ) : (isEditMode || isCustomizing) && (!recipe || recipeError) ? (
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
                {isCustomizing
                  ? 'Não foi possível encontrar a receita pública para personalização.'
                  : 'Não foi possível encontrar a receita para edição.'}
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
        ) : isEditMode && !isOwner ? (
          <View style={styles.centerContainer}>
            <View style={styles.errorCard}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons
                  name="shield-lock-outline"
                  size={40}
                  color={theme.colors.error}
                />
              </View>
              <Text style={styles.errorTitle}>Acesso Negado</Text>
              <Text style={styles.errorSubtitle}>
                Você não tem permissão para editar esta receita diretamente.
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
        ) : (
          <View style={styles.formWrapper}>
            {isCustomizing && recipe && (
              <View style={styles.forkBannerWrapper}>
                <View style={styles.forkBanner}>
                  <View style={styles.forkBannerIconWrap}>
                    <MaterialCommunityIcons
                      name="source-fork"
                      size={22}
                      color={theme.colors.primary}
                    />
                  </View>
                  <View style={styles.forkBannerContent}>
                    <View style={styles.forkBannerBadge}>
                      <MaterialCommunityIcons
                        name="earth"
                        size={12}
                        color={theme.colors.onPrimaryFixed}
                      />
                      <Text style={styles.forkBannerBadgeText}>Personalizando Receita Pública</Text>
                    </View>
                    <Text style={styles.forkBannerTitle} numberOfLines={1}>
                      Versão baseada em: {recipe.title}
                    </Text>
                    <Text style={styles.forkBannerSubtitle}>
                      Todos os dados originais foram carregados abaixo. Ajuste ingredientes, etapas
                      e precificação para a sua confeitaria. A receita original permanecerá intacta
                      e vinculada como referência.
                    </Text>
                  </View>
                </View>
              </View>
            )}

            <RecipeForm
              key={isCustomizing ? `fork-${recipe?.id}` : isEditMode ? `edit-${recipe?.id}` : 'new'}
              initialRecipe={isCustomizing || isEditMode ? recipe : undefined}
              isEditMode={isEditMode}
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit}
              submitButtonText={
                isCustomizing
                  ? 'Salvar Minha Versão'
                  : isEditMode
                    ? 'Salvar Alterações'
                    : 'Cadastrar Receita'
              }
            />
          </View>
        )}
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
    formWrapper: {
      flex: 1,
    },
    forkBannerWrapper: {
      paddingHorizontal: isDesktop ? 24 : 16,
      paddingTop: 16,
      paddingBottom: 4,
      width: '100%',
      maxWidth: 960,
      alignSelf: 'center',
    },
    forkBanner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.lg,
      padding: 16,
      gap: 14,
      ...theme.shadows.soft,
    },
    forkBannerIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.surfaceContainer,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    forkBannerContent: {
      flex: 1,
      gap: 4,
    },
    forkBannerBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: theme.colors.primaryFixed,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: theme.rounded.full,
      gap: 4,
      marginBottom: 2,
    },
    forkBannerBadgeText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.onPrimaryFixed,
    },
    forkBannerTitle: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.espressoDark,
    },
    forkBannerSubtitle: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 18,
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
  });
