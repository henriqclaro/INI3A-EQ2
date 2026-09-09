import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Image } from 'expo-image';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useThemeMode } from '@/src/contexts/ThemeContext';
import { useMyShowcase } from '@/src/hooks/useBakerProfile';
import { AppTheme } from '@/src/theme/themes';
import { ReorderShowcaseItem, ShowcaseRecipeItem } from '@/src/types/showcase';

import { ShowcaseRecipePickerModal } from './ShowcaseRecipePickerModal';

export interface ShowcaseManagerProps {
  userId?: string;
}

export function ShowcaseManager({ userId }: ShowcaseManagerProps) {
  const { theme } = useThemeMode();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const {
    showcase,
    isLoading,
    isMutating,
    hasError,
    errorMessage,
    refetch,
    addToShowcase,
    removeFromShowcase,
    reorderShowcase,
  } = useMyShowcase(true);

  const [isPickerModalVisible, setIsPickerModalVisible] = useState(false);

  const currentRecipeIds = useMemo(() => showcase.map((item) => item.recipeId), [showcase]);
  const hasShowcaseItems = showcase.length > 0;

  const handleAddRecipe = useCallback(
    async (recipeId: string) => {
      try {
        await addToShowcase(recipeId);
      } catch {
        // error handled in hook
      }
    },
    [addToShowcase],
  );

  const handleConfirmRemove = useCallback(
    (item: ShowcaseRecipeItem) => {
      Alert.alert(
        'Remover da Vitrine?',
        `Deseja remover "${item.recipe.title}" da sua vitrine pública?\n\nA receita continuará cadastrada no seu perfil, mas não aparecerá mais em destaque.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Remover',
            style: 'destructive',
            onPress: () => removeFromShowcase(item.recipeId),
          },
        ],
      );
    },
    [removeFromShowcase],
  );

  const handleMoveItem = useCallback(
    async (index: number, direction: 'up' | 'down') => {
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= showcase.length) return;

      const updated = [...showcase];
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;

      const reorderPayload: ReorderShowcaseItem[] = updated.map((item, idx) => ({
        recipeId: item.recipeId,
        order: idx + 1,
      }));

      try {
        await reorderShowcase(reorderPayload);
      } catch {
        // error handled in hook
      }
    },
    [reorderShowcase, showcase],
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleRow}>
          <MaterialCommunityIcons
            name="storefront-outline"
            size={20}
            color={theme.colors.primary}
          />
          <Text style={styles.sectionTitle}>Vitrine de Destaques</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>
            {showcase.length} {showcase.length === 1 ? 'item' : 'itens'}
          </Text>
        </View>
      </View>

      <Text style={styles.helperText}>
        Escolha as receitas que aparecerão na vitrine principal do seu perfil público. Você pode
        reordená-las usando as setas.
      </Text>

      {/* Loading state */}
      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Carregando vitrine...</Text>
        </View>
      ) : hasError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMessage || 'Erro ao carregar vitrine.'}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={refetch}
            accessibilityRole="button"
            accessibilityLabel="Tentar carregar vitrine novamente"
          >
            <Text style={styles.retryBtnText}>Tentar Novamente</Text>
          </TouchableOpacity>
        </View>
      ) : hasShowcaseItems ? (
        <View style={styles.showcaseList}>
          {showcase.map((item, index) => {
            const hasCover = Boolean(
              item.recipe.coverUrl && item.recipe.coverUrl.trim().length > 0,
            );
            const canMoveUp = index > 0;
            const canMoveDown = index < showcase.length - 1;

            return (
              <View key={item.recipeId} style={styles.showcaseCard}>
                <View style={styles.orderBadge}>
                  <Text style={styles.orderText}>{index + 1}º</Text>
                </View>

                {hasCover ? (
                  <Image
                    source={{ uri: item.recipe.coverUrl! }}
                    style={styles.thumbnail}
                    contentFit="cover"
                  />
                ) : (
                  <View style={[styles.thumbnail, styles.placeholderThumbnail]}>
                    <MaterialCommunityIcons
                      name="cake-variant-outline"
                      size={20}
                      color={theme.colors.primary}
                    />
                  </View>
                )}

                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle} numberOfLines={1}>
                    {item.recipe.title}
                  </Text>
                  {item.recipe.averageRating && Number(item.recipe.averageRating) > 0 ? (
                    <View style={styles.ratingRow}>
                      <MaterialCommunityIcons name="star" size={12} color="#D97706" />
                      <Text style={styles.ratingText}>
                        {Number(item.recipe.averageRating).toFixed(1)}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.itemSubtitle}>Sem avaliações</Text>
                  )}
                </View>

                {/* Reorder Buttons */}
                <View style={styles.controlsRow}>
                  <TouchableOpacity
                    style={[styles.iconActionBtn, !canMoveUp && styles.iconBtnDisabled]}
                    onPress={() => handleMoveItem(index, 'up')}
                    disabled={!canMoveUp || isMutating}
                    hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                    accessibilityRole="button"
                    accessibilityLabel="Mover para cima"
                  >
                    <MaterialCommunityIcons
                      name="chevron-up"
                      size={20}
                      color={canMoveUp ? theme.colors.espressoDark : theme.colors.outlineVariant}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.iconActionBtn, !canMoveDown && styles.iconBtnDisabled]}
                    onPress={() => handleMoveItem(index, 'down')}
                    disabled={!canMoveDown || isMutating}
                    hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                    accessibilityRole="button"
                    accessibilityLabel="Mover para baixo"
                  >
                    <MaterialCommunityIcons
                      name="chevron-down"
                      size={20}
                      color={canMoveDown ? theme.colors.espressoDark : theme.colors.outlineVariant}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.iconActionBtn, styles.deleteActionBtn]}
                    onPress={() => handleConfirmRemove(item)}
                    disabled={isMutating}
                    hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                    accessibilityRole="button"
                    accessibilityLabel={`Remover ${item.recipe.title} da vitrine`}
                  >
                    <MaterialCommunityIcons
                      name="trash-can-outline"
                      size={18}
                      color={theme.colors.error}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyBox}>
          <MaterialCommunityIcons
            name="storefront-outline"
            size={36}
            color={theme.colors.placeholder}
          />
          <Text style={styles.emptyTitle}>Sua vitrine está vazia</Text>
          <Text style={styles.emptySubtitle}>
            Adicione suas melhores receitas publicadas para que os clientes conheçam seus produtos
            no perfil público.
          </Text>
        </View>
      )}

      {/* Add to showcase trigger */}
      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => setIsPickerModalVisible(true)}
        disabled={isMutating}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Adicionar nova receita à vitrine"
      >
        <MaterialCommunityIcons name="plus" size={18} color={theme.colors.primary} />
        <Text style={styles.addBtnText}>Adicionar Receita à Vitrine</Text>
      </TouchableOpacity>

      {/* Picker Modal */}
      <ShowcaseRecipePickerModal
        isVisible={isPickerModalVisible}
        onClose={() => setIsPickerModalVisible(false)}
        currentShowcaseRecipeIds={currentRecipeIds}
        onSelectRecipe={handleAddRecipe}
        userId={userId}
      />
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      width: '100%',
      gap: 12,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.md,
      padding: 14,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    sectionTitle: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.espressoDark,
    },
    countBadge: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: theme.rounded.full,
    },
    countText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    helperText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 16,
    },
    loadingBox: {
      paddingVertical: 20,
      alignItems: 'center',
      gap: 8,
    },
    loadingText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    errorBox: {
      paddingVertical: 14,
      alignItems: 'center',
      gap: 8,
    },
    errorText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      color: theme.colors.error,
    },
    retryBtn: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: theme.rounded.sm,
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    retryBtnText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 12,
      color: theme.colors.primary,
      fontWeight: '600',
    },
    showcaseList: {
      gap: 8,
    },
    showcaseCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.default,
      padding: 8,
      gap: 8,
      minHeight: 56,
      ...theme.shadows.soft,
    },
    orderBadge: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.colors.surfaceContainerLow,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    orderText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.espressoDark,
    },
    thumbnail: {
      width: 44,
      height: 44,
      borderRadius: theme.rounded.sm,
    },
    placeholderThumbnail: {
      backgroundColor: theme.colors.surfaceContainerLow,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    itemInfo: {
      flex: 1,
      gap: 2,
    },
    itemTitle: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.espressoDark,
    },
    ratingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },
    ratingText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.espressoDark,
    },
    itemSubtitle: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
    },
    controlsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    iconActionBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surfaceContainerLow,
    },
    iconBtnDisabled: {
      opacity: 0.35,
    },
    deleteActionBtn: {
      marginLeft: 4,
    },
    emptyBox: {
      paddingVertical: 20,
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
    },
    emptyTitle: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.espressoDark,
    },
    emptySubtitle: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      lineHeight: 16,
    },
    addBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.primary,
      borderRadius: theme.rounded.default,
      paddingVertical: 10,
      minHeight: 48,
    },
    addBtnText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.primary,
    },
  });
