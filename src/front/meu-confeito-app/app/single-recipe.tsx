import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

import { Image } from 'expo-image';
import { Stack, router, useLocalSearchParams } from 'expo-router';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useThemeMode } from '@/src/contexts/ThemeContext';
import { useSingleRecipe } from '@/src/hooks/useRecipes';
import { AppTheme } from '@/src/theme/themes';
import { PartialTag } from '@/src/types';

export default function RecipeScreen() {
  const { theme } = useThemeMode();
  const { width } = useWindowDimensions();
  const { recipeId } = useLocalSearchParams() as { recipeId: string };
  const { recipe, isLoading } = useSingleRecipe(recipeId);

  const isDesktop = width >= 768;
  const isSmallScreen = width < 360;

  const [hasImageError, setHasImageError] = useState(false);
  const [checkedIngredientMap, setCheckedIngredientMap] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<'recipe' | 'pricing'>('recipe');

  const styles = useMemo(
    () => createStyles(theme, isDesktop, isSmallScreen),
    [theme, isDesktop, isSmallScreen],
  );

  const toggleIngredient = (id: string) => {
    setCheckedIngredientMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const hasValidCover = Boolean(
    recipe?.coverUrl && recipe.coverUrl.trim().length > 0 && !hasImageError,
  );

  const recipeTags = useMemo(() => {
    const rawTags = (recipe as any)?.tags;
    if (!Array.isArray(rawTags)) return [];
    return rawTags.map((item: { tag: PartialTag }) => {
      const tagType = (item?.tag?.type || '').toLowerCase();
      const backgroundColor =
        theme.colors.tags[tagType as keyof typeof theme.colors.tags] || theme.colors.secondary;
      return {
        ...item,
        backgroundColor,
      };
    });
  }, [recipe, theme]);

  const parsedInstructions = useMemo(() => {
    if (!recipe?.instructions) return [];
    if (Array.isArray(recipe.instructions)) {
      return recipe.instructions.map((step: any) =>
        typeof step === 'string' ? step : step?.text || JSON.stringify(step),
      );
    }
    if (typeof recipe.instructions === 'string') {
      return [recipe.instructions];
    }
    return [String(recipe.instructions)];
  }, [recipe]);

  return (
    <>
      <Stack.Screen options={{ title: recipe?.title || 'Receita' }} />

      <View style={styles.container}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : !recipe ? (
          <View style={styles.notFoundContainer}>
            <MaterialCommunityIcons
              name="book-remove-outline"
              size={56}
              color={theme.colors.placeholder}
            />
            <Text style={styles.notFoundTitle}>Receita não encontrada</Text>
            <Text style={styles.notFoundSubtitle}>
              Não foi possível carregar as informações desta receita.
            </Text>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.85}
            >
              <Text style={styles.backButtonText}>Voltar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.innerWrapper}>
              {/* Recipe Cover or Placeholder */}
              {hasValidCover ? (
                <Image
                  source={{ uri: recipe.coverUrl! }}
                  style={styles.heroImage}
                  contentFit="cover"
                  onError={() => setHasImageError(true)}
                />
              ) : (
                <View style={styles.heroPlaceholder}>
                  <View style={styles.heroPlaceholderBadge}>
                    <MaterialCommunityIcons
                      name="cake-variant-outline"
                      size={44}
                      color={theme.colors.primary}
                    />
                  </View>
                  <Text style={styles.heroPlaceholderTitle}>Receita Sem Foto</Text>
                  <Text style={styles.heroPlaceholderSubtitle}>
                    Meu Confeito • Confeitaria Artesanal
                  </Text>
                </View>
              )}

              {/* Title, Meta and Tags Header */}
              <View style={styles.headerSection}>
                <Text style={styles.primaryTitle}>{recipe.title}</Text>

                <View style={styles.metaRow}>
                  {Boolean(recipe.baseYield) && (
                    <View style={styles.metaBadge}>
                      <MaterialCommunityIcons
                        name="silverware-fork-knife"
                        size={15}
                        color={theme.colors.text}
                      />
                      <Text style={styles.metaBadgeText}>
                        Rende {recipe.baseYield} {recipe.yieldUnit || 'porções'}
                      </Text>
                    </View>
                  )}

                  {Number(recipe.prepTimeMinutes) > 0 && (
                    <View style={styles.metaBadge}>
                      <MaterialCommunityIcons
                        name="timer-outline"
                        size={15}
                        color={theme.colors.text}
                      />
                      <Text style={styles.metaBadgeText}>{recipe.prepTimeMinutes} min</Text>
                    </View>
                  )}
                </View>

                {recipeTags.length > 0 && (
                  <View style={styles.tagsRow}>
                    {recipeTags.map((item: any) => (
                      <View
                        key={item?.tag?.id || item?.tag?.name}
                        style={[styles.tagPill, { backgroundColor: item.backgroundColor }]}
                      >
                        <Text style={styles.tagPillText}>{item?.tag?.name}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Segmented Mode Switcher */}
              <View style={styles.segmentedControl}>
                <TouchableOpacity
                  style={[
                    styles.segmentButton,
                    viewMode === 'recipe' && styles.segmentButtonActive,
                  ]}
                  onPress={() => setViewMode('recipe')}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel="Modo Receita"
                >
                  <MaterialCommunityIcons
                    name="book-open-outline"
                    size={18}
                    color={viewMode === 'recipe' ? theme.colors.secondaryText : theme.colors.text}
                  />
                  <Text
                    style={[
                      styles.segmentButtonText,
                      viewMode === 'recipe' && styles.segmentButtonTextActive,
                    ]}
                  >
                    Modo Receita
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.segmentButton,
                    viewMode === 'pricing' && styles.segmentButtonActive,
                  ]}
                  onPress={() => setViewMode('pricing')}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel="Custos e Precificação"
                >
                  <MaterialCommunityIcons
                    name="cash-multiple"
                    size={18}
                    color={viewMode === 'pricing' ? theme.colors.secondaryText : theme.colors.text}
                  />
                  <Text
                    style={[
                      styles.segmentButtonText,
                      viewMode === 'pricing' && styles.segmentButtonTextActive,
                    ]}
                  >
                    Custos & Preços
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Recipe View Mode */}
              {viewMode === 'recipe' ? (
                <View style={styles.modeContainer}>
                  {/* Ingredients Card */}
                  <View style={styles.cardBox}>
                    <View style={styles.cardHeader}>
                      <MaterialCommunityIcons
                        name="format-list-checks"
                        size={22}
                        color={theme.colors.primary}
                      />
                      <Text style={styles.cardTitle}>Ingredientes</Text>
                    </View>

                    {recipe.ingredients && recipe.ingredients.length > 0 ? (
                      recipe.ingredients.map((item, index) => {
                        const ingId = String(item.ingredientId || index);
                        const isIngredientChecked = Boolean(checkedIngredientMap[ingId]);
                        const ingName = Array.isArray(item.ingredient?.name)
                          ? item.ingredient.name.join(', ')
                          : item.ingredient?.name || 'Ingrediente';

                        return (
                          <TouchableOpacity
                            key={ingId}
                            style={styles.ingredientRow}
                            onPress={() => toggleIngredient(ingId)}
                            activeOpacity={0.7}
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked: isIngredientChecked }}
                          >
                            <View style={styles.ingredientLeft}>
                              <View
                                style={[
                                  styles.checkbox,
                                  isIngredientChecked && styles.checkedCheckbox,
                                ]}
                              >
                                {isIngredientChecked && (
                                  <MaterialCommunityIcons
                                    name="check"
                                    size={14}
                                    color={theme.colors.secondaryText}
                                  />
                                )}
                              </View>
                              <Text
                                style={[
                                  styles.ingredientName,
                                  isIngredientChecked && styles.checkedIngredientText,
                                ]}
                              >
                                {ingName}
                                {item.notes ? ` (${item.notes})` : ''}
                              </Text>
                            </View>
                            <Text style={styles.ingredientQuantity}>
                              {item.baseQuantity} {item.measurementUnit}
                            </Text>
                          </TouchableOpacity>
                        );
                      })
                    ) : (
                      <Text style={styles.emptyCardText}>Nenhum ingrediente informado.</Text>
                    )}
                  </View>

                  {/* Preparation Steps Card */}
                  <View style={styles.cardBox}>
                    <View style={styles.cardHeader}>
                      <MaterialCommunityIcons
                        name="pot-steam-outline"
                        size={22}
                        color={theme.colors.primary}
                      />
                      <Text style={styles.cardTitle}>Modo de Preparo</Text>
                    </View>

                    {parsedInstructions.length > 0 ? (
                      parsedInstructions.map((instructionText, index) => (
                        <View key={index} style={styles.stepRow}>
                          <View style={styles.stepBadge}>
                            <Text style={styles.stepText}>{index + 1}</Text>
                          </View>
                          <Text style={styles.stepContent}>{instructionText}</Text>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.emptyCardText}>
                        Nenhuma instrução de preparo informada.
                      </Text>
                    )}
                  </View>
                </View>
              ) : (
                /* Pricing View Mode */
                <View style={styles.modeContainer}>
                  {/* Ingredients Breakdown */}
                  <View style={styles.cardBox}>
                    <View style={styles.cardHeader}>
                      <MaterialCommunityIcons
                        name="tag-outline"
                        size={22}
                        color={theme.colors.primary}
                      />
                      <Text style={styles.cardTitle}>Custo por Ingrediente</Text>
                    </View>

                    {recipe.ingredients && recipe.ingredients.length > 0 ? (
                      recipe.ingredients.map((item, index) => {
                        const ingName = Array.isArray(item.ingredient?.name)
                          ? item.ingredient.name.join(', ')
                          : item.ingredient?.name || 'Ingrediente';

                        return (
                          <View key={item.ingredientId || index} style={styles.pricingRow}>
                            <Text style={styles.pricingItemName}>
                              {item.baseQuantity} {item.measurementUnit} • {ingName}
                            </Text>
                            <Text style={styles.pricingItemValue}>R$ --,--</Text>
                          </View>
                        );
                      })
                    ) : (
                      <Text style={styles.emptyCardText}>Sem ingredientes listados.</Text>
                    )}
                  </View>

                  {/* Cost Summary Card */}
                  <View style={styles.cardBox}>
                    <View style={styles.cardHeader}>
                      <MaterialCommunityIcons
                        name="calculator-variant-outline"
                        size={22}
                        color={theme.colors.primary}
                      />
                      <Text style={styles.cardTitle}>Custos Operacionais</Text>
                    </View>

                    <View style={styles.pricingRow}>
                      <Text style={styles.pricingItemName}>Custo total de ingredientes:</Text>
                      <Text style={styles.pricingItemValue}>R$ --,--</Text>
                    </View>

                    {recipe.packagingCost && (
                      <View style={styles.pricingRow}>
                        <Text style={styles.pricingItemName}>Embalagem:</Text>
                        <Text style={styles.pricingItemValue}>R$ {recipe.packagingCost}</Text>
                      </View>
                    )}

                    {recipe.overhead && (
                      <View style={styles.pricingRow}>
                        <Text style={styles.pricingItemName}>Custos fixos / overhead:</Text>
                        <Text style={styles.pricingItemValue}>R$ {recipe.overhead}</Text>
                      </View>
                    )}

                    {recipe.hourlyLabor && (
                      <View style={styles.pricingRow}>
                        <Text style={styles.pricingItemName}>Mão de obra:</Text>
                        <Text style={styles.pricingItemValue}>R$ {recipe.hourlyLabor}/h</Text>
                      </View>
                    )}
                  </View>

                  {/* Markup & Selling Price Suggestion Card */}
                  <View style={styles.suggestionHighlightCard}>
                    <View style={styles.cardHeader}>
                      <MaterialCommunityIcons
                        name="star-circle-outline"
                        size={22}
                        color={theme.colors.primary}
                      />
                      <Text style={styles.cardTitle}>Sugestão de Preço</Text>
                    </View>

                    <View style={styles.markupDetailsRow}>
                      <Text style={styles.markupLabel}>Margem de Lucro Desejada:</Text>
                      <Text style={styles.markupValueHighlight}>
                        {recipe.profitMargin ? `${recipe.profitMargin}%` : 'Não definida'}
                      </Text>
                    </View>

                    <View style={styles.priceContainer}>
                      <Text style={styles.priceSubtitle}>Preço de Venda Sugerido (Unidade):</Text>
                      <Text style={styles.priceValueText}>R$ --,--</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
        )}
      </View>
    </>
  );
}

const createStyles = (theme: AppTheme, isDesktop: boolean, isSmallScreen: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
      width: '100%',
    },
    scrollContent: {
      paddingHorizontal: isDesktop ? 24 : 16,
      paddingTop: 16,
      paddingBottom: 60,
      alignItems: 'center',
    },
    innerWrapper: {
      width: '100%',
      maxWidth: 720,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 80,
    },
    notFoundContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
      gap: 12,
    },
    notFoundTitle: {
      fontFamily: 'Playfair Display SC',
      fontSize: 22,
      fontWeight: 'bold',
      color: theme.colors.text,
      textAlign: 'center',
    },
    notFoundSubtitle: {
      fontFamily: 'Inter',
      fontSize: 14,
      color: theme.colors.text,
      opacity: 0.8,
      textAlign: 'center',
    },
    backButton: {
      marginTop: 12,
      backgroundColor: theme.colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backButtonText: {
      color: theme.colors.secondaryText,
      fontFamily: 'Inter',
      fontSize: 15,
      fontWeight: '600',
    },

    // Hero Cover or Placeholder
    heroImage: {
      width: '100%',
      aspectRatio: 16 / 9,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.secBorder,
      marginBottom: 20,
    },
    heroPlaceholder: {
      width: '100%',
      aspectRatio: 16 / 9,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.secBorder,
      backgroundColor: theme.colors.pitchBackground,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
      gap: 8,
    },
    heroPlaceholderBadge: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: theme.colors.secondary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    heroPlaceholderTitle: {
      fontFamily: 'Playfair Display SC',
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    heroPlaceholderSubtitle: {
      fontFamily: 'Inter',
      fontSize: 12,
      color: theme.colors.text,
      opacity: 0.7,
    },

    // Header Details
    headerSection: {
      marginBottom: 20,
      gap: 10,
    },
    primaryTitle: {
      color: theme.colors.text,
      fontFamily: 'Playfair Display SC',
      fontSize: 26,
      lineHeight: 32,
      fontWeight: 'bold',
    },
    metaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    metaBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.pitchBackground,
      borderWidth: 1,
      borderColor: theme.colors.secBorder,
      paddingVertical: 5,
      paddingHorizontal: 12,
      borderRadius: 9999,
      gap: 6,
    },
    metaBadgeText: {
      fontFamily: 'Inter',
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.text,
    },
    tagsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 2,
    },
    tagPill: {
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 9999,
    },
    tagPillText: {
      fontFamily: 'Inter',
      fontSize: 12,
      fontWeight: 'bold',
      color: theme.colors.text,
    },

    // Segmented Mode Switcher
    segmentedControl: {
      flexDirection: 'row',
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.secBorder,
      borderRadius: 12,
      padding: 4,
      marginBottom: 20,
      gap: 6,
    },
    segmentButton: {
      flex: 1,
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
      gap: 8,
      paddingHorizontal: 8,
    },
    segmentButtonActive: {
      backgroundColor: theme.colors.primary,
    },
    segmentButtonText: {
      fontFamily: 'Inter',
      fontSize: isSmallScreen ? 12 : 14,
      fontWeight: '600',
      color: theme.colors.text,
    },
    segmentButtonTextActive: {
      color: theme.colors.secondaryText,
    },

    modeContainer: {
      width: '100%',
      gap: 16,
    },

    // Cards (Flat-First)
    cardBox: {
      backgroundColor: theme.colors.pitchBackground,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.secBorder,
      padding: 18,
      gap: 12,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.secBorder,
      paddingBottom: 10,
    },
    cardTitle: {
      fontFamily: 'Playfair Display SC',
      fontSize: 19,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    emptyCardText: {
      fontFamily: 'Inter',
      fontSize: 14,
      fontStyle: 'italic',
      color: theme.colors.placeholder,
      textAlign: 'center',
      paddingVertical: 12,
    },

    // Ingredient Row
    ingredientRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      minHeight: 48,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.lightGray,
    },
    ingredientLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      paddingRight: 12,
      gap: 12,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderWidth: 1.5,
      borderColor: theme.colors.primary,
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.pitchBackground,
    },
    checkedCheckbox: {
      backgroundColor: theme.colors.primary,
    },
    ingredientName: {
      fontFamily: 'Inter',
      fontSize: 14,
      color: theme.colors.text,
      flexShrink: 1,
    },
    checkedIngredientText: {
      textDecorationLine: 'line-through',
      opacity: 0.5,
    },
    ingredientQuantity: {
      fontFamily: 'Inter',
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.colors.text,
    },

    // Preparation Step Row
    stepRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      paddingVertical: 6,
    },
    stepBadge: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.colors.secondary,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    stepText: {
      fontFamily: 'Inter',
      fontWeight: 'bold',
      fontSize: 14,
      color: theme.colors.primary,
    },
    stepContent: {
      flex: 1,
      fontFamily: 'Inter',
      fontSize: 14,
      lineHeight: 22,
      color: theme.colors.text,
    },

    // Pricing Row
    pricingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.lightGray,
    },
    pricingItemName: {
      fontFamily: 'Inter',
      fontSize: 14,
      color: theme.colors.text,
      flex: 1,
    },
    pricingItemValue: {
      fontFamily: 'Inter',
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginLeft: 10,
    },

    // Suggested Price Card
    suggestionHighlightCard: {
      backgroundColor: theme.colors.pitchBackground,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.secBorder,
      padding: 18,
      gap: 12,
    },
    markupDetailsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 6,
    },
    markupLabel: {
      fontFamily: 'Inter',
      fontSize: 14,
      color: theme.colors.text,
    },
    markupValueHighlight: {
      fontFamily: 'Inter',
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    priceContainer: {
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.secBorder,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      gap: 4,
      marginTop: 4,
    },
    priceSubtitle: {
      fontFamily: 'Inter',
      fontSize: 13,
      color: theme.colors.text,
      opacity: 0.8,
    },
    priceValueText: {
      fontFamily: 'Playfair Display SC',
      fontSize: 26,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
  });
