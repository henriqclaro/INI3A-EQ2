import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { DEFAULT_POPULAR_TAGS } from '@/src/constants/bakerTags';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { TagService } from '@/src/services/tag';
import { AppTheme } from '@/src/theme/themes';
import { BakerTag } from '@/src/types/baker-profile';
import { Tag } from '@/src/types/tag';

export interface BakerTagSelectorProps {
  selectedTags: BakerTag[];
  onTagsChange: (tags: BakerTag[]) => void;
  maxTags?: number;
  userId?: string;
}

export function BakerTagSelector({
  selectedTags,
  onTagsChange,
  maxTags = 7,
  userId,
}: BakerTagSelectorProps) {
  const { theme } = useThemeMode();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Tag[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);

  const canAddMoreTags = selectedTags.length < maxTags;
  const hasSelectedTags = selectedTags.length > 0;
  const isSearchEmpty = searchQuery.trim().length === 0;

  // Debounced search for tags of type 'USER'
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      return;
    }

    let isCancelled = false;
    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const response = await TagService.search(trimmed, undefined, 'USER');
        if (!isCancelled) {
          setSearchResults(response?.data?.tags || []);
        }
      } catch (err) {
        console.error('Error searching tags:', err);
      } finally {
        if (!isCancelled) {
          setIsSearching(false);
        }
      }
    }, 300);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const displayedSearchResults = useMemo(
    () => (isSearchEmpty ? [] : searchResults),
    [isSearchEmpty, searchResults],
  );

  const handleRemoveTag = useCallback(
    (tagId: number) => {
      onTagsChange(selectedTags.filter((t) => t.id !== tagId));
    },
    [onTagsChange, selectedTags],
  );

  const handleClearAllTags = useCallback(() => {
    onTagsChange([]);
  }, [onTagsChange]);

  const handleSelectTag = useCallback(
    (tag: { id: number; name: string }) => {
      const isAlreadySelected = selectedTags.some(
        (t) => t.id === tag.id || t.name.toLowerCase() === tag.name.toLowerCase(),
      );

      if (isAlreadySelected) {
        handleRemoveTag(tag.id);
        return;
      }

      if (!canAddMoreTags) {
        Alert.alert(
          'Limite Atingido',
          `Você pode selecionar no máximo ${maxTags} tags para o seu perfil.`,
        );
        return;
      }

      onTagsChange([...selectedTags, { id: tag.id, name: tag.name }]);
      setSearchQuery('');
      setSearchResults([]);
    },
    [canAddMoreTags, handleRemoveTag, maxTags, onTagsChange, selectedTags],
  );

  // Resolves a tag by name: finds existing in search or creates it via TagService.register
  const handleTogglePopularTag = useCallback(
    async (tagName: string) => {
      const normalized = tagName.trim();
      if (!normalized) return;

      const existingSelected = selectedTags.find(
        (t) => t.name.toLowerCase() === normalized.toLowerCase(),
      );

      if (existingSelected) {
        handleRemoveTag(existingSelected.id);
        return;
      }

      if (!canAddMoreTags) {
        Alert.alert(
          'Limite Atingido',
          `Você pode selecionar no máximo ${maxTags} tags para o seu perfil.`,
        );
        return;
      }

      try {
        setIsRegistering(true);
        // First, search if it exists in the database
        const searchRes = await TagService.search(normalized, undefined, 'USER');
        const foundTag = (searchRes?.data?.tags || []).find(
          (t) => t.name.toLowerCase() === normalized.toLowerCase(),
        );

        if (foundTag) {
          handleSelectTag({ id: foundTag.id, name: foundTag.name });
        } else if (userId) {
          // If not found, create new tag of type USER
          const createRes = await TagService.register({
            name: normalized,
            tagType: 'USER',
            creatorId: userId,
          });
          if (createRes?.data?.tag) {
            handleSelectTag({ id: createRes.data.tag.id, name: createRes.data.tag.name });
          }
        }
      } catch (err) {
        console.error('Error resolving tag:', err);
        Alert.alert('Erro ao selecionar tag', 'Não foi possível selecionar esta especialidade.');
      } finally {
        setIsRegistering(false);
      }
    },
    [canAddMoreTags, handleRemoveTag, handleSelectTag, maxTags, selectedTags, userId],
  );

  const handleCreateCustomTag = useCallback(async () => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    if (!canAddMoreTags) {
      Alert.alert(
        'Limite Atingido',
        `Você pode selecionar no máximo ${maxTags} tags para o seu perfil.`,
      );
      return;
    }

    const isAlreadySelected = selectedTags.some(
      (t) => t.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (isAlreadySelected) {
      setSearchQuery('');
      setSearchResults([]);
      return;
    }

    try {
      setIsRegistering(true);
      // Check if tag already exists in DB
      const searchRes = await TagService.search(trimmed, undefined, 'USER');
      const foundTag = (searchRes?.data?.tags || []).find(
        (t) => t.name.toLowerCase() === trimmed.toLowerCase(),
      );

      if (foundTag) {
        handleSelectTag({ id: foundTag.id, name: foundTag.name });
      } else if (userId) {
        const createRes = await TagService.register({
          name: trimmed,
          tagType: 'USER',
          creatorId: userId,
        });
        if (createRes?.data?.tag) {
          handleSelectTag({ id: createRes.data.tag.id, name: createRes.data.tag.name });
        }
      }
    } catch (err) {
      console.error('Error creating tag:', err);
      Alert.alert('Erro ao cadastrar tag', 'Não foi possível adicionar esta tag personalizada.');
    } finally {
      setIsRegistering(false);
    }
  }, [canAddMoreTags, handleSelectTag, maxTags, searchQuery, selectedTags, userId]);

  const hasExactMatch = useMemo(() => {
    const trimmed = searchQuery.trim().toLowerCase();
    if (!trimmed) return false;
    return searchResults.some((t) => t.name.toLowerCase() === trimmed);
  }, [searchQuery, searchResults]);

  return (
    <View style={styles.container}>
      {/* Header and Counter */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleContainer}>
          <MaterialCommunityIcons
            name="tag-multiple-outline"
            size={18}
            color={theme.colors.primary}
          />
          <Text style={styles.sectionTitle}>Especialidades & Tags</Text>
          <View style={styles.badgeOptional}>
            <Text style={styles.badgeOptionalText}>opcional</Text>
          </View>
        </View>
        <View style={styles.counterBadge}>
          <Text style={styles.counterText}>
            {selectedTags.length}/{maxTags}
          </Text>
        </View>
      </View>

      <Text style={styles.helperText}>
        Escolha até {maxTags} especialidades para que os clientes encontrem seus produtos com
        facilidade.
      </Text>

      {/* Selected tags list */}
      {hasSelectedTags && (
        <View style={styles.selectedSection}>
          <View style={styles.selectedHeaderRow}>
            <Text style={styles.subSectionTitle}>Tags Selecionadas:</Text>
            <TouchableOpacity
              onPress={handleClearAllTags}
              style={styles.clearAllBtn}
              accessibilityRole="button"
              accessibilityLabel="Limpar todas as tags"
            >
              <Text style={styles.clearAllText}>Limpar todas</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.chipsWrap}>
            {selectedTags.map((tag) => (
              <View key={tag.id} style={styles.selectedChip}>
                <Text style={styles.selectedChipText}>{tag.name}</Text>
                <TouchableOpacity
                  onPress={() => handleRemoveTag(tag.id)}
                  style={styles.removeIconBtn}
                  accessibilityRole="button"
                  accessibilityLabel={`Remover tag ${tag.name}`}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialCommunityIcons name="close" size={14} color={theme.colors.onPrimary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Search and custom input */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchInputContainer}>
          <MaterialCommunityIcons
            name="magnify"
            size={20}
            color={theme.colors.placeholder}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar especialidade (ex: Brownies)..."
            placeholderTextColor={theme.colors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="done"
            onSubmitEditing={handleCreateCustomTag}
          />
          {isSearching || isRegistering ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : !isSearchEmpty ? (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Limpar busca"
            >
              <MaterialCommunityIcons name="close-circle" size={18} color={theme.colors.outline} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Search results dropdown */}
        {!isSearchEmpty && (
          <View style={styles.searchResultsBox}>
            {displayedSearchResults.length > 0 ? (
              displayedSearchResults.map((item) => {
                const isItemAlreadySelected = selectedTags.some((t) => t.id === item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.searchResultItem}
                    onPress={() => handleSelectTag({ id: item.id, name: item.name })}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`Tag ${item.name}`}
                  >
                    <MaterialCommunityIcons
                      name={isItemAlreadySelected ? 'check-circle' : 'tag-outline'}
                      size={18}
                      color={
                        isItemAlreadySelected ? theme.colors.primary : theme.colors.onSurfaceVariant
                      }
                    />
                    <Text
                      style={[
                        styles.searchResultText,
                        isItemAlreadySelected && styles.searchResultTextSelected,
                      ]}
                    >
                      {item.name}
                    </Text>
                    {isItemAlreadySelected && (
                      <Text style={styles.alreadySelectedLabel}>Selecionada</Text>
                    )}
                  </TouchableOpacity>
                );
              })
            ) : !isSearching ? (
              <View style={styles.noResultsBox}>
                <Text style={styles.noResultsText}>Nenhuma tag existente encontrada.</Text>
              </View>
            ) : null}

            {/* Option to create new custom tag if not an exact match */}
            {!hasExactMatch && !isSearching && userId && (
              <TouchableOpacity
                style={styles.createTagActionBtn}
                onPress={handleCreateCustomTag}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`Criar nova tag ${searchQuery.trim()}`}
              >
                <MaterialCommunityIcons
                  name="plus-circle-outline"
                  size={18}
                  color={theme.colors.primary}
                />
                <Text style={styles.createTagActionText}>
                  {`Adicionar nova tag "${searchQuery.trim()}"`}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Suggested Popular Tags */}
      <View style={styles.popularSection}>
        <Text style={styles.subSectionTitle}>Sugestões Populares:</Text>
        <View style={styles.chipsWrap}>
          {DEFAULT_POPULAR_TAGS.map((popularName) => {
            const isSelected = selectedTags.some(
              (t) => t.name.toLowerCase() === popularName.toLowerCase(),
            );
            return (
              <TouchableOpacity
                key={popularName}
                style={[styles.suggestedChip, isSelected && styles.suggestedChipSelected]}
                onPress={() => handleTogglePopularTag(popularName)}
                disabled={isRegistering}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Sugestão ${popularName}`}
              >
                {isSelected ? (
                  <MaterialCommunityIcons name="check" size={13} color={theme.colors.onPrimary} />
                ) : (
                  <MaterialCommunityIcons name="plus" size={13} color={theme.colors.primary} />
                )}
                <Text
                  style={[styles.suggestedChipText, isSelected && styles.suggestedChipTextSelected]}
                >
                  {popularName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
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
    headerTitleContainer: {
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
    badgeOptional: {
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: theme.rounded.full,
      marginLeft: 6,
    },
    badgeOptionalText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 10,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    counterBadge: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: theme.rounded.full,
    },
    counterText: {
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
    selectedSection: {
      gap: 8,
      paddingTop: 4,
    },
    selectedHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    subSectionTitle: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.espressoDark,
    },
    clearAllBtn: {
      minHeight: 32,
      justifyContent: 'center',
      paddingHorizontal: 6,
    },
    clearAllText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 12,
      color: theme.colors.primary,
      fontWeight: '600',
    },
    chipsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    selectedChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
      paddingVertical: 6,
      paddingLeft: 12,
      paddingRight: 8,
      borderRadius: theme.rounded.full,
      gap: 6,
      minHeight: 36,
      ...theme.shadows.soft,
    },
    selectedChipText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.onPrimary,
    },
    removeIconBtn: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: theme.colors.primaryContainer,
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchWrapper: {
      width: '100%',
      gap: 6,
    },
    searchInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceContainerLowest,
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
    searchResultsBox: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.default,
      overflow: 'hidden',
      ...theme.shadows.soft,
    },
    searchResultItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.surfaceContainerLow,
      gap: 10,
      minHeight: 48,
    },
    searchResultText: {
      flex: 1,
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 14,
      color: theme.colors.text,
    },
    searchResultTextSelected: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
    alreadySelectedLabel: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      color: theme.colors.primary,
      fontWeight: '600',
    },
    noResultsBox: {
      padding: 12,
      alignItems: 'center',
    },
    noResultsText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    createTagActionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 12,
      backgroundColor: theme.colors.surfaceContainerLow,
      gap: 8,
      minHeight: 48,
    },
    createTagActionText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    popularSection: {
      gap: 8,
      paddingTop: 4,
    },
    suggestedChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: theme.rounded.full,
      gap: 6,
      minHeight: 36,
    },
    suggestedChipSelected: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    suggestedChipText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.espressoDark,
    },
    suggestedChipTextSelected: {
      color: theme.colors.onPrimary,
    },
  });
