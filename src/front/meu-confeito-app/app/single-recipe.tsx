import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

import { Image } from 'expo-image';
import { Stack, router, useFocusEffect, useLocalSearchParams } from 'expo-router';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useAuth } from '@/src/contexts/AuthContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { useSingleRecipe } from '@/src/hooks/useRecipes';
import { AppTheme } from '@/src/theme/themes';
import { PartialTag, RecipeItem, RecipeStatus } from '@/src/types';

export default function RecipeScreen() {
  const { theme } = useThemeMode();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const { recipeId } = useLocalSearchParams() as { recipeId: string };
  const { recipe, isLoading, updateVisibility, isUpdatingVisibility, refetch } = useSingleRecipe(
    recipeId,
    user?.id,
  );

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

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

  const isOwner = Boolean(user?.id && recipe?.userId && user.id === recipe.userId);

  const recipeItems: RecipeItem[] = useMemo(
    () => recipe?.items || (recipe as { ingredients?: RecipeItem[] })?.ingredients || [],
    [recipe],
  );

  const recipeTags = useMemo(() => {
    const rawTags = (recipe as { tags?: { tag: PartialTag }[] })?.tags;
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
    if (typeof recipe.instructions === 'object' && recipe.instructions !== null) {
      const inst = recipe.instructions as { steps?: { text?: string }[] };
      if (Array.isArray(inst.steps)) {
        return inst.steps
          .map((step) => (typeof step === 'string' ? step : step?.text || ''))
          .filter(Boolean);
      }
    }
    if (Array.isArray(recipe.instructions)) {
      return (recipe.instructions as unknown[])
        .map((step) =>
          typeof step === 'string'
            ? step
            : (step as { text?: string })?.text || JSON.stringify(step),
        )
        .filter(Boolean);
    }
    if (typeof recipe.instructions === 'string') {
      return [recipe.instructions];
    }
    return [];
  }, [recipe]);

  // Financial Calculations based on API inventory items
  const financialMetrics = useMemo(() => {
    const totalItemCost = recipeItems.reduce((acc, item) => {
      const qty = Number(item.quantity) || 0;
      const unitCost = item.inventory ? Number(item.inventory.costPerBaseUnit) : 0;
      return acc + qty * unitCost;
    }, 0);

    const hasAnyInventory = recipeItems.some(
      (item) => item.inventory && Number(item.inventory.costPerBaseUnit) > 0,
    );

    const packaging = Number(recipe?.packagingCost) || 0;
    const laborRate = Number(recipe?.hourlyLabor) || 0;
    const prepMinutes = Number(recipe?.prepTimeMinutes) || 0;
    const laborCost = (laborRate * prepMinutes) / 60;
    const directCosts = totalItemCost + packaging + laborCost;

    const overheadPct = Number(recipe?.overhead) || 0;
    const overheadCost = directCosts * (overheadPct / 100);

    const totalRecipeCost = directCosts + overheadCost;
    const yieldNum = Number(recipe?.baseYield) || 1;
    const unitCost = totalRecipeCost / yieldNum;

    const profitPct = Number(recipe?.profitMargin) || 0;
    const suggestedUnitPrice = unitCost * (1 + profitPct / 100);
    const suggestedTotalPrice = suggestedUnitPrice * yieldNum;

    return {
      totalItemCost,
      packagingCost: packaging,
      laborCost,
      overheadCost,
      totalRecipeCost,
      unitCost,
      suggestedUnitPrice,
      suggestedTotalPrice,
      hasAnyInventory,
    };
  }, [recipe, recipeItems]);

  const handleToggleVisibility = async (newStatus: RecipeStatus) => {
    try {
      await updateVisibility(newStatus);
      const statusMessage =
        newStatus === 'PUBLISHED'
          ? 'Sua receita agora está publicada na comunidade!'
          : newStatus === 'ARCHIVED'
            ? 'Sua receita foi arquivada com sucesso.'
            : 'Sua receita agora está como rascunho.';
      Alert.alert('Status Atualizado', statusMessage);
    } catch (err: unknown) {
      const apiErr = err as {
        response?: { data?: { code?: string; message?: string } };
        message?: string;
      };
      if (apiErr?.response?.data?.code === 'USER_PHONE_NUMBER_REQUIRED') {
        Alert.alert(
          'Telefone Obrigatório',
          'Para publicar receitas na comunidade, é necessário ter um número de telefone cadastrado no seu perfil.',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Editar Perfil',
              onPress: () => router.push('/edit-profile'),
            },
          ],
        );
      } else {
        const msg =
          apiErr?.response?.data?.message ||
          apiErr?.message ||
          'Não foi possível atualizar o status da receita.';
        Alert.alert('Erro', msg);
      }
    }
  };

  const handleArchiveRecipe = () => {
    Alert.alert(
      'Arquivar Receita',
      'Tem certeza de que deseja arquivar esta receita? Ela não ficará visível publicamente na comunidade.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Arquivar',
          style: 'destructive',
          onPress: () => handleToggleVisibility('ARCHIVED'),
        },
      ],
    );
  };

  const handleUnarchiveRecipe = () => {
    Alert.alert(
      'Restaurar Receita',
      'Deseja reativar esta receita? Ela voltará para o status de Rascunho.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restaurar',
          onPress: () => handleToggleVisibility('DRAFT'),
        },
      ],
    );
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'PUBLISHED':
        return {
          label: 'Pública',
          icon: 'earth' as const,
          color: theme.colors.success || '#2E7D32',
          bgColor: '#E8F5E9',
        };
      case 'ARCHIVED':
        return {
          label: 'Arquivada',
          icon: 'archive-outline' as const,
          color: theme.colors.placeholder,
          bgColor: theme.colors.lightGray,
        };
      case 'DRAFT':
      default:
        return {
          label: 'Rascunho',
          icon: 'file-document-edit-outline' as const,
          color: theme.colors.primary,
          bgColor: theme.colors.secondary,
        };
    }
  };

  const statusBadge = getStatusBadge(recipe?.status);

  return (
    <>
      <Stack.Screen
        options={{
          title: recipe?.title || 'Receita',
          headerRight:
            isOwner && recipe
              ? () => (
                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: '/edit-recipe',
                        params: { recipeId: recipe.id },
                      })
                    }
                    style={styles.headerEditBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Editar receita"
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MaterialCommunityIcons
                      name="pencil-outline"
                      size={22}
                      color={theme.colors.primary}
                    />
                  </TouchableOpacity>
                )
              : undefined,
        }}
      />

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
              accessibilityRole="button"
              accessibilityLabel="Voltar"
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

              {/* Title, Meta, Status and Tags Header */}
              <View style={styles.headerSection}>
                <View style={styles.titleRow}>
                  <Text style={styles.primaryTitle}>{recipe.title}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusBadge.bgColor }]}>
                    <MaterialCommunityIcons
                      name={statusBadge.icon}
                      size={14}
                      color={statusBadge.color}
                    />
                    <Text style={[styles.statusBadgeText, { color: statusBadge.color }]}>
                      {statusBadge.label}
                    </Text>
                  </View>
                </View>

                <View style={styles.metaRow}>
                  {Boolean(recipe.baseYield) && (
                    <View style={styles.metaBadge}>
                      <MaterialCommunityIcons
                        name="silverware-fork-knife"
                        size={15}
                        color={theme.colors.text}
                      />
                      <Text style={styles.metaBadgeText}>
                        Rende {recipe.baseYield} {recipe.yieldUnit || 'UN'}
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
                    {recipeTags.map((item: { tag: PartialTag; backgroundColor: string }) => (
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

              {/* Owner Action Panel */}
              {isOwner && (
                <View style={styles.ownerControlCard}>
                  <View style={styles.ownerControlHeader}>
                    <View style={styles.ownerControlTitleGroup}>
                      <MaterialCommunityIcons
                        name="cog-outline"
                        size={18}
                        color={theme.colors.primary}
                      />
                      <Text style={styles.ownerControlTitle}>Painel da Receita</Text>
                    </View>
                    {isUpdatingVisibility && (
                      <ActivityIndicator size="small" color={theme.colors.primary} />
                    )}
                  </View>

                  <View style={styles.ownerActionButtons}>
                    {/* Botão Editar */}
                    <TouchableOpacity
                      style={styles.btnActionEdit}
                      onPress={() =>
                        router.push({
                          pathname: '/edit-recipe',
                          params: { recipeId: recipe.id },
                        })
                      }
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel="Editar informações da receita"
                    >
                      <MaterialCommunityIcons
                        name="pencil-outline"
                        size={18}
                        color={theme.colors.primary}
                      />
                      <Text style={styles.btnActionTextEdit}>Editar</Text>
                    </TouchableOpacity>

                    {/* Botão Publicar / Despublicar */}
                    {recipe.status === 'PUBLISHED' ? (
                      <TouchableOpacity
                        style={styles.btnActionDraft}
                        onPress={() => handleToggleVisibility('DRAFT')}
                        disabled={isUpdatingVisibility}
                        activeOpacity={0.8}
                        accessibilityRole="button"
                        accessibilityLabel="Mudar receita para rascunho"
                      >
                        <MaterialCommunityIcons
                          name="lock-outline"
                          size={18}
                          color={theme.colors.text}
                        />
                        <Text style={styles.btnActionTextDraft}>Despublicar</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.btnActionPublish}
                        onPress={() => handleToggleVisibility('PUBLISHED')}
                        disabled={isUpdatingVisibility}
                        activeOpacity={0.8}
                        accessibilityRole="button"
                        accessibilityLabel="Publicar receita na comunidade"
                      >
                        <MaterialCommunityIcons
                          name="earth"
                          size={18}
                          color={theme.colors.secondaryText}
                        />
                        <Text style={styles.btnActionTextPublish}>Publicar</Text>
                      </TouchableOpacity>
                    )}

                    {/* Botão Arquivar / Restaurar */}
                    {recipe.status === 'ARCHIVED' ? (
                      <TouchableOpacity
                        style={styles.btnActionUnarchive}
                        onPress={handleUnarchiveRecipe}
                        disabled={isUpdatingVisibility}
                        activeOpacity={0.8}
                        accessibilityRole="button"
                        accessibilityLabel="Restaurar receita arquivada"
                      >
                        <MaterialCommunityIcons
                          name="archive-arrow-up-outline"
                          size={18}
                          color={theme.colors.primary}
                        />
                        <Text style={styles.btnActionTextUnarchive}>Restaurar</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.btnActionArchive}
                        onPress={handleArchiveRecipe}
                        disabled={isUpdatingVisibility}
                        activeOpacity={0.8}
                        accessibilityRole="button"
                        accessibilityLabel="Arquivar receita"
                      >
                        <MaterialCommunityIcons
                          name="archive-arrow-down-outline"
                          size={18}
                          color={theme.colors.text}
                        />
                        <Text style={styles.btnActionTextArchive}>Arquivar</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}

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
                  {/* Items Card */}
                  <View style={styles.cardBox}>
                    <View style={styles.cardHeader}>
                      <MaterialCommunityIcons
                        name="format-list-checks"
                        size={22}
                        color={theme.colors.primary}
                      />
                      <Text style={styles.cardTitle}>Itens da Receita</Text>
                    </View>

                    {recipeItems.length > 0 ? (
                      recipeItems.map((item, index) => {
                        const itemId = item.id || String(index);
                        const isIngredientChecked = Boolean(checkedIngredientMap[itemId]);
                        const isSubRecipe = Boolean(item.subRecipe);
                        const itemName = isSubRecipe
                          ? item.subRecipe?.title || 'Sub-receita'
                          : item.ingredient?.name || 'Ingrediente';

                        const formattedQuantity =
                          item.displayQuantity && item.displayUnit
                            ? `${item.displayQuantity} ${item.displayUnit} (${item.quantity} ${item.unit})`
                            : `${item.quantity} ${item.unit}`;

                        return (
                          <TouchableOpacity
                            key={itemId}
                            style={styles.ingredientRow}
                            onPress={() => toggleIngredient(itemId)}
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
                              <View style={styles.ingredientTextGroup}>
                                <View style={styles.ingredientTitleRow}>
                                  <Text
                                    style={[
                                      styles.ingredientName,
                                      isIngredientChecked && styles.checkedIngredientText,
                                    ]}
                                  >
                                    {itemName}
                                  </Text>
                                  {isSubRecipe && (
                                    <View style={styles.subRecipeBadge}>
                                      <Text style={styles.subRecipeBadgeText}>Sub-receita</Text>
                                    </View>
                                  )}
                                </View>
                                {Boolean(item.notes) && (
                                  <Text style={styles.ingredientNotes}>{item.notes}</Text>
                                )}
                              </View>
                            </View>
                            <Text style={styles.ingredientQuantity}>{formattedQuantity}</Text>
                          </TouchableOpacity>
                        );
                      })
                    ) : (
                      <Text style={styles.emptyCardText}>Nenhum item informado.</Text>
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
                  {/* Items Cost Breakdown */}
                  <View style={styles.cardBox}>
                    <View style={styles.cardHeader}>
                      <MaterialCommunityIcons
                        name="tag-outline"
                        size={22}
                        color={theme.colors.primary}
                      />
                      <Text style={styles.cardTitle}>Custo por Insumo (Estoque)</Text>
                    </View>

                    {recipeItems.length > 0 ? (
                      recipeItems.map((item, index) => {
                        const itemName = item.ingredient?.name || item.subRecipe?.title || 'Insumo';
                        const hasCost =
                          item.inventory && Number(item.inventory.costPerBaseUnit) > 0;
                        const costValue = hasCost
                          ? (Number(item.quantity) * Number(item.inventory!.costPerBaseUnit))
                              .toFixed(2)
                              .replace('.', ',')
                          : null;

                        return (
                          <View key={item.id || index} style={styles.pricingRow}>
                            <View style={styles.pricingLeft}>
                              <Text style={styles.pricingItemName}>
                                {item.quantity} {item.unit} • {itemName}
                              </Text>
                              {!hasCost && (
                                <Text style={styles.pricingWarningText}>
                                  Sem custo registrado no estoque
                                </Text>
                              )}
                            </View>
                            <Text
                              style={[
                                styles.pricingItemValue,
                                !hasCost && styles.pricingItemValueMissing,
                              ]}
                            >
                              {hasCost ? `R$ ${costValue}` : 'R$ --,--'}
                            </Text>
                          </View>
                        );
                      })
                    ) : (
                      <Text style={styles.emptyCardText}>Sem insumos listados.</Text>
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
                      <Text style={styles.pricingItemName}>Insumos / Ingredientes:</Text>
                      <Text style={styles.pricingItemValue}>
                        R$ {financialMetrics.totalItemCost.toFixed(2).replace('.', ',')}
                      </Text>
                    </View>

                    {financialMetrics.packagingCost > 0 && (
                      <View style={styles.pricingRow}>
                        <Text style={styles.pricingItemName}>Embalagem:</Text>
                        <Text style={styles.pricingItemValue}>
                          R$ {financialMetrics.packagingCost.toFixed(2).replace('.', ',')}
                        </Text>
                      </View>
                    )}

                    {financialMetrics.laborCost > 0 && (
                      <View style={styles.pricingRow}>
                        <Text style={styles.pricingItemName}>
                          Mão de obra ({recipe.prepTimeMinutes} min @ R${' '}
                          {Number(recipe.hourlyLabor).toFixed(2)}/h):
                        </Text>
                        <Text style={styles.pricingItemValue}>
                          R$ {financialMetrics.laborCost.toFixed(2).replace('.', ',')}
                        </Text>
                      </View>
                    )}

                    {financialMetrics.overheadCost > 0 && (
                      <View style={styles.pricingRow}>
                        <Text style={styles.pricingItemName}>
                          Custos fixos / overhead ({recipe.overhead}%):
                        </Text>
                        <Text style={styles.pricingItemValue}>
                          R$ {financialMetrics.overheadCost.toFixed(2).replace('.', ',')}
                        </Text>
                      </View>
                    )}

                    <View style={[styles.pricingRow, styles.totalRow]}>
                      <Text style={styles.totalLabel}>Custo Total de Produção:</Text>
                      <Text style={styles.totalValue}>
                        R$ {financialMetrics.totalRecipeCost.toFixed(2).replace('.', ',')}
                      </Text>
                    </View>

                    <View style={styles.pricingRow}>
                      <Text style={styles.pricingItemName}>
                        Custo Unitário ({recipe.baseYield} {recipe.yieldUnit || 'UN'}):
                      </Text>
                      <Text style={styles.pricingItemValue}>
                        R$ {financialMetrics.unitCost.toFixed(2).replace('.', ',')}
                      </Text>
                    </View>
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
                      <Text style={styles.priceValueText}>
                        R$ {financialMetrics.suggestedUnitPrice.toFixed(2).replace('.', ',')}
                      </Text>
                    </View>

                    <View style={styles.priceSubContainer}>
                      <Text style={styles.priceSubText}>
                        Preço Total da Receita:{' '}
                        <Text style={styles.priceSubTextBold}>
                          R$ {financialMetrics.suggestedTotalPrice.toFixed(2).replace('.', ',')}
                        </Text>
                      </Text>
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
    titleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 12,
    },
    primaryTitle: {
      flex: 1,
      color: theme.colors.text,
      fontFamily: 'Playfair Display SC',
      fontSize: 26,
      lineHeight: 32,
      fontWeight: 'bold',
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: 9999,
      gap: 5,
    },
    statusBadgeText: {
      fontFamily: 'Inter',
      fontSize: 12,
      fontWeight: '700',
    },
    headerEditBtn: {
      minWidth: 48,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 8,
    },
    ownerControlCard: {
      backgroundColor: theme.colors.pitchBackground,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.secBorder,
      padding: 14,
      marginBottom: 20,
      gap: 12,
    },
    ownerControlHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    ownerControlTitleGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    ownerControlTitle: {
      fontFamily: 'Inter',
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    ownerActionButtons: {
      flexDirection: isSmallScreen ? 'column' : 'row',
      gap: 8,
    },
    btnActionEdit: {
      flex: 1,
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.primary,
      borderRadius: 8,
      paddingHorizontal: 12,
      gap: 6,
    },
    btnActionTextEdit: {
      fontFamily: 'Inter',
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    btnActionPublish: {
      flex: 1.2,
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
      paddingHorizontal: 12,
      gap: 6,
    },
    btnActionTextPublish: {
      fontFamily: 'Inter',
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.secondaryText,
    },
    btnActionDraft: {
      flex: 1.2,
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.secBorder,
      borderRadius: 8,
      paddingHorizontal: 12,
      gap: 6,
    },
    btnActionTextDraft: {
      fontFamily: 'Inter',
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.text,
    },
    btnActionArchive: {
      flex: 1,
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.lightGray,
      borderRadius: 8,
      paddingHorizontal: 12,
      gap: 6,
    },
    btnActionTextArchive: {
      fontFamily: 'Inter',
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.text,
    },
    btnActionUnarchive: {
      flex: 1,
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.secondary,
      borderRadius: 8,
      paddingHorizontal: 12,
      gap: 6,
    },
    btnActionTextUnarchive: {
      fontFamily: 'Inter',
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.primary,
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

    // Item Row
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
    ingredientTextGroup: {
      flex: 1,
    },
    ingredientTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 6,
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
    subRecipeBadge: {
      backgroundColor: theme.colors.secondary,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 9999,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    subRecipeBadgeText: {
      fontFamily: 'Inter',
      fontSize: 10,
      fontWeight: '700',
      color: theme.colors.text,
    },
    ingredientNotes: {
      fontFamily: 'Inter',
      fontSize: 12,
      color: theme.colors.placeholder,
      marginTop: 2,
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
    pricingLeft: {
      flex: 1,
    },
    pricingItemName: {
      fontFamily: 'Inter',
      fontSize: 14,
      color: theme.colors.text,
    },
    pricingWarningText: {
      fontFamily: 'Inter',
      fontSize: 11,
      color: theme.colors.primary,
      marginTop: 2,
    },
    pricingItemValue: {
      fontFamily: 'Inter',
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginLeft: 10,
    },
    pricingItemValueMissing: {
      color: theme.colors.placeholder,
    },
    totalRow: {
      borderTopWidth: 1.5,
      borderTopColor: theme.colors.secBorder,
      paddingTop: 12,
      marginTop: 4,
    },
    totalLabel: {
      fontFamily: 'Inter',
      fontSize: 15,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    totalValue: {
      fontFamily: 'Inter',
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.primary,
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
    priceSubContainer: {
      alignItems: 'center',
      paddingTop: 4,
    },
    priceSubText: {
      fontFamily: 'Inter',
      fontSize: 13,
      color: theme.colors.text,
      opacity: 0.85,
    },
    priceSubTextBold: {
      fontWeight: 'bold',
      color: theme.colors.text,
    },
  });
