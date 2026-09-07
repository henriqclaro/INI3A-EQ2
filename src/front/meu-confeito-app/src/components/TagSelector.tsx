import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
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

  const getTagColor = useCallback(
    (type?: string) => {
      const normalized = (type || '').toLowerCase();
      if (normalized === 'product') {
        return theme.colors.tags.product;
      }
      if (normalized === 'variety') {
        return theme.colors.tags.variety;
      }
      if (normalized === 'attribute') {
        return theme.colors.tags.attribute;
      }
      return theme.colors.secondary;
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
          selectedTags.map((tag) => (
            <View key={tag.id} style={[styles.tagChip, { backgroundColor: getTagColor(tag.type) }]}>
              <Text style={styles.tagChipText}>{tag.name}</Text>
              {!isDisabled && (
                <TouchableOpacity
                  onPress={() => handleRemoveTag(tag.id)}
                  style={styles.removeTagBtn}
                  accessibilityRole="button"
                  accessibilityLabel={`Remover tag ${tag.name}`}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialCommunityIcons name="close" size={16} color={theme.colors.text} />
                </TouchableOpacity>
              )}
            </View>
          ))
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
              placeholder="Buscar tag (ex: Bolo, Sem Glúten, Chocolate)..."
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
                <FlatList
                  data={availableSuggestions}
                  keyExtractor={(item) => String(item.id)}
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled
                  style={styles.dropdownList}
                  renderItem={({ item }) => (
                    <TouchableOpacity
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
                            { backgroundColor: getTagColor(item.type) },
                          ]}
                        />
                        <Text style={styles.dropdownItemText}>{item.name}</Text>
                        <Text style={styles.dropdownItemTypeText}>({item.type.toLowerCase()})</Text>
                      </View>
                      <MaterialCommunityIcons
                        name="plus-circle-outline"
                        size={22}
                        color={theme.colors.primary}
                      />
                    </TouchableOpacity>
                  )}
                />
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
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
    },
    counterBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 9999,
      borderWidth: 1,
    },
    counterBadgeActive: {
      backgroundColor: theme.colors.secondary,
      borderColor: theme.colors.secBorder,
    },
    counterBadgeFull: {
      backgroundColor: theme.colors.pitchBackground,
      borderColor: theme.colors.primary,
    },
    counterBadgeText: {
      fontFamily: 'Inter',
      fontSize: 12,
      fontWeight: 'bold',
    },
    counterBadgeTextActive: {
      color: theme.colors.primary,
    },
    counterBadgeTextFull: {
      color: theme.colors.primary,
    },
    helperText: {
      fontSize: 13,
      color: theme.colors.placeholder,
      marginBottom: 12,
    },
    chipsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 14,
      minHeight: 36,
      alignItems: 'center',
    },
    emptyTagsText: {
      fontSize: 13,
      color: theme.colors.placeholder,
      fontStyle: 'italic',
    },
    tagChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
      paddingLeft: 12,
      paddingRight: 6,
      borderRadius: 9999,
      borderWidth: 1,
      borderColor: theme.colors.secBorder,
      gap: 6,
    },
    tagChipText: {
      fontFamily: 'Inter',
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.text,
    },
    removeTagBtn: {
      minWidth: 28,
      minHeight: 28,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 14,
    },
    searchSection: {
      position: 'relative',
      zIndex: 10,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.lightGray,
      borderRadius: 8,
      paddingHorizontal: 10,
      minHeight: 48,
    },
    searchIcon: {
      marginRight: 6,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: theme.colors.text,
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
      backgroundColor: theme.colors.pitchBackground,
      borderWidth: 1,
      borderColor: theme.colors.secBorder,
      borderRadius: 8,
      marginTop: 4,
      maxHeight: 200,
      overflow: 'hidden',
    },
    dropdownList: {
      maxHeight: 200,
    },
    dropdownItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 14,
      minHeight: 48,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.lightGray,
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
    },
    dropdownItemText: {
      fontFamily: 'Inter',
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
    },
    dropdownItemTypeText: {
      fontFamily: 'Inter',
      fontSize: 12,
      color: theme.colors.placeholder,
    },
    dropdownEmptyState: {
      padding: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dropdownEmptyText: {
      fontFamily: 'Inter',
      fontSize: 13,
      color: theme.colors.placeholder,
      fontStyle: 'italic',
    },
    limitBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.pitchBackground,
      borderWidth: 1,
      borderColor: theme.colors.secBorder,
      borderRadius: 8,
      paddingVertical: 10,
      paddingHorizontal: 14,
      gap: 8,
    },
    limitBannerText: {
      fontFamily: 'Inter',
      fontSize: 13,
      color: theme.colors.text,
      fontWeight: '500',
    },
  });
