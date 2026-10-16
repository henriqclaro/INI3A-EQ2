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

import { Image } from 'expo-image';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useThemeMode } from '@/src/contexts/ThemeContext';
import { DownloadedRecipeService } from '@/src/services/downloadedRecipes';
import { OfflineCacheService } from '@/src/services/offlineCache';
import { RecipeService } from '@/src/services/recipe';
import { UserService } from '@/src/services/user';
import { AppTheme } from '@/src/theme/themes';
import { PartialRecipe } from '@/src/types/recipe';
import { PartialTag } from '@/src/types/tag';
import { getStorageUrl } from '@/src/utils/image';
import { getTagColors } from '@/src/utils/tag';

export type RecipeOrigin = 'OWN' | 'SAVED' | 'DOWNLOADED';

export interface RecipeWithOrigin extends PartialRecipe {
  origins?: RecipeOrigin[];
}

export interface RecipeSelectorProps {
  selectedRecipeId?: string | null;
  selectedRecipe?: PartialRecipe | null;
  onSelectRecipe: (recipe: PartialRecipe | null) => void;
  userId?: string;
  onlyUserRecipes?: boolean;
  includeSavedAndDownloaded?: boolean;
  excludeRecipeId?: string;
  excludeRecipeIds?: string[];
  label?: string;
  placeholder?: string;
  helperText?: string;
  error?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  canClear?: boolean;
  initialRecipes?: PartialRecipe[];
  isDropdownOpenByDefault?: boolean;
}

export function RecipeSelector({
  selectedRecipeId,
  selectedRecipe,
  onSelectRecipe,
  userId,
  onlyUserRecipes = true,
  includeSavedAndDownloaded = false,
  excludeRecipeId,
  excludeRecipeIds = [],
  label = 'Sub-receita',
  placeholder = 'Buscar sub-receita (ex: Brigadeiro)...',
  helperText,
  error,
  isRequired = false,
  isDisabled = false,
  canClear = true,
  initialRecipes = [],
  isDropdownOpenByDefault = false,
}: RecipeSelectorProps) {
  const { theme } = useThemeMode();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PartialRecipe[]>([]);
  const [combinedRecipes, setCombinedRecipes] = useState<RecipeWithOrigin[]>([]);
  const [activeOriginFilter, setActiveOriginFilter] = useState<'ALL' | RecipeOrigin>('ALL');
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(Boolean(isDropdownOpenByDefault));
  const [fetchedRecipe, setFetchedRecipe] = useState<PartialRecipe | null>(null);

  const [prevSelectedRecipe, setPrevSelectedRecipe] = useState(selectedRecipe);
  if (selectedRecipe !== prevSelectedRecipe) {
    setPrevSelectedRecipe(selectedRecipe);
    if (!selectedRecipe && isDropdownOpenByDefault) {
      setIsDropdownVisible(true);
    }
  }

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load combined user, saved, and downloaded recipes when enabled
  useEffect(() => {
    let isMounted = true;

    if (!includeSavedAndDownloaded) {
      return;
    }

    async function load() {
      setIsSearching(true);
      try {
        const [userRes, savesRes, downloadedList] = await Promise.all([
          userId ? UserService.getRecipes(userId).catch(() => null) : null,
          userId ? UserService.getSavedRecipes(userId).catch(() => null) : null,
          DownloadedRecipeService.getAllDownloadedRecipes().catch(() => []),
        ]);

        if (!isMounted) return;

        const userList = userRes?.data?.recipes || (await OfflineCacheService.getUserRecipes());
        const savedList =
          savesRes?.data?.userSaves || (await OfflineCacheService.getSavedRecipes());

        const recipeMap = new Map<string, RecipeWithOrigin>();

        // 1. User's own recipes
        for (const r of userList) {
          if (r.status === 'ARCHIVED') continue;
          recipeMap.set(r.id, {
            ...r,
            origins: ['OWN'],
          });
        }

        // 2. Saved recipes
        for (const s of savedList) {
          const existing = recipeMap.get(s.recipe.id);
          if (existing) {
            if (!existing.origins?.includes('SAVED')) {
              existing.origins = [...(existing.origins || []), 'SAVED'];
            }
          } else {
            recipeMap.set(s.recipe.id, {
              id: s.recipe.id,
              title: s.recipe.title,
              coverUrl: s.recipe.coverUrl,
              baseYield: s.recipe.baseYield,
              yieldUnit: s.recipe.yieldUnit,
              prepTimeMinutes: s.recipe.prepTimeMinutes,
              status: s.recipe.status,
              tags: s.recipe.tags ?? [],
              profitMargin: s.recipe.profitMargin,
              overhead: s.recipe.overhead,
              hourlyLabor: s.recipe.hourlyLabor,
              packagingCost: s.recipe.packagingCost,
              createdAt: s.savedAt,
              updatedAt: s.recipe.updatedAt ?? s.savedAt,
              origins: ['SAVED'],
            });
          }
        }

        // 3. Downloaded recipes
        for (const d of downloadedList) {
          const existing = recipeMap.get(d.id);
          if (existing) {
            if (!existing.origins?.includes('DOWNLOADED')) {
              existing.origins = [...(existing.origins || []), 'DOWNLOADED'];
            }
            if (!existing.baseYield && d.recipe.baseYield) {
              existing.baseYield = d.recipe.baseYield;
            }
            if (!existing.yieldUnit && d.recipe.yieldUnit) {
              existing.yieldUnit = d.recipe.yieldUnit;
            }
          } else {
            recipeMap.set(d.id, {
              id: d.recipe.id,
              title: d.recipe.title,
              coverUrl: d.recipe.coverUrl,
              baseYield: d.recipe.baseYield,
              yieldUnit: d.recipe.yieldUnit,
              prepTimeMinutes: d.recipe.prepTimeMinutes,
              status: d.recipe.status,
              tags: ((d.recipe as { tags?: { tag: PartialTag }[] }).tags ?? []) as {
                tag: PartialTag;
              }[],
              parent: d.recipe.parent ?? null,
              profitMargin: d.recipe.profitMargin,
              overhead: d.recipe.overhead,
              hourlyLabor: d.recipe.hourlyLabor,
              packagingCost: d.recipe.packagingCost,
              createdAt: d.recipe.createdAt,
              updatedAt: d.recipe.updatedAt,
              origins: ['DOWNLOADED'],
            });
          }
        }

        if (isMounted) {
          setCombinedRecipes(Array.from(recipeMap.values()));
        }
      } catch (err) {
        console.warn('Error loading combined recipes for RecipeSelector:', err);
      } finally {
        if (isMounted) {
          setIsSearching(false);
        }
      }
    }

    load();

    const unsubscribe = DownloadedRecipeService.subscribe(() => {
      load();
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [includeSavedAndDownloaded, userId]);

  // Active selected recipe resolution
  const activeRecipe: PartialRecipe | null = useMemo(() => {
    if (selectedRecipe) return selectedRecipe;
    if (!selectedRecipeId) return null;

    if (includeSavedAndDownloaded) {
      const fromCombined = combinedRecipes.find((r) => r.id === selectedRecipeId);
      if (fromCombined) return fromCombined;
    }

    const fromInitial = initialRecipes.find((r) => r.id === selectedRecipeId);
    if (fromInitial) return fromInitial;

    const fromSearch = searchResults.find((r) => r.id === selectedRecipeId);
    if (fromSearch) return fromSearch;

    if (fetchedRecipe && fetchedRecipe.id === selectedRecipeId) {
      return fetchedRecipe;
    }

    return null;
  }, [
    selectedRecipe,
    selectedRecipeId,
    includeSavedAndDownloaded,
    combinedRecipes,
    initialRecipes,
    searchResults,
    fetchedRecipe,
  ]);

  const activeRecipeOrigins: RecipeOrigin[] | undefined = useMemo(() => {
    if (!activeRecipe) return undefined;
    const withOrigin = activeRecipe as RecipeWithOrigin;
    if (withOrigin.origins && withOrigin.origins.length > 0) {
      return withOrigin.origins;
    }
    const found = combinedRecipes.find((r) => r.id === activeRecipe.id);
    return found?.origins;
  }, [activeRecipe, combinedRecipes]);

  // Derived list of recipes to display based on query & initial list
  const currentList = useMemo(() => {
    if (includeSavedAndDownloaded) {
      let list = combinedRecipes;
      if (activeOriginFilter !== 'ALL') {
        list = list.filter((r) => r.origins?.includes(activeOriginFilter));
      }
      if (searchQuery.trim()) {
        const lower = searchQuery.toLowerCase();
        list = list.filter(
          (r) =>
            r.title.toLowerCase().includes(lower) ||
            r.tags?.some((t) => t.tag?.name.toLowerCase().includes(lower)),
        );
      }
      return list;
    }

    if (!searchQuery.trim() && searchResults.length === 0 && initialRecipes.length > 0) {
      return initialRecipes;
    }
    return searchResults;
  }, [
    includeSavedAndDownloaded,
    combinedRecipes,
    activeOriginFilter,
    searchQuery,
    searchResults,
    initialRecipes,
  ]);

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

    if (includeSavedAndDownloaded) {
      return;
    }

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
    if (!includeSavedAndDownloaded && searchResults.length === 0) {
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
    setIsDropdownVisible(Boolean(isDropdownOpenByDefault));
  };

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Filter available suggestions (excluding current recipe if editing or already planned)
  const availableSuggestions = useMemo(() => {
    return currentList.filter((r) => {
      if (excludeRecipeId && r.id === excludeRecipeId) return false;
      if (excludeRecipeIds.length > 0 && excludeRecipeIds.includes(r.id)) return false;
      return true;
    });
  }, [currentList, excludeRecipeId, excludeRecipeIds]);

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
              source={{ uri: getStorageUrl(activeRecipe.coverUrl, activeRecipe.updatedAt) }}
              style={styles.selectedImage}
              contentFit="cover"
              cachePolicy="memory-disk"
              recyclingKey={getStorageUrl(activeRecipe.coverUrl, activeRecipe.updatedAt)}
              transition={150}
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
              {activeRecipe.tags &&
                activeRecipe.tags.length > 0 &&
                (() => {
                  const tagStyle = getTagColors(activeRecipe.tags[0].tag.type, theme);
                  return (
                    <View
                      style={[
                        styles.tagChip,
                        {
                          backgroundColor: tagStyle.backgroundColor,
                          borderColor: tagStyle.borderColor,
                        },
                      ]}
                    >
                      <Text style={[styles.tagChipText, { color: tagStyle.textColor }]}>
                        {activeRecipe.tags[0].tag.name}
                      </Text>
                    </View>
                  );
                })()}

              {activeRecipeOrigins && activeRecipeOrigins.length > 0 ? (
                activeRecipeOrigins.map((origin) => (
                  <View
                    key={origin}
                    style={[
                      styles.originBadge,
                      origin === 'OWN' && styles.originBadgeOwn,
                      origin === 'SAVED' && styles.originBadgeSaved,
                      origin === 'DOWNLOADED' && styles.originBadgeDownloaded,
                    ]}
                  >
                    {origin === 'SAVED' && (
                      <MaterialCommunityIcons
                        name="bookmark-outline"
                        size={12}
                        color={theme.colors.secondary}
                      />
                    )}
                    {origin === 'DOWNLOADED' && (
                      <MaterialCommunityIcons
                        name="cloud-check-outline"
                        size={12}
                        color={theme.colors.tertiary}
                      />
                    )}
                    <Text
                      style={[
                        styles.originBadgeText,
                        origin === 'OWN' && styles.originBadgeTextOwn,
                        origin === 'SAVED' && styles.originBadgeTextSaved,
                        origin === 'DOWNLOADED' && styles.originBadgeTextDownloaded,
                      ]}
                    >
                      {origin === 'OWN' ? 'Própria' : origin === 'SAVED' ? 'Salva' : 'Baixada'}
                    </Text>
                  </View>
                ))
              ) : (
                <View style={styles.subRecipeBadge}>
                  <Text style={styles.subRecipeBadgeText}>Sub-receita</Text>
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
          {includeSavedAndDownloaded && (
            <View style={styles.filterTabsRow}>
              <TouchableOpacity
                style={[styles.filterTab, activeOriginFilter === 'ALL' && styles.filterTabActive]}
                onPress={() => {
                  setActiveOriginFilter('ALL');
                  setIsDropdownVisible(true);
                }}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Exibir todas as receitas"
              >
                <Text
                  style={[
                    styles.filterTabText,
                    activeOriginFilter === 'ALL' && styles.filterTabTextActive,
                  ]}
                >
                  Todas ({combinedRecipes.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterTab, activeOriginFilter === 'OWN' && styles.filterTabActive]}
                onPress={() => {
                  setActiveOriginFilter('OWN');
                  setIsDropdownVisible(true);
                }}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Exibir receitas próprias"
              >
                <Text
                  style={[
                    styles.filterTabText,
                    activeOriginFilter === 'OWN' && styles.filterTabTextActive,
                  ]}
                >
                  Próprias
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterTab, activeOriginFilter === 'SAVED' && styles.filterTabActive]}
                onPress={() => {
                  setActiveOriginFilter('SAVED');
                  setIsDropdownVisible(true);
                }}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Exibir receitas salvas"
              >
                <Text
                  style={[
                    styles.filterTabText,
                    activeOriginFilter === 'SAVED' && styles.filterTabTextActive,
                  ]}
                >
                  Salvas
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterTab,
                  activeOriginFilter === 'DOWNLOADED' && styles.filterTabActive,
                ]}
                onPress={() => {
                  setActiveOriginFilter('DOWNLOADED');
                  setIsDropdownVisible(true);
                }}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Exibir receitas baixadas"
              >
                <Text
                  style={[
                    styles.filterTabText,
                    activeOriginFilter === 'DOWNLOADED' && styles.filterTabTextActive,
                  ]}
                >
                  Baixadas
                </Text>
              </TouchableOpacity>
            </View>
          )}

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
                      accessibilityLabel={`Selecionar receita ${item.title}`}
                    >
                      <View style={styles.dropdownItemContent}>
                        {item.coverUrl ? (
                          <Image
                            source={{ uri: getStorageUrl(item.coverUrl, item.updatedAt) }}
                            style={styles.dropdownItemImage}
                            contentFit="cover"
                            cachePolicy="memory-disk"
                            recyclingKey={getStorageUrl(item.coverUrl, item.updatedAt)}
                            transition={150}
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
                            {item.tags &&
                              item.tags.length > 0 &&
                              (() => {
                                const tagStyle = getTagColors(item.tags[0].tag.type, theme);
                                return (
                                  <View
                                    style={[
                                      styles.dropdownTagChip,
                                      {
                                        backgroundColor: tagStyle.backgroundColor,
                                        borderColor: tagStyle.borderColor,
                                      },
                                    ]}
                                  >
                                    <Text
                                      style={[
                                        styles.dropdownTagChipText,
                                        { color: tagStyle.textColor },
                                      ]}
                                    >
                                      {item.tags[0].tag.name}
                                    </Text>
                                  </View>
                                );
                              })()}

                            {includeSavedAndDownloaded || (item as RecipeWithOrigin).origins ? (
                              (item as RecipeWithOrigin).origins?.map((origin) => (
                                <View
                                  key={origin}
                                  style={[
                                    styles.originBadge,
                                    origin === 'OWN' && styles.originBadgeOwn,
                                    origin === 'SAVED' && styles.originBadgeSaved,
                                    origin === 'DOWNLOADED' && styles.originBadgeDownloaded,
                                  ]}
                                >
                                  {origin === 'SAVED' && (
                                    <MaterialCommunityIcons
                                      name="bookmark-outline"
                                      size={11}
                                      color={theme.colors.secondary}
                                    />
                                  )}
                                  {origin === 'DOWNLOADED' && (
                                    <MaterialCommunityIcons
                                      name="cloud-check-outline"
                                      size={11}
                                      color={theme.colors.tertiary}
                                    />
                                  )}
                                  <Text
                                    style={[
                                      styles.originBadgeText,
                                      origin === 'OWN' && styles.originBadgeTextOwn,
                                      origin === 'SAVED' && styles.originBadgeTextSaved,
                                      origin === 'DOWNLOADED' && styles.originBadgeTextDownloaded,
                                    ]}
                                  >
                                    {origin === 'OWN'
                                      ? 'Própria'
                                      : origin === 'SAVED'
                                        ? 'Salva'
                                        : 'Baixada'}
                                  </Text>
                                </View>
                              ))
                            ) : (
                              <Text style={styles.dropdownItemSubtitle}>Sub-receita</Text>
                            )}
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
                    {includeSavedAndDownloaded
                      ? 'Nenhuma receita disponível (própria, salva ou baixada).'
                      : 'Nenhuma sub-receita cadastrada disponível.'}
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
      borderWidth: 1,
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
      borderWidth: 1,
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
    filterTabsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 10,
    },
    filterTab: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      minHeight: theme.spacing.touchable,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: theme.rounded.full,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    filterTabActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    filterTabText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
    },
    filterTabTextActive: {
      color: theme.colors.onPrimary,
    },
    originBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: theme.rounded.full,
      borderWidth: 1,
    },
    originBadgeOwn: {
      backgroundColor: theme.colors.chips.primary.background,
      borderColor: theme.colors.outlineVariant,
    },
    originBadgeSaved: {
      backgroundColor: theme.colors.chips.secondary.background,
      borderColor: theme.colors.outlineVariant,
    },
    originBadgeDownloaded: {
      backgroundColor: theme.colors.chips.success.background,
      borderColor: theme.colors.outlineVariant,
    },
    originBadgeText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 10,
      fontWeight: '600',
    },
    originBadgeTextOwn: {
      color: theme.colors.chips.primary.text,
    },
    originBadgeTextSaved: {
      color: theme.colors.chips.secondary.text,
    },
    originBadgeTextDownloaded: {
      color: theme.colors.chips.success.text,
    },
  });
