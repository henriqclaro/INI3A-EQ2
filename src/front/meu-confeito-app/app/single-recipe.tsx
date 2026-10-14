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

import { ProduceRecipeModal } from '@/src/components/production';
import {
  CustomizeRecipeModal,
  KitchenModeModal,
  RecipeIngredientsSection,
  RecipeInstructionsSection,
  RecipeReviewsSection,
  RecipeScalerBar,
} from '@/src/components/recipe';
import { useAuth } from '@/src/contexts/AuthContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { useSingleRecipe } from '@/src/hooks/useRecipes';
import { useSavedRecipes } from '@/src/hooks/useSavedRecipes';
import { AppTheme } from '@/src/theme/themes';
import { PartialTag, RecipeInstructionStep, RecipeItem, RecipeStatus } from '@/src/types';
import { getStorageUrl } from '@/src/utils/image';
import { parseRecipeInstructions } from '@/src/utils/recipe';
import { shareRecipeSummary } from '@/src/utils/share';
import { getTagColors } from '@/src/utils/tag';

export type FormattedInstructionStep = RecipeInstructionStep;

export default function RecipeScreen() {
  const { theme } = useThemeMode();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const { recipeId } = useLocalSearchParams() as { recipeId: string };
  const { recipe, isLoading, updateVisibility, isUpdatingVisibility, refetch } = useSingleRecipe(
    recipeId,
    user?.id,
  );
  const { isRecipeSaved, toggleSave, isTogglingSave } = useSavedRecipes(user?.id);
  const hasSavedRecipe = isRecipeSaved(recipeId);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const isDesktop = width >= 768;
  const isSmallScreen = width < 360;

  const [hasImageError, setHasImageError] = useState(false);
  const [viewMode, setViewMode] = useState<'recipe' | 'pricing'>('recipe');
  const [isProduceModalOpen, setIsProduceModalOpen] = useState(false);
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [scaleFactor, setScaleFactor] = useState(1);
  const [isKitchenModeOpen, setIsKitchenModeOpen] = useState(false);

  const handleToggleSave = async () => {
    if (!user) {
      Alert.alert('Login Necessário', 'Faça login para salvar esta receita nas suas favoritas.', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Fazer Login', onPress: () => router.push('/login') },
      ]);
      return;
    }

    await toggleSave(recipeId);
    refetch();
  };

  const handleOpenCustomize = () => {
    if (!user) {
      Alert.alert(
        'Login Necessário',
        'Faça login para personalizar esta receita e salvá-la na sua confeitaria.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Fazer Login', onPress: () => router.push('/login') },
        ],
      );
      return;
    }
    setIsCustomizeModalOpen(true);
  };

  const handleConfirmCustomize = () => {
    setIsCustomizeModalOpen(false);
    router.push({
      pathname: '/create-recipe',
      params: { forkFromId: recipe?.id },
    });
  };

  const styles = useMemo(
    () => createStyles(theme, isDesktop, isSmallScreen),
    [theme, isDesktop, isSmallScreen],
  );

  const resolvedCoverUrl = getStorageUrl(recipe?.coverUrl);
  const hasValidCover = Boolean(resolvedCoverUrl && !hasImageError);

  const isOwner = Boolean(user?.id && recipe?.userId && user.id === recipe.userId);

  const recipeItems: RecipeItem[] = useMemo(
    () => recipe?.items || (recipe as { ingredients?: RecipeItem[] })?.ingredients || [],
    [recipe],
  );

  const scaledRecipeItems: RecipeItem[] = useMemo(() => {
    if (scaleFactor === 1) return recipeItems;
    return recipeItems.map((item) => ({
      ...item,
      quantity: parseFloat((Number(item.quantity) * scaleFactor).toFixed(2)),
      displayQuantity: item.displayQuantity
        ? parseFloat((Number(item.displayQuantity) * scaleFactor).toFixed(2))
        : null,
    }));
  }, [recipeItems, scaleFactor]);

  const handleShareRecipe = useCallback(async () => {
    if (!recipe) return;
    const currentYield = recipe.baseYield
      ? (Number(recipe.baseYield) * scaleFactor).toFixed(2).replace(/\.00$/, '')
      : null;

    await shareRecipeSummary({
      title: recipe.title,
      baseYield: currentYield,
      yieldUnit: recipe.yieldUnit,
      prepTimeMinutes: recipe.prepTimeMinutes,
      items: scaledRecipeItems,
    });
  }, [recipe, scaleFactor, scaledRecipeItems]);

  const recipeTags = useMemo(() => {
    const rawTags = (recipe as { tags?: { tag: PartialTag }[] })?.tags;
    if (!Array.isArray(rawTags)) return [];
    return rawTags.map((item: { tag: PartialTag }) => {
      const tagColors = getTagColors(item?.tag?.type, theme);
      return {
        ...item,
        backgroundColor: tagColors.backgroundColor,
        textColor: tagColors.textColor,
        borderColor: tagColors.borderColor,
      };
    });
  }, [recipe, theme]);

  const parsedInstructions: FormattedInstructionStep[] = useMemo(() => {
    return parseRecipeInstructions(recipe?.instructions);
  }, [recipe?.instructions]);

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
    const suggestedUnitPrice = unitCost / (1 - profitPct / 100);
    //const suggestedUnitPrice = unitCost * (1 + profitPct / 100);
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
          color: theme.colors.chips.success.text,
          bgColor: theme.colors.chips.success.background,
        };
      case 'ARCHIVED':
        return {
          label: 'Arquivada',
          icon: 'archive-outline' as const,
          color: theme.colors.onSurfaceVariant,
          bgColor: theme.colors.surfaceContainerHigh,
        };
      case 'DRAFT':
      default:
        return {
          label: 'Rascunho',
          icon: 'file-document-edit-outline' as const,
          color: theme.colors.chips.primary.text,
          bgColor: theme.colors.chips.primary.background,
        };
    }
  };

  const statusBadge = getStatusBadge(recipe?.status);

  return (
    <>
      <Stack.Screen
        options={{
          title: recipe?.title || 'Receita',
          headerRight: () => (
            <View style={styles.headerRightRow}>
              {recipe && (
                <TouchableOpacity
                  onPress={handleShareRecipe}
                  style={styles.headerShareBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Compartilhar resumo da receita"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialCommunityIcons
                    name="share-variant-outline"
                    size={22}
                    color={theme.colors.primary}
                  />
                </TouchableOpacity>
              )}
              {recipe && (
                <TouchableOpacity
                  onPress={() => setIsKitchenModeOpen(true)}
                  style={styles.headerKitchenBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Abrir modo cozinha com tela ativa"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialCommunityIcons name="chef-hat" size={22} color={theme.colors.primary} />
                </TouchableOpacity>
              )}
              {recipe && user && recipe.status === 'PUBLISHED' && (
                <TouchableOpacity
                  onPress={handleToggleSave}
                  disabled={isTogglingSave}
                  style={styles.headerSaveBtn}
                  accessibilityRole="button"
                  accessibilityLabel={hasSavedRecipe ? 'Remover dos salvos' : 'Salvar receita'}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  {isTogglingSave ? (
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                  ) : (
                    <MaterialCommunityIcons
                      name={hasSavedRecipe ? 'bookmark' : 'bookmark-outline'}
                      size={24}
                      color={theme.colors.primary}
                    />
                  )}
                </TouchableOpacity>
              )}
              {!isOwner && recipe && recipe.status === 'PUBLISHED' && (
                <TouchableOpacity
                  onPress={handleOpenCustomize}
                  style={styles.headerForkBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Personalizar receita"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialCommunityIcons
                    name="source-fork"
                    size={22}
                    color={theme.colors.primary}
                  />
                </TouchableOpacity>
              )}
              {isOwner && recipe && (
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
              )}
            </View>
          ),
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
              <View style={styles.leftColumn}>
                {/* Recipe Cover or Placeholder */}
                {hasValidCover ? (
                  <Image
                    source={{ uri: resolvedCoverUrl }}
                    style={styles.heroImage}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    recyclingKey={resolvedCoverUrl}
                    transition={150}
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
                    {!isDesktop && (
                      <View style={styles.titleBadgesRow}>
                        {Boolean(recipe.parent) && (
                          <View style={styles.forkBadge}>
                            <MaterialCommunityIcons
                              name="source-fork"
                              size={13}
                              color={theme.colors.secondary}
                            />
                            <Text style={styles.forkBadgeText}>Versão Adaptada</Text>
                          </View>
                        )}
                        <View
                          style={[styles.statusBadge, { backgroundColor: statusBadge.bgColor }]}
                        >
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
                    )}
                    <Text style={styles.primaryTitle}>{recipe.title}</Text>
                    {isDesktop && (
                      <View style={styles.titleBadgesRow}>
                        {Boolean(recipe.parent) && (
                          <View style={styles.forkBadge}>
                            <MaterialCommunityIcons
                              name="source-fork"
                              size={13}
                              color={theme.colors.secondary}
                            />
                            <Text style={styles.forkBadgeText}>Versão Adaptada</Text>
                          </View>
                        )}
                        <View
                          style={[styles.statusBadge, { backgroundColor: statusBadge.bgColor }]}
                        >
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
                    )}
                  </View>

                  {/* Parent Recipe Link Banner */}
                  {Boolean(recipe.parent) && (
                    <TouchableOpacity
                      style={styles.parentRecipeBanner}
                      onPress={() =>
                        router.push({
                          pathname: '/single-recipe',
                          params: { recipeId: recipe.parent!.id },
                        })
                      }
                      activeOpacity={0.8}
                      accessibilityRole="link"
                      accessibilityLabel={`Ver receita original: ${recipe.parent?.title || 'Receita original'}`}
                    >
                      <View style={styles.parentRecipeBannerIconWrap}>
                        <MaterialCommunityIcons
                          name="source-fork"
                          size={18}
                          color={theme.colors.primary}
                        />
                      </View>
                      <View style={styles.parentRecipeBannerTextCol}>
                        <Text style={styles.parentRecipeBannerLabel}>
                          Baseada na receita original
                        </Text>
                        <Text style={styles.parentRecipeBannerTitle} numberOfLines={1}>
                          {recipe.parent?.title || 'Visualizar receita original'}
                        </Text>
                      </View>
                      <View style={styles.parentRecipeBannerAction}>
                        <Text style={styles.parentRecipeBannerActionText}>Ver original</Text>
                        <MaterialCommunityIcons
                          name="arrow-top-right"
                          size={15}
                          color={theme.colors.primary}
                        />
                      </View>
                    </TouchableOpacity>
                  )}

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

                    {typeof recipe.totalSaves === 'number' && recipe.totalSaves > 0 && (
                      <View style={styles.metaBadge}>
                        <MaterialCommunityIcons
                          name="bookmark-outline"
                          size={15}
                          color={theme.colors.primary}
                        />
                        <Text style={styles.metaBadgeText}>
                          {recipe.totalSaves} {recipe.totalSaves === 1 ? 'salvo' : 'salvos'}
                        </Text>
                      </View>
                    )}
                  </View>

                  {recipeTags.length > 0 && (
                    <View style={styles.tagsRow}>
                      {recipeTags.map(
                        (item: {
                          tag: PartialTag;
                          backgroundColor: string;
                          textColor: string;
                          borderColor: string;
                        }) => (
                          <View
                            key={item?.tag?.id || item?.tag?.name}
                            style={[
                              styles.tagPill,
                              {
                                backgroundColor: item.backgroundColor,
                                borderColor: item.borderColor,
                              },
                            ]}
                          >
                            <Text style={[styles.tagPillText, { color: item.textColor }]}>
                              {item?.tag?.name}
                            </Text>
                          </View>
                        ),
                      )}
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

                    {/* Primary Action: Produzir */}
                    <TouchableOpacity
                      style={styles.btnActionProduce}
                      onPress={() => setIsProduceModalOpen(true)}
                      activeOpacity={0.85}
                      accessibilityRole="button"
                      accessibilityLabel="Registrar produção desta receita"
                    >
                      <MaterialCommunityIcons
                        name="pot-steam"
                        size={20}
                        color={theme.colors.onPrimary}
                      />
                      <Text style={styles.btnActionTextProduce}>Produzir Receita</Text>
                    </TouchableOpacity>

                    <View style={styles.ownerActionButtons}>
                      {/* Botão Compartilhar */}
                      <TouchableOpacity
                        style={styles.btnActionShare}
                        onPress={handleShareRecipe}
                        activeOpacity={0.8}
                        accessibilityRole="button"
                        accessibilityLabel="Compartilhar resumo da receita"
                      >
                        <MaterialCommunityIcons
                          name="share-variant-outline"
                          size={18}
                          color={theme.colors.primary}
                        />
                        <Text style={styles.btnActionTextShare}>Compartilhar</Text>
                      </TouchableOpacity>

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
                            color={theme.colors.onSurfaceVariant}
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
                            color={theme.colors.onTertiary}
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
                            color={theme.colors.onPrimaryContainer}
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
                            color={theme.colors.onSurfaceVariant}
                          />
                          <Text style={styles.btnActionTextArchive}>Arquivar</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Link para histórico de produções */}
                    <TouchableOpacity
                      style={styles.historyLinkBtn}
                      onPress={() =>
                        router.push({
                          pathname: '/productions',
                          params: { recipeId: recipe.id },
                        })
                      }
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel="Ver produções anteriores desta receita"
                    >
                      <MaterialCommunityIcons
                        name="history"
                        size={18}
                        color={theme.colors.primary}
                      />
                      <Text style={styles.historyLinkText}>
                        Ver histórico de produções desta receita
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {!isOwner && recipe.status === 'PUBLISHED' && (
                  <View style={styles.guestProduceCard}>
                    <View style={styles.guestProduceHeader}>
                      <View style={styles.guestProduceTitleGroup}>
                        <MaterialCommunityIcons
                          name="earth"
                          size={18}
                          color={theme.colors.primary}
                        />
                        <Text style={styles.guestProduceTitle}>Receita da Comunidade</Text>
                      </View>
                      <View style={styles.guestProduceBadge}>
                        <Text style={styles.guestProduceBadgeText}>Pública</Text>
                      </View>
                    </View>

                    <Text style={styles.guestProduceSubtitle}>
                      {hasSavedRecipe
                        ? 'Esta receita está salva nas suas favoritas. Você pode produzi-la ou criar sua versão personalizada.'
                        : 'Salve nas suas favoritas, produza usando seus insumos ou personalize para criar sua própria versão.'}
                    </Text>

                    {/* Primary Action: Produzir */}
                    <TouchableOpacity
                      style={styles.btnActionProduceGuest}
                      onPress={() => setIsProduceModalOpen(true)}
                      activeOpacity={0.85}
                      accessibilityRole="button"
                      accessibilityLabel="Registrar produção desta receita pública"
                    >
                      <MaterialCommunityIcons
                        name="pot-steam"
                        size={20}
                        color={theme.colors.onPrimary}
                      />
                      <Text style={styles.btnActionTextProduceGuest}>Produzir Receita</Text>
                    </TouchableOpacity>

                    {/* Secondary Actions: Personalizar & Salvar */}
                    <View style={styles.guestSecondaryActions}>
                      <TouchableOpacity
                        style={styles.btnActionCustomizeGuest}
                        onPress={handleOpenCustomize}
                        activeOpacity={0.85}
                        accessibilityRole="button"
                        accessibilityLabel="Personalizar e criar sua versão desta receita"
                      >
                        <MaterialCommunityIcons
                          name="source-fork"
                          size={18}
                          color={theme.colors.primary}
                        />
                        <Text style={styles.btnActionTextCustomizeGuest}>Personalizar</Text>
                      </TouchableOpacity>

                      {user && (
                        <TouchableOpacity
                          style={[
                            styles.btnActionSaveGuest,
                            hasSavedRecipe && styles.btnActionSaveGuestActive,
                          ]}
                          onPress={handleToggleSave}
                          disabled={isTogglingSave}
                          activeOpacity={0.8}
                          accessibilityRole="button"
                          accessibilityLabel={
                            hasSavedRecipe
                              ? 'Remover receita dos salvos'
                              : 'Salvar receita nos favoritos'
                          }
                        >
                          {isTogglingSave ? (
                            <ActivityIndicator
                              size="small"
                              color={
                                hasSavedRecipe
                                  ? theme.colors.onPrimaryContainer
                                  : theme.colors.primary
                              }
                            />
                          ) : (
                            <>
                              <MaterialCommunityIcons
                                name={hasSavedRecipe ? 'bookmark-check' : 'bookmark-outline'}
                                size={18}
                                color={
                                  hasSavedRecipe
                                    ? theme.colors.onPrimaryContainer
                                    : theme.colors.primary
                                }
                              />
                              <Text
                                style={[
                                  styles.btnActionTextSaveGuest,
                                  hasSavedRecipe && styles.btnActionTextSaveGuestActive,
                                ]}
                              >
                                {hasSavedRecipe ? 'Salva' : 'Salvar'}
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}

                      {/* Botão Compartilhar */}
                      <TouchableOpacity
                        style={styles.btnActionShareGuest}
                        onPress={handleShareRecipe}
                        activeOpacity={0.85}
                        accessibilityRole="button"
                        accessibilityLabel="Compartilhar resumo da receita"
                      >
                        <MaterialCommunityIcons
                          name="share-variant-outline"
                          size={18}
                          color={theme.colors.primary}
                        />
                        <Text style={styles.btnActionTextShareGuest}>Compartilhar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.rightColumn}>
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
                      color={
                        viewMode === 'recipe'
                          ? theme.colors.onPrimary
                          : theme.colors.onSurfaceVariant
                      }
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
                      color={
                        viewMode === 'pricing'
                          ? theme.colors.onPrimary
                          : theme.colors.onSurfaceVariant
                      }
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
                    <RecipeScalerBar
                      baseYield={Number(recipe.baseYield) || 1}
                      yieldUnit={recipe.yieldUnit || 'UN'}
                      scaleFactor={scaleFactor}
                      onScaleChange={setScaleFactor}
                    />
                    <RecipeIngredientsSection recipeItems={scaledRecipeItems} />
                    <RecipeInstructionsSection instructions={parsedInstructions} />
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
                          const itemName =
                            item.ingredient?.name || item.subRecipe?.title || 'Insumo';
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
            </View>

            <View style={styles.bottomSectionWrapper}>
              <RecipeReviewsSection
                recipeId={recipe.id}
                recipeTitle={recipe.title}
                isPublished={recipe.status === 'PUBLISHED'}
                isOwner={isOwner}
                initialUserReview={recipe.userReview}
                initialTotalReviews={recipe.totalReviews}
                initialAverageRating={recipe.averageRating}
                initialRatingCounts={recipe.ratingCounts}
                onReviewChanged={refetch}
              />
            </View>
          </ScrollView>
        )}

        {recipe && (
          <ProduceRecipeModal
            isVisible={isProduceModalOpen}
            recipe={recipe}
            onClose={() => setIsProduceModalOpen(false)}
            onSuccess={(production) => {
              setIsProduceModalOpen(false);
              refetch();
              Alert.alert(
                'Produção Registrada!',
                `Foram produzidos ${production.yieldProduced} ${recipe.yieldUnit || 'unidade(s)'} com sucesso. O estoque foi debitado.`,
                [
                  { text: 'OK', style: 'cancel' },
                  {
                    text: 'Ver Produções',
                    onPress: () => router.push('/productions'),
                  },
                ],
              );
            }}
          />
        )}

        {recipe && (
          <CustomizeRecipeModal
            isVisible={isCustomizeModalOpen}
            onClose={() => setIsCustomizeModalOpen(false)}
            onConfirm={handleConfirmCustomize}
            recipeTitle={recipe.title}
          />
        )}

        {recipe && (
          <KitchenModeModal
            isVisible={isKitchenModeOpen}
            onClose={() => setIsKitchenModeOpen(false)}
            recipeTitle={recipe.title}
            baseYield={Number(recipe.baseYield) || 1}
            yieldUnit={recipe.yieldUnit || 'UN'}
            prepTimeMinutes={recipe.prepTimeMinutes}
            scaleFactor={scaleFactor}
            onScaleChange={setScaleFactor}
            items={recipeItems}
            instructions={parsedInstructions}
          />
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
      paddingHorizontal: isDesktop ? 32 : 16,
      paddingTop: 16,
      paddingBottom: 60,
      alignItems: 'center',
    },
    innerWrapper: {
      width: '100%',
      maxWidth: isDesktop ? 1200 : 720,
      flexDirection: isDesktop ? 'row' : 'column',
      alignItems: 'flex-start',
      gap: isDesktop ? 32 : 0,
    },
    bottomSectionWrapper: {
      width: '100%',
      maxWidth: isDesktop ? 1200 : 720,
    },
    leftColumn: {
      flex: isDesktop ? 1 : undefined,
      width: isDesktop ? undefined : '100%',
      maxWidth: isDesktop ? 480 : '100%',
      minWidth: isDesktop ? 340 : undefined,
    },
    rightColumn: {
      flex: isDesktop ? 1.4 : undefined,
      width: isDesktop ? undefined : '100%',
      minWidth: isDesktop ? 340 : undefined,
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
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 22,
      fontWeight: 'bold',
      color: theme.colors.espressoDark,
      textAlign: 'center',
    },
    notFoundSubtitle: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      lineHeight: 20,
    },
    backButton: {
      marginTop: 12,
      backgroundColor: theme.colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: theme.rounded.default,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
      ...theme.shadows.soft,
    },
    backButtonText: {
      color: theme.colors.onPrimary,
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 15,
      fontWeight: '600',
    },

    // Hero Cover or Placeholder
    heroImage: {
      width: '100%',
      aspectRatio: 16 / 9,
      maxHeight: isDesktop ? 300 : undefined,
      borderRadius: theme.rounded.lg,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      marginBottom: 20,
    },
    heroPlaceholder: {
      width: '100%',
      aspectRatio: 16 / 9,
      maxHeight: isDesktop ? 300 : undefined,
      borderRadius: theme.rounded.lg,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surfaceContainerLow,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
      gap: 8,
    },
    heroPlaceholderBadge: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: theme.colors.surfaceContainerLowest,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    heroPlaceholderTitle: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.espressoDark,
    },
    heroPlaceholderSubtitle: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },

    // Header Details
    headerSection: {
      marginBottom: 20,
      gap: 10,
    },
    titleRow: {
      flexDirection: isDesktop ? 'row' : 'column',
      justifyContent: isDesktop ? 'space-between' : 'flex-start',
      alignItems: 'flex-start',
      gap: isDesktop ? 12 : 8,
    },
    primaryTitle: {
      flex: isDesktop ? 1 : undefined,
      width: isDesktop ? undefined : '100%',
      color: theme.colors.espressoDark,
      fontFamily: theme.typography.headlineLg.fontFamily,
      fontSize: 26,
      lineHeight: 32,
      fontWeight: 'bold',
    },
    titleBadgesRow: {
      width: isDesktop ? undefined : '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      flexWrap: 'wrap',
      gap: 6,
    },
    forkBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceContainerHigh,
      borderColor: theme.colors.outlineVariant,
      borderWidth: 1,
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: theme.rounded.full,
      gap: 5,
    },
    forkBadgeText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.secondary,
    },
    parentRecipeBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.lg,
      paddingVertical: 10,
      paddingHorizontal: 14,
      gap: 12,
      minHeight: 48,
      ...theme.shadows.soft,
    },
    parentRecipeBannerIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },
    parentRecipeBannerTextCol: {
      flex: 1,
    },
    parentRecipeBannerLabel: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      fontWeight: '500',
      color: theme.colors.onSurfaceVariant,
    },
    parentRecipeBannerTitle: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.espressoDark,
    },
    parentRecipeBannerAction: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    parentRecipeBannerActionText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: theme.rounded.full,
      gap: 5,
    },
    statusBadgeText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 12,
      fontWeight: '700',
    },
    headerRightRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    headerShareBtn: {
      minWidth: 48,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 8,
    },
    headerKitchenBtn: {
      minWidth: 48,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 8,
    },
    headerSaveBtn: {
      minWidth: 48,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 8,
    },
    headerForkBtn: {
      minWidth: 48,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 8,
    },
    headerEditBtn: {
      minWidth: 48,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 8,
    },
    ownerControlCard: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.rounded.lg,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: 16,
      marginBottom: 20,
      gap: 12,
      ...theme.shadows.soft,
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
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.colors.espressoDark,
    },
    ownerActionButtons: {
      flexDirection: isSmallScreen ? 'column' : 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    btnActionProduce: {
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      borderRadius: theme.rounded.default,
      paddingHorizontal: 16,
      gap: 8,
      ...theme.shadows.soft,
    },
    btnActionTextProduce: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.onPrimary,
    },
    btnActionShare: {
      flex: 1,
      minWidth: isSmallScreen ? '100%' : '45%',
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.default,
      paddingHorizontal: 12,
      gap: 6,
    },
    btnActionTextShare: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    btnActionEdit: {
      flex: 1,
      minWidth: isSmallScreen ? '100%' : '45%',
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.default,
      paddingHorizontal: 12,
      gap: 6,
    },
    btnActionTextEdit: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    btnActionPublish: {
      flex: 1,
      minWidth: isSmallScreen ? '100%' : '45%',
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.tertiary,
      borderRadius: theme.rounded.default,
      paddingHorizontal: 12,
      gap: 6,
      ...theme.shadows.soft,
    },
    btnActionTextPublish: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.onTertiary,
    },
    btnActionDraft: {
      flex: 1,
      minWidth: isSmallScreen ? '100%' : '45%',
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.default,
      paddingHorizontal: 12,
      gap: 6,
    },
    btnActionTextDraft: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.espressoDark,
    },
    btnActionArchive: {
      flex: 1,
      minWidth: isSmallScreen ? '100%' : '45%',
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.default,
      paddingHorizontal: 12,
      gap: 6,
    },
    btnActionTextArchive: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.espressoDark,
    },
    btnActionUnarchive: {
      flex: 1,
      minWidth: isSmallScreen ? '100%' : '45%',
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primaryContainer,
      borderRadius: theme.rounded.default,
      paddingHorizontal: 12,
      gap: 6,
      ...theme.shadows.soft,
    },
    btnActionTextUnarchive: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.onPrimaryContainer,
    },
    historyLinkBtn: {
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
      paddingTop: 8,
      gap: 6,
    },
    historyLinkText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    guestProduceCard: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.rounded.lg,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: 16,
      marginBottom: 20,
      gap: 12,
      ...theme.shadows.soft,
    },
    guestProduceHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    guestProduceTitleGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    guestProduceTitle: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.colors.espressoDark,
    },
    guestProduceBadge: {
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: theme.rounded.full,
    },
    guestProduceBadgeText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    guestProduceSubtitle: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      lineHeight: 18,
      color: theme.colors.onSurfaceVariant,
    },
    btnActionProduceGuest: {
      width: '100%',
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      borderRadius: theme.rounded.default,
      paddingHorizontal: 16,
      gap: 8,
      ...theme.shadows.soft,
    },
    btnActionTextProduceGuest: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.onPrimary,
    },
    guestSecondaryActions: {
      flexDirection: isSmallScreen ? 'column' : 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 8,
      width: '100%',
    },
    btnActionCustomizeGuest: {
      flex: 1,
      minWidth: isSmallScreen ? '100%' : 120,
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1.5,
      borderColor: theme.colors.primary,
      borderRadius: theme.rounded.default,
      paddingHorizontal: 14,
      gap: 6,
      ...theme.shadows.soft,
    },
    btnActionTextCustomizeGuest: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    btnActionSaveGuest: {
      flex: 1,
      minWidth: isSmallScreen ? '100%' : 120,
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1.5,
      borderColor: theme.colors.primary,
      borderRadius: theme.rounded.default,
      paddingHorizontal: 14,
      gap: 6,
    },
    btnActionSaveGuestActive: {
      backgroundColor: theme.colors.primaryContainer,
      borderColor: theme.colors.primaryContainer,
    },
    btnActionTextSaveGuest: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    btnActionTextSaveGuestActive: {
      color: theme.colors.onPrimaryContainer,
    },
    btnActionShareGuest: {
      flex: 1,
      minWidth: isSmallScreen ? '100%' : 120,
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1.5,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.default,
      paddingHorizontal: 14,
      gap: 6,
      ...theme.shadows.soft,
    },
    btnActionTextShareGuest: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '700',
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
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      paddingVertical: 5,
      paddingHorizontal: 12,
      borderRadius: theme.rounded.full,
      gap: 6,
    },
    metaBadgeText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
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
      borderRadius: theme.rounded.full,
      borderWidth: 1,
    },
    tagPillText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 12,
      fontWeight: '600',
    },

    // Segmented Mode Switcher
    segmentedControl: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.md,
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
      borderRadius: theme.rounded.sm,
      gap: 8,
      paddingHorizontal: 8,
    },
    segmentButtonActive: {
      backgroundColor: theme.colors.primary,
      ...theme.shadows.soft,
    },
    segmentButtonText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: isSmallScreen ? 12 : 14,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
    },
    segmentButtonTextActive: {
      color: theme.colors.onPrimary,
    },

    modeContainer: {
      width: '100%',
      gap: 16,
    },

    // Cards (Flat-First)
    cardBox: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.rounded.lg,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: 18,
      gap: 14,
      ...theme.shadows.soft,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
      paddingBottom: 10,
    },
    cardTitle: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 19,
      fontWeight: 'bold',
      color: theme.colors.espressoDark,
    },
    emptyCardText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 14,
      fontStyle: 'italic',
      color: theme.colors.onSurfaceVariant,
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
      borderBottomColor: theme.colors.outlineVariant,
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
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.sm,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surfaceContainerLowest,
    },
    checkedCheckbox: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    ingredientName: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 14,
      color: theme.colors.text,
      flexShrink: 1,
    },
    checkedIngredientText: {
      textDecorationLine: 'line-through',
      opacity: 0.5,
    },
    subRecipeBadge: {
      backgroundColor: theme.colors.parchment,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: theme.rounded.full,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    subRecipeBadgeText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 10,
      fontWeight: '700',
      color: theme.colors.espressoDark,
    },
    ingredientNotes: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
    },
    ingredientQuantity: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.colors.espressoDark,
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
      backgroundColor: theme.colors.surfaceContainerLow,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    stepText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontWeight: 'bold',
      fontSize: 14,
      color: theme.colors.primary,
    },
    stepBody: {
      flex: 1,
      gap: 2,
    },
    stepTitle: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.espressoDark,
    },
    stepContent: {
      fontFamily: theme.typography.bodyMd.fontFamily,
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
      borderBottomColor: theme.colors.outlineVariant,
    },
    pricingLeft: {
      flex: 1,
    },
    pricingItemName: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 14,
      color: theme.colors.text,
    },
    pricingWarningText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 11,
      color: theme.colors.error,
      marginTop: 2,
    },
    pricingItemValue: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.colors.espressoDark,
      marginLeft: 10,
    },
    pricingItemValueMissing: {
      color: theme.colors.onSurfaceVariant,
    },
    totalRow: {
      borderTopWidth: 1.5,
      borderTopColor: theme.colors.outlineVariant,
      paddingTop: 12,
      marginTop: 4,
    },
    totalLabel: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 15,
      fontWeight: 'bold',
      color: theme.colors.espressoDark,
    },
    totalValue: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },

    // Suggested Price Card
    suggestionHighlightCard: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.rounded.lg,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: 18,
      gap: 14,
      ...theme.shadows.soft,
    },
    markupDetailsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 6,
    },
    markupLabel: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 14,
      color: theme.colors.espressoDark,
    },
    markupValueHighlight: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.colors.tertiary,
    },
    priceContainer: {
      backgroundColor: theme.colors.parchment,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.md,
      padding: 16,
      alignItems: 'center',
      gap: 4,
      marginTop: 4,
    },
    priceSubtitle: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
    priceValueText: {
      fontFamily: theme.typography.headlineLg.fontFamily,
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.colors.tertiary,
    },
    priceSubContainer: {
      alignItems: 'center',
      paddingTop: 4,
    },
    priceSubText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
    priceSubTextBold: {
      fontWeight: 'bold',
      color: theme.colors.espressoDark,
    },
  });
