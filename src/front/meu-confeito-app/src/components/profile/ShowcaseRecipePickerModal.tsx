import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Image } from 'expo-image';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useThemeMode } from '@/src/contexts/ThemeContext';
import { useUserRecipes } from '@/src/hooks/useRecipes';
import { AppTheme } from '@/src/theme/themes';
import { PartialRecipe } from '@/src/types/recipe';

export interface ShowcaseRecipePickerModalProps {
  isVisible: boolean;
  onClose: () => void;
  currentShowcaseRecipeIds: string[];
  onSelectRecipe: (recipeId: string) => Promise<void> | void;
  userId?: string;
}

export function ShowcaseRecipePickerModal({
  isVisible,
  onClose,
  currentShowcaseRecipeIds,
  onSelectRecipe,
  userId,
}: ShowcaseRecipePickerModalProps) {
  const { theme } = useThemeMode();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { recipes, isLoading } = useUserRecipes(userId);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredRecipes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return recipes;
    return recipes.filter((r) => r.title.toLowerCase().includes(query));
  }, [recipes, searchQuery]);

  const handleSelect = async (recipe: PartialRecipe) => {
    try {
      setIsSubmitting(true);
      await onSelectRecipe(recipe.id);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={isVisible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleRow}>
              <MaterialCommunityIcons
                name="store-plus-outline"
                size={22}
                color={theme.colors.primary}
              />
              <Text style={styles.modalTitle}>Adicionar à Vitrine</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Fechar seletor de receitas"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons
                name="close"
                size={22}
                color={theme.colors.onSurfaceVariant}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalSubtitle}>
            Selecione uma das suas receitas publicadas para exibi-la em destaque no seu perfil
            público.
          </Text>

          {/* Search input */}
          <View style={styles.searchBar}>
            <MaterialCommunityIcons
              name="magnify"
              size={20}
              color={theme.colors.placeholder}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar pelo nome da receita..."
              placeholderTextColor={theme.colors.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.trim().length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Limpar busca"
              >
                <MaterialCommunityIcons
                  name="close-circle"
                  size={18}
                  color={theme.colors.outline}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Recipes List */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Carregando suas receitas...</Text>
            </View>
          ) : filteredRecipes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="book-open-outline"
                size={40}
                color={theme.colors.placeholder}
              />
              <Text style={styles.emptyTitle}>Nenhuma receita encontrada</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery.trim().length > 0
                  ? 'Nenhuma receita corresponde à busca informada.'
                  : 'Você ainda não possui receitas publicadas para adicionar à vitrine.'}
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.recipeList}
              contentContainerStyle={styles.recipeListContent}
              showsVerticalScrollIndicator={false}
            >
              {filteredRecipes.map((recipe) => {
                const isAlreadyInShowcase = currentShowcaseRecipeIds.includes(recipe.id);
                const hasCover = Boolean(recipe.coverUrl && recipe.coverUrl.trim().length > 0);

                return (
                  <TouchableOpacity
                    key={recipe.id}
                    style={[styles.recipeCard, isAlreadyInShowcase && styles.recipeCardDisabled]}
                    onPress={() => !isAlreadyInShowcase && !isSubmitting && handleSelect(recipe)}
                    disabled={isAlreadyInShowcase || isSubmitting}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`Receita ${recipe.title}`}
                  >
                    {hasCover ? (
                      <Image
                        source={{ uri: recipe.coverUrl! }}
                        style={styles.recipeImage}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                        recyclingKey={recipe.coverUrl!}
                        transition={150}
                      />
                    ) : (
                      <View style={[styles.recipeImage, styles.recipePlaceholder]}>
                        <MaterialCommunityIcons
                          name="cake-variant-outline"
                          size={24}
                          color={theme.colors.primary}
                        />
                      </View>
                    )}

                    <View style={styles.recipeDetails}>
                      <Text style={styles.recipeTitle} numberOfLines={2}>
                        {recipe.title}
                      </Text>
                      {recipe.prepTimeMinutes ? (
                        <Text style={styles.recipeTime}>
                          {recipe.prepTimeMinutes} min de preparo
                        </Text>
                      ) : null}
                    </View>

                    {isAlreadyInShowcase ? (
                      <View style={styles.inShowcaseBadge}>
                        <MaterialCommunityIcons
                          name="check-circle"
                          size={14}
                          color={theme.colors.chips.success.text}
                        />
                        <Text style={styles.inShowcaseText}>Na vitrine</Text>
                      </View>
                    ) : (
                      <View style={styles.addBadge}>
                        <MaterialCommunityIcons
                          name="plus"
                          size={16}
                          color={theme.colors.primary}
                        />
                        <Text style={styles.addBadgeText}>Adicionar</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* Modal Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Cancelar seleção"
            >
              <Text style={styles.cancelBtnText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.colors.backdrop,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    modalContainer: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.rounded.lg,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      width: '100%',
      maxWidth: 480,
      maxHeight: '85%',
      padding: 20,
      ...theme.shadows.modal,
      gap: 12,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    modalTitle: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.espressoDark,
    },
    closeBtn: {
      padding: 4,
      minHeight: 44,
      minWidth: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalSubtitle: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 18,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.default,
      paddingHorizontal: 12,
      minHeight: 48,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 14,
      color: theme.colors.text,
      minHeight: 44,
    },
    loadingContainer: {
      paddingVertical: 40,
      alignItems: 'center',
      gap: 10,
    },
    loadingText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
    emptyContainer: {
      paddingVertical: 36,
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 16,
    },
    emptyTitle: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.espressoDark,
    },
    emptySubtitle: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      lineHeight: 18,
    },
    recipeList: {
      maxHeight: 320,
    },
    recipeListContent: {
      gap: 10,
      paddingVertical: 4,
    },
    recipeCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.default,
      padding: 10,
      gap: 10,
      minHeight: 64,
      ...theme.shadows.soft,
    },
    recipeCardDisabled: {
      opacity: 0.6,
      backgroundColor: theme.colors.surfaceContainerLow,
    },
    recipeImage: {
      width: 52,
      height: 52,
      borderRadius: theme.rounded.sm,
    },
    recipePlaceholder: {
      backgroundColor: theme.colors.surfaceContainerLow,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    recipeDetails: {
      flex: 1,
      gap: 2,
    },
    recipeTitle: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.espressoDark,
      lineHeight: 18,
    },
    recipeTime: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
    },
    inShowcaseBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: theme.colors.chips.success.background,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: theme.rounded.full,
      borderWidth: 1,
      borderColor: theme.colors.tertiaryFixed,
    },
    inShowcaseText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.chips.success.text,
    },
    addBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.primary,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: theme.rounded.full,
      minHeight: 36,
    },
    addBadgeText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    modalFooter: {
      paddingTop: 8,
      alignItems: 'flex-end',
    },
    cancelBtn: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: theme.rounded.default,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surfaceContainerLow,
      minHeight: 48,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cancelBtnText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.espressoDark,
    },
  });
