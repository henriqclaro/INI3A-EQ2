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

import { useThemeMode } from '@/src/contexts/ThemeContext';
import { IngredientService } from '@/src/services/ingredient';
import { AppTheme } from '@/src/theme/themes';
import { PartialIngredient } from '@/src/types/ingredient';
import { matchesSearch } from '@/src/utils/text';

export interface IngredientSelectorProps {
  selectedIngredientId?: number | string | null;
  selectedIngredient?: PartialIngredient | null;
  onSelectIngredient: (ingredient: PartialIngredient | null) => void;
  label?: string;
  placeholder?: string;
  helperText?: string;
  error?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  canClear?: boolean;
  initialIngredients?: PartialIngredient[];
  excludeIngredientIds?: (number | string)[];
}

export function IngredientSelector({
  selectedIngredientId,
  selectedIngredient,
  onSelectIngredient,
  label = 'Ingrediente',
  placeholder = 'Buscar insumo (ex: Leite, Farinha)...',
  helperText,
  error,
  isRequired = false,
  isDisabled = false,
  canClear = true,
  initialIngredients = [],
  excludeIngredientIds = [],
}: IngredientSelectorProps) {
  const { theme } = useThemeMode();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PartialIngredient[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [fetchedIngredient, setFetchedIngredient] = useState<PartialIngredient | null>(null);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Excluded ID set
  const excludedIdsSet = useMemo(
    () => new Set(excludeIngredientIds.map((id) => String(id))),
    [excludeIngredientIds],
  );

  // Active selected ingredient resolution
  const activeIngredient: PartialIngredient | null = useMemo(() => {
    if (selectedIngredient) return selectedIngredient;
    if (!selectedIngredientId) return null;

    const fromInitial = initialIngredients.find(
      (ing) => String(ing.id) === String(selectedIngredientId),
    );
    if (fromInitial) return fromInitial;

    const fromSearch = searchResults.find((ing) => String(ing.id) === String(selectedIngredientId));
    if (fromSearch) return fromSearch;

    if (fetchedIngredient && String(fetchedIngredient.id) === String(selectedIngredientId)) {
      return fetchedIngredient;
    }

    return null;
  }, [
    selectedIngredient,
    selectedIngredientId,
    initialIngredients,
    searchResults,
    fetchedIngredient,
  ]);

  // Derived list of ingredients to display based on query & initial list
  const currentList = useMemo(() => {
    if (searchResults.length > 0) {
      return searchResults;
    }
    if (initialIngredients.length > 0) {
      if (!searchQuery.trim()) {
        return initialIngredients;
      }
      return initialIngredients.filter(
        (ing) => matchesSearch(ing.name, searchQuery) || matchesSearch(ing.category, searchQuery),
      );
    }
    return [];
  }, [searchQuery, searchResults, initialIngredients]);

  // Fetch ingredient details if only ID is provided but object not found
  useEffect(() => {
    let isCurrent = true;

    if (selectedIngredientId && !activeIngredient) {
      IngredientService.search(undefined, 0)
        .then((res) => {
          if (!isCurrent) return;
          const found = res?.data?.ingredients?.find(
            (i) => String(i.id) === String(selectedIngredientId),
          );
          if (found) {
            setFetchedIngredient(found);
          }
        })
        .catch((err) => {
          console.error('Error finding ingredient by ID:', err);
        });
    }

    return () => {
      isCurrent = false;
    };
  }, [selectedIngredientId, activeIngredient]);

  const fetchSuggestions = useCallback(async (term: string) => {
    setIsSearching(true);
    try {
      const res = await IngredientService.search(term.trim() || undefined);
      setSearchResults(res.data.ingredients || []);
    } catch (err) {
      console.error('Error searching ingredients:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

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

  const handleSelect = (item: PartialIngredient) => {
    onSelectIngredient(item);
    setSearchQuery('');
    setIsDropdownVisible(false);
  };

  const handleClear = () => {
    if (isDisabled) return;
    onSelectIngredient(null);
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

  // Filter available suggestions (excluding blocked IDs)
  const availableSuggestions = useMemo(() => {
    return currentList.filter((ing) => !excludedIdsSet.has(String(ing.id)));
  }, [currentList, excludedIdsSet]);

  const hasSelected = Boolean(activeIngredient);
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

      {/* When an ingredient IS selected, show selected artisan card */}
      {hasSelected && activeIngredient ? (
        <View style={[styles.selectedCard, hasError && styles.selectedCardError]}>
          <View style={styles.selectedIconBox}>
            <MaterialCommunityIcons
              name="food-apple-outline"
              size={22}
              color={theme.colors.primary}
            />
          </View>

          <View style={styles.selectedInfo}>
            <Text style={styles.selectedTitle} numberOfLines={1}>
              {activeIngredient.name}
            </Text>

            <View style={styles.selectedMetaRow}>
              {Boolean(activeIngredient.category) && (
                <View style={styles.categoryChip}>
                  <Text style={styles.categoryChipText}>{activeIngredient.category}</Text>
                </View>
              )}

              <View style={styles.unitChip}>
                <Text style={styles.unitChipText}>
                  Unidade: {activeIngredient.baseUnit || 'un'}
                </Text>
              </View>

              {Boolean(activeIngredient.baseDimension) && (
                <View style={styles.dimensionChip}>
                  <Text style={styles.dimensionChipText}>
                    {activeIngredient.baseDimension === 'MASS'
                      ? 'Massa'
                      : activeIngredient.baseDimension === 'VOLUME'
                        ? 'Volume'
                        : 'Unidade'}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {canClear && !isDisabled && (
            <TouchableOpacity
              style={styles.changeBtn}
              onPress={handleClear}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Trocar ou remover insumo selecionado"
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
        /* When NO ingredient is selected, show Search Input + Dropdown */
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
                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled
                  style={styles.dropdownList}
                >
                  {availableSuggestions.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.dropdownItem}
                      onPress={() => handleSelect(item)}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={`Selecionar insumo ${item.name}`}
                    >
                      <View style={styles.dropdownItemContent}>
                        <View style={styles.itemIconContainer}>
                          <MaterialCommunityIcons
                            name="food-apple-outline"
                            size={16}
                            color={theme.colors.primary}
                          />
                        </View>

                        <View style={styles.itemTextContainer}>
                          <Text style={styles.dropdownItemTitle} numberOfLines={1}>
                            {item.name}
                          </Text>

                          <View style={styles.dropdownItemMetaRow}>
                            <View style={styles.dropdownCategoryChip}>
                              <Text style={styles.dropdownCategoryChipText}>{item.category}</Text>
                            </View>
                            <Text style={styles.dropdownItemUnitText}>
                              Unidade: {item.baseUnit || 'un'}
                            </Text>
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
                  ))}
                </ScrollView>
              ) : isSearching ? (
                <View style={styles.dropdownEmptyState}>
                  <Text style={styles.dropdownEmptyText}>Buscando insumos...</Text>
                </View>
              ) : searchQuery.trim().length > 0 ? (
                <View style={styles.dropdownEmptyState}>
                  <Text style={styles.dropdownEmptyText}>
                    Nenhum insumo encontrado para &quot;{searchQuery}&quot;
                  </Text>
                </View>
              ) : (
                <View style={styles.dropdownEmptyState}>
                  <Text style={styles.dropdownEmptyText}>
                    Nenhum insumo disponível no catálogo.
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
    itemIconContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
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
    dropdownCategoryChip: {
      backgroundColor: theme.colors.chips.secondary.background,
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: theme.rounded.full,
    },
    dropdownCategoryChipText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 10,
      fontWeight: '600',
      color: theme.colors.chips.secondary.text,
    },
    dropdownItemUnitText: {
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
    selectedIconBox: {
      width: 40,
      height: 40,
      borderRadius: 20,
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
    categoryChip: {
      backgroundColor: theme.colors.chips.secondary.background,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: theme.rounded.full,
    },
    categoryChipText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.chips.secondary.text,
    },
    unitChip: {
      backgroundColor: theme.colors.chips.accent.background,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: theme.rounded.full,
    },
    unitChipText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.chips.accent.text,
    },
    dimensionChip: {
      backgroundColor: theme.colors.surfaceContainerLow,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: theme.rounded.full,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    dimensionChipText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 10,
      fontWeight: '500',
      color: theme.colors.onSurfaceVariant,
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
