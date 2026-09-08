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

import { Image } from 'expo-image';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useThemeMode } from '../contexts/ThemeContext';
import { RecipeService } from '../services/recipe';
import { UserService } from '../services/user';
import { AppTheme } from '../theme/themes';
import { PartialRecipe } from '../types/recipe';

export interface RecipeSelectorProps {
  selectedRecipeId?: string | null;
  selectedRecipe?: PartialRecipe | null;
  onSelectRecipe: (recipe: PartialRecipe | null) => void;
  userId?: string;
  onlyUserRecipes?: boolean;
  excludeRecipeId?: string;
  label?: string;
  placeholder?: string;
  helperText?: string;
  error?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  canClear?: boolean;
  initialRecipes?: PartialRecipe[];
}

export function RecipeSelector({
  selectedRecipeId,
  selectedRecipe,
  onSelectRecipe,
  userId,
  onlyUserRecipes = true,
  excludeRecipeId,
  label = 'Sub-receita',
  placeholder = 'Buscar sub-receita (ex: Brigadeiro, Massa de Baunilha)...',
  helperText,
  error,
  isRequired = false,
  isDisabled = false,
  canClear = true,
  initialRecipes = [],
}: RecipeSelectorProps) {
  const { theme } = useThemeMode();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PartialRecipe[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [fetchedRecipe, setFetchedRecipe] = useState<PartialRecipe | null>(null);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Active selected recipe resolution
  const activeRecipe: PartialRecipe | null = useMemo(() => {
    if (selectedRecipe) return selectedRecipe;
    if (!selectedRecipeId) return null;

    const fromInitial = initialRecipes.find((r) => r.id === selectedRecipeId);
    if (fromInitial) return fromInitial;

    const fromSearch = searchResults.find((r) => r.id === selectedRecipeId);
    if (fromSearch) return fromSearch;

    if (fetchedRecipe && fetchedRecipe.id === selectedRecipeId) {
      return fetchedRecipe;
    }

    return null;
  }, [selectedRecipe, selectedRecipeId, initialRecipes, searchResults, fetchedRecipe]);

  // Derived list of recipes to display based on query & initial list
  const currentList = useMemo(() => {
    if (!searchQuery.trim() && searchResults.length === 0 && initialRecipes.length > 0) {
      return initialRecipes;
    }
    return searchResults;
  }, [searchQuery, searchResults, initialRecipes]);

  // Fetch recipe details if only ID is provided
  useEffect(() => {
    let isCurrent = true;

    if (selectedRecipeId && !activeRecipe) {
      RecipeService.getRecipe(selectedRecipeId)
        .then((res) => {
          if (!isCurrent) return;
          if (res?.data?.recipe) {
            setFetchedRecipe(res.data.recipe as unknown as PartialRecipe);
          }
        })
        .catch((err) => {
          console.error('Error finding recipe by ID:', err);
        });
    }

    return () => {
      isCurrent = false;
    };
  }, [selectedRecipeId, activeRecipe]);

  const fetchSuggestions = useCallback(
    async (term: string) => {
      setIsSearching(true);
      try {
        if (onlyUserRecipes && userId) {
          const res = await UserService.getRecipes(userId);
          const list = res.data.recipes || [];
          if (!term.trim()) {
            setSearchResults(list);
          } else {
            const lower = term.toLowerCase();
            setSearchResults(list.filter((r) => r.title.toLowerCase().includes(lower)));
          }
        } else {
          const res = await RecipeService.search(term.trim() || undefined);
          setSearchResults(res.data.recipes || []);
        }
      } catch (err) {
        console.error('Error searching recipes:', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [onlyUserRecipes, userId],
  );

  const handleQueryChange = (text: string) => {
    setSearchQuery(text);
    setIsDropdownVisible(true);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(text);
    }, 300);
  };

  const handleFocus = () => {
    if (isDisabled) return;
    setIsDropdownVisible(true);
    if (searchResults.length === 0) {
      fetchSuggestions(searchQuery);
    }
  };

  const handleSelect = (item: PartialRecipe) => {
    onSelectRecipe(item);
    setSearchQuery('');
    setIsDropdownVisible(false);
  };

  const handleClear = () => {
    if (isDisabled) return;
    onSelectRecipe(null);
    setSearchQuery('');
    setIsDropdownVisible(false);
  };

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Filter available suggestions (excluding current recipe if editing)
  const availableSuggestions = useMemo(() => {
    return currentList.filter((r) => !excludeRecipeId || r.id !== excludeRecipeId);
  }, [currentList, excludeRecipeId]);

  const hasSelected = Boolean(activeRecipe);
  const hasError = Boolean(error);

  return (
    <View style={styles.container}>
      {/* Label and Header */}
      {Boolean(label) && (
        <View style={styles.labelRow}>
          <Text style={styles.label}>
            {label}
            {isRequired && <Text style={styles.requiredAsterisk}> *</Text>}
          </Text>
        </View>
      )}

      {Boolean(helperText) && !hasSelected && <Text style={styles.helperText}>{helperText}</Text>}

      {/* When a recipe IS selected, show selected artisan card */}
      {hasSelected && activeRecipe ? (
        <View style={[styles.selectedCard, hasError && styles.selectedCardError]}>
          {activeRecipe.coverUrl ? (
            <Image
              source={{ uri: activeRecipe.coverUrl }}
              style={styles.selectedImage}
              contentFit="cover"
            />
          ) : (
            <View style={styles.selectedIconBox}>
              <MaterialCommunityIcons
                name="cake-variant-outline"
                size={22}
                color={theme.colors.primary}
              />
            </View>
          )}

          <View style={styles.selectedInfo}>
            <Text style={styles.selectedTitle} numberOfLines={1}>
              {activeRecipe.title}
            </Text>

            <View style={styles.selectedMetaRow}>
              {activeRecipe.tags && activeRecipe.tags.length > 0 && (
                <View style={styles.tagChip}>
                  <Text style={styles.tagChipText}>{activeRecipe.tags[0].tag.name}</Text>
                </View>
              )}
              <View style={styles.subRecipeBadge}>
                <Text style={styles.subRecipeBadgeText}>Sub-receita</Text>
              </View>
            </View>
          </View>

          {canClear && !isDisabled && (
            <TouchableOpacity
              style={styles.changeBtn}
              onPress={handleClear}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Trocar ou remover sub-receita selecionada"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons
                name="close-circle-outline"
                size={22}
                color={theme.colors.onSurfaceVariant}
              />
            </TouchableOpacity>
          )}
        </View>
      ) : (
        /* When NO recipe is selected, show Search Input + Dropdown */
        <View style={styles.searchContainer}>
          <View
            style={[
              styles.inputWrapper,
              hasError && styles.inputWrapperError,
              isDropdownVisible && styles.inputWrapperFocused,
            ]}
          >
            <MaterialCommunityIcons
              name="magnify"
              size={20}
              color={theme.colors.placeholder}
              style={styles.searchIcon}
            />

            <TextInput
              style={styles.searchInput}
              placeholder={placeholder}
              placeholderTextColor={theme.colors.placeholder}
              value={searchQuery}
              onChangeText={handleQueryChange}
              onFocus={handleFocus}
              autoCapitalize="none"
              editable={!isDisabled}
            />

            {isSearching && (
              <ActivityIndicator
                size="small"
                color={theme.colors.primary}
                style={styles.loadingSpinner}
              />
            )}

            {searchQuery.length > 0 && !isSearching && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
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
          {isDropdownVisible && !isDisabled && (
            <View style={styles.dropdownContainer}>
              {availableSuggestions.length > 0 ? (
                <FlatList
                  data={availableSuggestions}
                  keyExtractor={(item) => item.id}
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled
                  style={styles.dropdownList}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => handleSelect(item)}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={`Selecionar receita ${item.title}`}
                    >
                      <View style={styles.dropdownItemContent}>
                        {item.coverUrl ? (
                          <Image
                            source={{ uri: item.coverUrl }}
                            style={styles.dropdownItemImage}
                            contentFit="cover"
                          />
                        ) : (
                          <View style={styles.dropdownItemIconContainer}>
                            <MaterialCommunityIcons
                              name="cake-variant-outline"
                              size={16}
                              color={theme.colors.primary}
                            />
                          </View>
                        )}

                        <View style={styles.itemTextContainer}>
                          <Text style={styles.dropdownItemTitle} numberOfLines={1}>
                            {item.title}
                          </Text>

                          <View style={styles.dropdownItemMetaRow}>
                            {item.tags && item.tags.length > 0 ? (
                              <View style={styles.dropdownTagChip}>
                                <Text style={styles.dropdownTagChipText}>
                                  {item.tags[0].tag.name}
                                </Text>
                              </View>
                            ) : null}
                            <Text style={styles.dropdownItemSubtitle}>Sub-receita</Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.selectActionContainer}>
                        <MaterialCommunityIcons
                          name="plus-circle-outline"
                          size={22}
                          color={theme.colors.primary}
                        />
                      </View>
                    </TouchableOpacity>
                  )}
                />
              ) : isSearching ? (
                <View style={styles.dropdownEmptyState}>
                  <Text style={styles.dropdownEmptyText}>Buscando receitas...</Text>
                </View>
              ) : searchQuery.trim().length > 0 ? (
                <View style={styles.dropdownEmptyState}>
                  <Text style={styles.dropdownEmptyText}>
                    Nenhuma receita encontrada para &quot;{searchQuery}&quot;
                  </Text>
                </View>
              ) : (
                <View style={styles.dropdownEmptyState}>
                  <Text style={styles.dropdownEmptyText}>
                    Nenhuma sub-receita cadastrada disponível.
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* Error display */}
      {hasError && (
        <View style={styles.errorRow}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={14}
            color={theme.colors.error}
          />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      width: '100%',
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    label: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.espressoDark,
    },
    requiredAsterisk: {
      color: theme.colors.error,
      fontWeight: '700',
    },
    helperText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 8,
    },
    searchContainer: {
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
    inputWrapperFocused: {
      borderColor: theme.colors.primary,
    },
    inputWrapperError: {
      borderColor: theme.colors.error,
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
      maxHeight: 220,
      overflow: 'hidden',
      ...theme.shadows.modal,
    },
    dropdownList: {
      maxHeight: 220,
    },
    dropdownItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 10,
      paddingHorizontal: theme.spacing.space3,
      minHeight: theme.spacing.touchable,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
    },
    dropdownItemContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
    },
    dropdownItemImage: {
      width: 36,
      height: 36,
      borderRadius: theme.rounded.default,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    dropdownItemIconContainer: {
      width: 36,
      height: 36,
      borderRadius: theme.rounded.default,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },
    itemTextContainer: {
      flex: 1,
      gap: 2,
    },
    dropdownItemTitle: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.espressoDark,
    },
    dropdownItemMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    dropdownTagChip: {
      backgroundColor: theme.colors.chips.secondary.background,
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: theme.rounded.full,
    },
    dropdownTagChipText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 10,
      fontWeight: '600',
      color: theme.colors.chips.secondary.text,
    },
    dropdownItemSubtitle: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
    },
    selectActionContainer: {
      minWidth: 40,
      minHeight: 40,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 6,
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
    selectedCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.md,
      padding: 12,
      gap: 10,
      ...theme.shadows.soft,
    },
    selectedCardError: {
      borderColor: theme.colors.error,
    },
    selectedImage: {
      width: 44,
      height: 44,
      borderRadius: theme.rounded.default,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    selectedIconBox: {
      width: 44,
      height: 44,
      borderRadius: theme.rounded.default,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },
    selectedInfo: {
      flex: 1,
      gap: 4,
    },
    selectedTitle: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.espressoDark,
    },
    selectedMetaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 6,
    },
    tagChip: {
      backgroundColor: theme.colors.chips.secondary.background,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: theme.rounded.full,
    },
    tagChipText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.chips.secondary.text,
    },
    subRecipeBadge: {
      backgroundColor: theme.colors.chips.primary.background,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: theme.rounded.full,
    },
    subRecipeBadgeText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.chips.primary.text,
    },
    changeBtn: {
      minWidth: 44,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 22,
    },
    errorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 4,
    },
    errorText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      color: theme.colors.error,
    },
  });
