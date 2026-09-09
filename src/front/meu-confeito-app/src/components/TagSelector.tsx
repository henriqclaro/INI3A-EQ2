import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useThemeMode } from '../contexts/ThemeContext';
import { TagService } from '../services/tag';
import { AppTheme } from '../theme/themes';
import { Tag } from '../types/tag';
import { getTagColors, getTagTypeLabel } from '../utils/tag';

export interface TagSelectorProps {
  selectedTags: Tag[];
  onSelectedTagsChange: (tags: Tag[]) => void;
  maxTags?: number;
  isDisabled?: boolean;
}

export function TagSelector({
  selectedTags,
  onSelectedTagsChange,
  maxTags = 5,
  isDisabled = false,
}: TagSelectorProps) {
  const { theme } = useThemeMode();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Tag[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasMaxTags = selectedTags.length >= maxTags;

  const getTagStyle = useCallback(
    (type?: string) => {
      return getTagColors(type, theme);
    },
    [theme],
  );

  const fetchSuggestions = useCallback(async (searchTerm: string) => {
    setIsSearching(true);
    try {
      const res = await TagService.search(searchTerm.trim());
      setSearchResults(res.data.tags || []);
    } catch (err) {
      console.error('Error searching tags:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleQueryChange = (text: string) => {
    setQuery(text);
    setIsDropdownVisible(true);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(text);
    }, 300);
  };

  const handleFocus = () => {
    if (!hasMaxTags && !isDisabled) {
      setIsDropdownVisible(true);
      if (searchResults.length === 0) {
        fetchSuggestions(query);
      }
    }
  };

  const handleSelectTag = (tag: Tag) => {
    if (hasMaxTags) {
      return;
    }
    const isAlreadySelected = selectedTags.some((t) => t.id === tag.id);
    if (!isAlreadySelected) {
      onSelectedTagsChange([...selectedTags, tag]);
    }
    setQuery('');
    setIsDropdownVisible(false);
  };

  const handleRemoveTag = (tagId: number) => {
    if (isDisabled) {
      return;
    }
    onSelectedTagsChange(selectedTags.filter((t) => t.id !== tagId));
  };

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Filter out already selected tags from the dropdown
  const availableSuggestions = useMemo(() => {
    const selectedIds = new Set(selectedTags.map((t) => t.id));
    return searchResults.filter((tag) => !selectedIds.has(tag.id));
  }, [searchResults, selectedTags]);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>Tags da Receita</Text>
        <View
          style={[
            styles.counterBadge,
            hasMaxTags ? styles.counterBadgeFull : styles.counterBadgeActive,
          ]}
        >
          <Text
            style={[
              styles.counterBadgeText,
              hasMaxTags ? styles.counterBadgeTextFull : styles.counterBadgeTextActive,
            ]}
          >
            {selectedTags.length}/{maxTags}
          </Text>
        </View>
      </View>

      <Text style={styles.helperText}>
        Adicione até {maxTags} tags para facilitar a busca e categorização da receita.
      </Text>

      {/* Selected Tags Chips */}
      <View style={styles.chipsContainer}>
        {selectedTags.length > 0 ? (
          selectedTags.map((tag) => {
            const tagStyle = getTagStyle(tag.type);
            return (
              <View
                key={tag.id}
                style={[
                  styles.tagChip,
                  {
                    backgroundColor: tagStyle.backgroundColor,
                    borderColor: tagStyle.borderColor,
                  },
                ]}
              >
                <Text style={[styles.tagChipText, { color: tagStyle.textColor }]}>{tag.name}</Text>
                {!isDisabled && (
                  <TouchableOpacity
                    onPress={() => handleRemoveTag(tag.id)}
                    style={styles.removeTagBtn}
                    accessibilityRole="button"
                    accessibilityLabel={`Remover tag ${tag.name}`}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MaterialCommunityIcons name="close" size={14} color={tagStyle.textColor} />
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        ) : (
          <Text style={styles.emptyTagsText}>Nenhuma tag selecionada.</Text>
        )}
      </View>

      {/* Search and Add Tag Input */}
      {!hasMaxTags && !isDisabled ? (
        <View style={styles.searchSection}>
          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons
              name="magnify"
              size={20}
              color={theme.colors.placeholder}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar tag (ex: Bolo, Doce)..."
              placeholderTextColor={theme.colors.placeholder}
              value={query}
              onChangeText={handleQueryChange}
              onFocus={handleFocus}
              autoCapitalize="none"
            />
            {isSearching && (
              <ActivityIndicator
                size="small"
                color={theme.colors.primary}
                style={styles.loadingSpinner}
              />
            )}
            {query.length > 0 && !isSearching && (
              <TouchableOpacity
                onPress={() => {
                  setQuery('');
                  setSearchResults([]);
                }}
                style={styles.clearQueryBtn}
                accessibilityRole="button"
                accessibilityLabel="Limpar busca"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialCommunityIcons
                  name="close-circle"
                  size={18}
                  color={theme.colors.placeholder}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Suggestions Dropdown */}
          {isDropdownVisible && (
            <View style={styles.dropdownContainer}>
              {availableSuggestions.length > 0 ? (
                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled
                  style={styles.dropdownList}
                >
                  {availableSuggestions.map((item) => {
                    const itemTagStyle = getTagStyle(item.type);
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.dropdownItem}
                        onPress={() => handleSelectTag(item)}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel={`Adicionar tag ${item.name}`}
                      >
                        <View style={styles.dropdownItemContent}>
                          <View
                            style={[
                              styles.itemTypeIndicator,
                              {
                                backgroundColor: itemTagStyle.backgroundColor,
                                borderColor: itemTagStyle.borderColor,
                              },
                            ]}
                          />
                          <Text style={styles.dropdownItemText}>{item.name}</Text>
                          <Text style={styles.dropdownItemTypeText}>
                            ({getTagTypeLabel(item.type)})
                          </Text>
                        </View>
                        <MaterialCommunityIcons
                          name="plus-circle-outline"
                          size={22}
                          color={theme.colors.primary}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              ) : isSearching ? (
                <View style={styles.dropdownEmptyState}>
                  <Text style={styles.dropdownEmptyText}>Buscando tags...</Text>
                </View>
              ) : query.trim().length > 0 ? (
                <View style={styles.dropdownEmptyState}>
                  <Text style={styles.dropdownEmptyText}>
                    Nenhuma tag encontrada para &quot;{query}&quot;
                  </Text>
                </View>
              ) : null}
            </View>
          )}
        </View>
      ) : hasMaxTags ? (
        <View style={styles.limitBanner}>
          <MaterialCommunityIcons
            name="information-outline"
            size={18}
            color={theme.colors.primary}
          />
          <Text style={styles.limitBannerText}>Limite máximo de {maxTags} tags atingido.</Text>
        </View>
      ) : null}
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      width: '100%',
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    label: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.espressoDark,
    },
    counterBadge: {
      paddingHorizontal: theme.spacing.space2,
      paddingVertical: 2,
      borderRadius: theme.rounded.full,
      borderWidth: 1,
    },
    counterBadgeActive: {
      backgroundColor: theme.colors.chips.secondary.background,
      borderColor: theme.colors.outlineVariant,
    },
    counterBadgeFull: {
      backgroundColor: theme.colors.chips.primary.background,
      borderColor: theme.colors.primary,
    },
    counterBadgeText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      fontWeight: '700',
    },
    counterBadgeTextActive: {
      color: theme.colors.chips.secondary.text,
    },
    counterBadgeTextFull: {
      color: theme.colors.chips.primary.text,
    },
    helperText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      marginBottom: theme.spacing.space3,
    },
    chipsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.space2,
      marginBottom: theme.spacing.space3,
      minHeight: 36,
      alignItems: 'center',
    },
    emptyTagsText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.placeholder,
      fontStyle: 'italic',
    },
    tagChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
      paddingLeft: 12,
      paddingRight: 6,
      borderRadius: theme.rounded.full,
      borderWidth: 1,
      gap: 6,
    },
    tagChipText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 12,
      fontWeight: '600',
    },
    removeTagBtn: {
      minWidth: 24,
      minHeight: 24,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
    },
    searchSection: {
      position: 'relative',
      zIndex: 10,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.default,
      paddingHorizontal: theme.spacing.space3,
      minHeight: theme.spacing.touchable,
    },
    searchIcon: {
      marginRight: 6,
    },
    searchInput: {
      flex: 1,
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 14,
      color: theme.colors.onSurface,
      minHeight: 44,
    },
    loadingSpinner: {
      marginLeft: 6,
    },
    clearQueryBtn: {
      minWidth: 36,
      minHeight: 36,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 4,
    },
    dropdownContainer: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.md,
      marginTop: 4,
      maxHeight: 200,
      overflow: 'hidden',
      ...theme.shadows.modal,
    },
    dropdownList: {
      maxHeight: 200,
    },
    dropdownItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.space3,
      paddingHorizontal: theme.spacing.space4,
      minHeight: theme.spacing.touchable,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
    },
    dropdownItemContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    itemTypeIndicator: {
      width: 10,
      height: 10,
      borderRadius: 5,
      borderWidth: 1,
    },
    dropdownItemText: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    dropdownItemTypeText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      color: theme.colors.placeholder,
    },
    dropdownEmptyState: {
      padding: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dropdownEmptyText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.placeholder,
      fontStyle: 'italic',
    },
    limitBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.default,
      paddingVertical: 10,
      paddingHorizontal: 14,
      gap: 8,
    },
    limitBannerText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.espressoDark,
      fontWeight: '500',
    },
  });
