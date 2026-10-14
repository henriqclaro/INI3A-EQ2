import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

import * as Location from 'expo-location';
import { router } from 'expo-router';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { BakerCard } from '@/src/components/baker/BakerCard';
import { CustomButton } from '@/src/components/common';
import { DEFAULT_POPULAR_TAGS } from '@/src/constants/bakerTags';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { useNearbyBakers } from '@/src/hooks/useBakerProfile';
import { useTags } from '@/src/hooks/useTags';
import { AppTheme } from '@/src/theme/themes';
import { NearbyBakerItem } from '@/src/types/baker-profile';
import { clearImageCache } from '@/src/utils/image';

interface RadiusOption {
  label: string;
  meters: number;
}

const RADIUS_OPTIONS: RadiusOption[] = [
  { label: '5 km', meters: 5000 },
  { label: '10 km', meters: 10000 },
  { label: '15 km', meters: 15000 },
];

export interface NearbyBakersExplorerProps {
  hasIntroHeader?: boolean;
  headerContent?: React.ReactNode;
  isTwoColumnDesktop?: boolean;
}

export function NearbyBakersExplorer({
  hasIntroHeader = true,
  headerContent,
  isTwoColumnDesktop = true,
}: NearbyBakersExplorerProps) {
  const { theme } = useThemeMode();
  const { width } = useWindowDimensions();
  const isDesktop = width >= theme.breakpoints.md;
  const isLargeDesktop = width >= theme.breakpoints.lg;
  const styles = useMemo(
    () => createStyles(theme, isDesktop, isLargeDesktop),
    [theme, isDesktop, isLargeDesktop],
  );

  // Search Mode state
  const [searchMode, setSearchMode] = useState<'location' | 'neighborhood'>('location');
  const isLocationMode = searchMode === 'location';
  const isNeighborhoodMode = searchMode === 'neighborhood';

  // Location search state
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(
    null,
  );
  const [locationLabel, setLocationLabel] = useState<string>('');
  const [isLoadingLocation, setIsLoadingLocation] = useState<boolean>(false);

  // Neighborhood search state
  const [neighborhoodInput, setNeighborhoodInput] = useState<string>('');
  const [activeNeighborhoodQuery, setActiveNeighborhoodQuery] = useState<string>('');
  const [hasNeighborhoodSearched, setHasNeighborhoodSearched] = useState<boolean>(false);

  // Filter state
  const [selectedRadius, setSelectedRadius] = useState<number>(10000); // 10km default
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState<string>('');
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  // Data fetching
  const {
    bakers,
    isLoading: isLoadingBakers,
    isLoadingMore: isLoadingMoreBakers,
    hasMore: hasMoreBakers,
    loadMore: loadMoreBakers,
    hasError,
    errorMessage,
    searchBakers,
    searchBakersByNeighborhood,
  } = useNearbyBakers();
  const { tags: apiTags } = useTags(undefined, 'USER');

  // Combined suggested tags
  const suggestedTags = useMemo(() => {
    const list = [...DEFAULT_POPULAR_TAGS];
    if (apiTags && apiTags.length > 0) {
      for (const t of apiTags) {
        if (!list.some((existing) => existing.toLowerCase() === t.name.toLowerCase())) {
          list.push(t.name);
        }
      }
    }
    return list.slice(0, 10);
  }, [apiTags]);

  const hasLocation = Boolean(userCoords);

  // Query nearby bakers with current filters (Proximity)
  const performSearch = useCallback(
    async (coordsToUse = userCoords, radiusToUse = selectedRadius, tagsToUse = selectedTags) => {
      if (!coordsToUse) {
        Alert.alert(
          'Localização Necessária',
          'Por favor, obtenha sua localização atual via GPS ou alterne para a busca por Bairro / Cidade.',
        );
        return;
      }

      setHasSearched(true);
      await searchBakers({
        lat: coordsToUse.latitude,
        lng: coordsToUse.longitude,
        radius: radiusToUse,
        tags: tagsToUse.length > 0 ? tagsToUse : undefined,
      });
    },
    [userCoords, selectedRadius, selectedTags, searchBakers],
  );

  // Query bakers by neighborhood, city or state
  const performNeighborhoodSearch = useCallback(
    async (searchTerm = neighborhoodInput, tagsToUse = selectedTags) => {
      const query = searchTerm.trim();
      setHasSearched(true);
      setHasNeighborhoodSearched(true);
      setActiveNeighborhoodQuery(query);
      await searchBakersByNeighborhood({
        search: query || undefined,
        tags: tagsToUse.length > 0 ? tagsToUse : undefined,
      });
    },
    [neighborhoodInput, selectedTags, searchBakersByNeighborhood],
  );

  // Request GPS location and reverse geocode address label
  const handleDetectGPSLocation = useCallback(async () => {
    try {
      setIsLoadingLocation(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permissão Negada',
          'A permissão de localização é necessária para encontrar confeitarias próximas a você.',
        );
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      setUserCoords(coords);

      // Attempt reverse geocoding for friendly label
      try {
        const addresses = await Location.reverseGeocodeAsync(coords);
        if (addresses && addresses.length > 0) {
          const addr = addresses[0];
          const neighborhood = addr.district || addr.subregion || '';
          const city = addr.city || addr.subregion || '';
          const label = [neighborhood, city].filter(Boolean).join(', ');
          setLocationLabel(
            label || `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`,
          );
        } else {
          setLocationLabel(`${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`);
        }
      } catch {
        setLocationLabel(`${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`);
      }

      performSearch(coords, selectedRadius, selectedTags);
    } catch (error) {
      console.error('Error detecting GPS location:', error);
      Alert.alert(
        'Erro na Localização',
        'Não foi possível obter sua localização GPS. Verifique se o GPS está ativado ou utilize a busca por Bairro / Cidade.',
      );
    } finally {
      setIsLoadingLocation(false);
    }
  }, [performSearch, selectedRadius, selectedTags]);

  // Handle radius change
  const handleRadiusChange = (meters: number) => {
    setSelectedRadius(meters);
    if (userCoords) {
      performSearch(userCoords, meters, selectedTags);
    }
  };

  // Toggle tag selection
  const handleToggleTag = (tag: string) => {
    const normalizedTag = tag.trim();
    if (!normalizedTag) return;

    let updatedTags: string[];
    if (selectedTags.some((t) => t.toLowerCase() === normalizedTag.toLowerCase())) {
      updatedTags = selectedTags.filter((t) => t.toLowerCase() !== normalizedTag.toLowerCase());
    } else {
      updatedTags = [...selectedTags, normalizedTag];
    }
    setSelectedTags(updatedTags);

    if (isLocationMode && userCoords) {
      performSearch(userCoords, selectedRadius, updatedTags);
    } else if (isNeighborhoodMode && (hasNeighborhoodSearched || neighborhoodInput.trim())) {
      performNeighborhoodSearch(neighborhoodInput, updatedTags);
    }
  };

  // Add custom tag from text input
  const handleAddCustomTag = () => {
    const trimmed = customTagInput.trim();
    if (!trimmed) return;

    if (!selectedTags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      const updated = [...selectedTags, trimmed];
      setSelectedTags(updated);
      setCustomTagInput('');
      if (isLocationMode && userCoords) {
        performSearch(userCoords, selectedRadius, updated);
      } else if (isNeighborhoodMode && (hasNeighborhoodSearched || neighborhoodInput.trim())) {
        performNeighborhoodSearch(neighborhoodInput, updated);
      }
    } else {
      setCustomTagInput('');
    }
  };

  // Handle Baker click
  const handleBakerPress = (baker: NearbyBakerItem) => {
    router.push({
      pathname: '/public-profile',
      params: { id: baker.userId },
    });
  };

  // Refresh handler
  const handleRefresh = () => {
    clearImageCache().catch(() => {});
    if (isLocationMode) {
      if (userCoords) {
        performSearch(userCoords, selectedRadius, selectedTags);
      } else {
        handleDetectGPSLocation();
      }
    } else {
      performNeighborhoodSearch(neighborhoodInput, selectedTags);
    }
  };

  const filterCardContent = (
    <View style={styles.filtersSection}>
      <View style={styles.filtersHeaderRow}>
        <Text style={styles.filtersTitle}>Filtros de Busca</Text>
        <Text style={styles.filtersSubtitle}>
          {isLocationMode ? 'Localização & Raio' : 'Bairro & Cidade'}
        </Text>
      </View>

      <View style={styles.filterCard}>
        {hasIntroHeader && (
          <>
            <View style={styles.heroHeader}>
              <MaterialCommunityIcons
                name="store-search-outline"
                size={32}
                color={theme.colors.primary}
              />
              <View style={styles.heroTextCol}>
                <Text style={styles.heroTitle}>Buscar Confeitarias</Text>
                <Text style={styles.heroSubtitle}>
                  Encontre confeitarias artesanais por proximidade GPS ou por bairro e cidade
                </Text>
              </View>
            </View>
            <View style={styles.sectionDivider} />
          </>
        )}

        {/* Search Mode Switcher Tabs */}
        <View style={styles.modeSwitcherContainer}>
          <TouchableOpacity
            style={[styles.modeTab, isLocationMode && styles.modeTabActive]}
            onPress={() => setSearchMode('location')}
            activeOpacity={0.8}
            accessibilityRole="tab"
            accessibilityState={{ selected: isLocationMode }}
            accessibilityLabel="Buscar por proximidade e raio GPS"
          >
            <MaterialCommunityIcons
              name="crosshairs-gps"
              size={18}
              color={isLocationMode ? theme.colors.onPrimary : theme.colors.espressoDark}
            />
            <Text style={[styles.modeTabText, isLocationMode && styles.modeTabTextActive]}>
              Por Proximidade
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeTab, isNeighborhoodMode && styles.modeTabActive]}
            onPress={() => {
              setSearchMode('neighborhood');
              if (!hasNeighborhoodSearched && !neighborhoodInput.trim()) {
                performNeighborhoodSearch('', selectedTags);
              }
            }}
            activeOpacity={0.8}
            accessibilityRole="tab"
            accessibilityState={{ selected: isNeighborhoodMode }}
            accessibilityLabel="Buscar por bairro, cidade ou estado"
          >
            <MaterialCommunityIcons
              name="city-variant-outline"
              size={18}
              color={isNeighborhoodMode ? theme.colors.onPrimary : theme.colors.espressoDark}
            />
            <Text style={[styles.modeTabText, isNeighborhoodMode && styles.modeTabTextActive]}>
              Por Bairro / Cidade
            </Text>
          </TouchableOpacity>
        </View>

        {isLocationMode ? (
          <>
            <Text style={styles.sectionLabel}>Sua Localização</Text>

            {/* GPS Detection Button */}
            <TouchableOpacity
              style={styles.gpsButton}
              onPress={handleDetectGPSLocation}
              disabled={isLoadingLocation}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Usar localização GPS atual"
            >
              {isLoadingLocation ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <MaterialCommunityIcons
                  name="crosshairs-gps"
                  size={20}
                  color={theme.colors.primary}
                />
              )}
              <Text style={styles.gpsButtonText}>
                {isLoadingLocation ? 'Detectando GPS...' : 'Usar Minha Localização Atual'}
              </Text>
            </TouchableOpacity>

            {/* Active Location Indicator */}
            {hasLocation && (
              <View style={styles.activeLocationBadge}>
                <MaterialCommunityIcons
                  name="map-marker-check"
                  size={16}
                  color={theme.colors.chips.success.text}
                />
                <Text style={styles.activeLocationText} numberOfLines={1}>
                  Localização ativa: {locationLabel || 'Coordenadas GPS registradas'}
                </Text>
              </View>
            )}

            {/* Radius Options */}
            <View style={styles.sectionDivider} />

            <View style={styles.radiusHeaderRow}>
              <Text style={styles.sectionLabel}>Raio de Busca</Text>
              <Text style={styles.radiusHelperText}>Distância máxima em linha reta</Text>
            </View>

            <View style={styles.radiusOptionsRow}>
              {RADIUS_OPTIONS.map((option) => {
                const isSelected = selectedRadius === option.meters;
                return (
                  <TouchableOpacity
                    key={option.meters}
                    style={[
                      styles.radiusChip,
                      isSelected ? styles.radiusChipSelected : styles.radiusChipUnselected,
                    ]}
                    onPress={() => handleRadiusChange(option.meters)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`Raio de ${option.label}`}
                  >
                    <MaterialCommunityIcons
                      name="map-marker-radius"
                      size={16}
                      color={isSelected ? theme.colors.onPrimary : theme.colors.espressoDark}
                    />
                    <Text
                      style={[
                        styles.radiusChipText,
                        isSelected
                          ? styles.radiusChipTextSelected
                          : styles.radiusChipTextUnselected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        ) : (
          <View style={styles.neighborhoodSection}>
            <Text style={styles.sectionLabel}>Bairro, Cidade ou Estado</Text>
            <Text style={styles.tagsHelperText}>
              Pesquise confeitarias cadastradas em qualquer cidade, bairro ou estado
            </Text>

            <View style={styles.manualAddressRow}>
              <View style={styles.manualInputWrapper}>
                <MaterialCommunityIcons
                  name="city-variant-outline"
                  size={18}
                  color={theme.colors.placeholder}
                  style={styles.manualInputIcon}
                />
                <TextInput
                  style={styles.manualInput}
                  placeholder="Ex: Pinheiros, Curitiba, Campinas, SP..."
                  placeholderTextColor={theme.colors.placeholder}
                  value={neighborhoodInput}
                  onChangeText={setNeighborhoodInput}
                  onSubmitEditing={() => performNeighborhoodSearch()}
                  returnKeyType="search"
                />
                {neighborhoodInput.trim().length > 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      setNeighborhoodInput('');
                      performNeighborhoodSearch('', selectedTags);
                    }}
                    style={styles.clearSearchInputBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Limpar texto de busca"
                  >
                    <MaterialCommunityIcons
                      name="close-circle"
                      size={18}
                      color={theme.colors.placeholder}
                    />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity
                style={styles.addressSearchBtn}
                onPress={() => performNeighborhoodSearch()}
                disabled={isLoadingBakers}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Buscar confeitarias por bairro ou cidade"
              >
                {isLoadingBakers ? (
                  <ActivityIndicator size="small" color={theme.colors.onPrimary} />
                ) : (
                  <MaterialCommunityIcons name="magnify" size={20} color={theme.colors.onPrimary} />
                )}
              </TouchableOpacity>
            </View>

            {activeNeighborhoodQuery ? (
              <View style={styles.activeLocationBadge}>
                <MaterialCommunityIcons
                  name="city-variant"
                  size={16}
                  color={theme.colors.chips.success.text}
                />
                <Text style={styles.activeLocationText} numberOfLines={1}>
                  {`Buscando em: "${activeNeighborhoodQuery}"`}
                </Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Tag Filters */}
        <View style={styles.sectionDivider} />

        <Text style={styles.sectionLabel}>Especialidades & Tags</Text>
        <Text style={styles.tagsHelperText}>
          Filtre por tipo de doce ou preferência gastronômica
        </Text>

        {/* Tag suggestions list */}
        <View style={styles.tagsChipsContainer}>
          {suggestedTags.map((tag) => {
            const isSelected = selectedTags.some((t) => t.toLowerCase() === tag.toLowerCase());
            return (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tagPill,
                  isSelected ? styles.tagPillSelected : styles.tagPillUnselected,
                ]}
                onPress={() => handleToggleTag(tag)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Filtrar por ${tag}`}
              >
                {isSelected && (
                  <MaterialCommunityIcons name="check" size={14} color={theme.colors.onPrimary} />
                )}
                <Text
                  style={[
                    styles.tagPillText,
                    isSelected ? styles.tagPillTextSelected : styles.tagPillTextUnselected,
                  ]}
                >
                  {tag}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Custom tag input */}
        <View style={styles.customTagRow}>
          <TextInput
            style={styles.customTagInput}
            placeholder="Adicionar outra tag (ex: Macarons)..."
            placeholderTextColor={theme.colors.placeholder}
            value={customTagInput}
            onChangeText={setCustomTagInput}
            onSubmitEditing={handleAddCustomTag}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={styles.addTagBtn}
            onPress={handleAddCustomTag}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Adicionar tag"
          >
            <MaterialCommunityIcons name="plus" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Active Filters Summary */}
        {selectedTags.length > 0 && (
          <View style={styles.selectedTagsRow}>
            <Text style={styles.selectedTagsCount}>
              {selectedTags.length} {selectedTags.length === 1 ? 'filtro ativo' : 'filtros ativos'}:
            </Text>
            <TouchableOpacity
              onPress={() => {
                setSelectedTags([]);
                if (isLocationMode && userCoords) {
                  performSearch(userCoords, selectedRadius, []);
                } else if (isNeighborhoodMode) {
                  performNeighborhoodSearch(neighborhoodInput, []);
                }
              }}
              style={styles.clearTagsBtn}
              accessibilityRole="button"
              accessibilityLabel="Limpar todos os filtros de tag"
            >
              <Text style={styles.clearTagsText}>Limpar filtros</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  const resultsSectionContent = (
    <View style={styles.resultsSection}>
      {/* Results Header */}
      <View style={styles.resultsHeaderRow}>
        <Text style={styles.resultsTitle}>
          {isLocationMode
            ? hasSearched
              ? `Confeitarias Encontradas (${bakers.length}${hasMoreBakers ? '+' : ''})`
              : 'Confeitarias na Região'
            : hasNeighborhoodSearched
              ? `Confeitarias Encontradas (${bakers.length}${hasMoreBakers ? '+' : ''})`
              : 'Confeitarias por Região'}
        </Text>
        {isLocationMode && hasSearched && (
          <Text style={styles.resultsSubtitle}>Até {(selectedRadius / 1000).toFixed(0)} km</Text>
        )}
        {isNeighborhoodMode && hasNeighborhoodSearched && (
          <Text style={styles.resultsSubtitle}>
            {activeNeighborhoodQuery ? `Em "${activeNeighborhoodQuery}"` : 'Todas as regiões'}
          </Text>
        )}
      </View>

      {/* Baker Cards List */}
      {isLoadingBakers ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>
            {isLocationMode
              ? 'Buscando confeitarias próximas...'
              : 'Buscando confeitarias por bairro/cidade...'}
          </Text>
        </View>
      ) : hasError ? (
        <View style={styles.errorCard}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={36}
            color={theme.colors.error}
          />
          <Text style={styles.errorTitle}>Erro na busca</Text>
          <Text style={styles.errorMessage}>{errorMessage}</Text>
          <CustomButton
            title="Tentar Novamente"
            variant="primary"
            style={styles.retryBtn}
            onPress={() => (isLocationMode ? performSearch() : performNeighborhoodSearch())}
          />
        </View>
      ) : bakers.length > 0 ? (
        <View style={styles.bakersListWrapper}>
          <View style={styles.bakersList}>
            {bakers.map((baker) => (
              <View key={baker.userId} style={styles.bakerCardWrapper}>
                <BakerCard baker={baker} onPress={() => handleBakerPress(baker)} />
              </View>
            ))}
          </View>

          {hasMoreBakers && (
            <View style={styles.paginationWrapper}>
              <CustomButton
                title={
                  isLoadingMoreBakers
                    ? 'Carregando mais confeitarias...'
                    : 'Carregar Mais Confeitarias'
                }
                variant="secondary"
                isDisabled={isLoadingMoreBakers}
                onPress={loadMoreBakers}
                style={styles.loadMoreBtn}
              />
            </View>
          )}

          {!hasMoreBakers && bakers.length >= 10 && (
            <View style={styles.endOfResultsWrapper}>
              <Text style={styles.endOfResultsText}>
                Todas as confeitarias encontradas nesta busca foram exibidas.
              </Text>
            </View>
          )}
        </View>
      ) : isLocationMode && hasSearched ? (
        <View style={styles.emptyCard}>
          <MaterialCommunityIcons
            name="store-off-outline"
            size={48}
            color={theme.colors.placeholder}
          />
          <Text style={styles.emptyTitle}>Nenhuma confeitaria encontrada</Text>
          <Text style={styles.emptyDescription}>
            Não encontramos nenhuma confeitaria num raio de {(selectedRadius / 1000).toFixed(0)} km
            {selectedTags.length > 0 ? ' com as tags selecionadas' : ''}.
          </Text>
          <View style={styles.emptyActions}>
            {selectedRadius < 15000 && (
              <CustomButton
                title="Aumentar raio para 15 km"
                variant="primary"
                style={styles.emptyActionBtn}
                onPress={() => handleRadiusChange(15000)}
              />
            )}
            {selectedTags.length > 0 && (
              <CustomButton
                title="Limpar filtros de tags"
                variant="secondary"
                style={styles.emptyActionBtn}
                onPress={() => {
                  setSelectedTags([]);
                  if (userCoords) performSearch(userCoords, selectedRadius, []);
                }}
              />
            )}
          </View>
        </View>
      ) : isNeighborhoodMode && hasNeighborhoodSearched ? (
        <View style={styles.emptyCard}>
          <MaterialCommunityIcons
            name="store-off-outline"
            size={48}
            color={theme.colors.placeholder}
          />
          <Text style={styles.emptyTitle}>Nenhuma confeitaria encontrada</Text>
          <Text style={styles.emptyDescription}>
            {`Não encontramos confeitarias em "${activeNeighborhoodQuery || 'região informada'}"${selectedTags.length > 0 ? ' com as tags selecionadas' : ''}.`}
          </Text>
          <View style={styles.emptyActions}>
            <CustomButton
              title="Buscar em Todas as Regiões"
              variant="primary"
              style={styles.emptyActionBtn}
              onPress={() => {
                setNeighborhoodInput('');
                performNeighborhoodSearch('', selectedTags);
              }}
            />
            {selectedTags.length > 0 && (
              <CustomButton
                title="Limpar filtros de tags"
                variant="secondary"
                style={styles.emptyActionBtn}
                onPress={() => {
                  setSelectedTags([]);
                  performNeighborhoodSearch(neighborhoodInput, []);
                }}
              />
            )}
          </View>
        </View>
      ) : isNeighborhoodMode && !hasNeighborhoodSearched ? (
        <View style={styles.emptyCard}>
          <MaterialCommunityIcons
            name="city-variant-outline"
            size={48}
            color={theme.colors.primary}
          />
          <Text style={styles.emptyTitle}>Buscar por Bairro ou Cidade</Text>
          <Text style={styles.emptyDescription}>
            Digite um bairro, cidade ou estado acima para listar as confeitarias cadastradas.
          </Text>
          <CustomButton
            title="Listar Todas as Confeitarias"
            variant="primary"
            style={styles.emptyActionBtn}
            onPress={() => performNeighborhoodSearch('', selectedTags)}
          />
        </View>
      ) : !hasLocation ? (
        <View style={styles.emptyCard}>
          <MaterialCommunityIcons
            name="map-marker-question-outline"
            size={48}
            color={theme.colors.primary}
          />
          <Text style={styles.emptyTitle}>Defina sua localização</Text>
          <Text style={styles.emptyDescription}>
            Ative o GPS para listar as confeitarias mais próximas ou alterne para a busca por Bairro
            / Cidade acima.
          </Text>
          <CustomButton
            title="Detectar Localização Atual"
            variant="primary"
            style={styles.emptyActionBtn}
            onPress={handleDetectGPSLocation}
          />
        </View>
      ) : null}
    </View>
  );

  return (
    <KeyboardAwareScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      bottomOffset={64}
      refreshControl={
        <RefreshControl
          refreshing={isLoadingBakers}
          onRefresh={handleRefresh}
          tintColor={theme.colors.primary}
          colors={[theme.colors.primary]}
        />
      }
    >
      <View style={styles.contentWrapper}>
        {headerContent}

        {isDesktop && isTwoColumnDesktop ? (
          <View style={styles.columnsContainer}>
            <View style={styles.leftColumn}>{filterCardContent}</View>
            <View style={styles.rightColumn}>{resultsSectionContent}</View>
          </View>
        ) : (
          <View style={styles.singleColumnContainer}>
            {filterCardContent}
            {resultsSectionContent}
          </View>
        )}
      </View>
    </KeyboardAwareScrollView>
  );
}

const createStyles = (theme: AppTheme, isDesktop: boolean, isLargeDesktop: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      paddingHorizontal: isDesktop ? 32 : theme.spacing.marginMobile,
      paddingTop: isDesktop ? theme.spacing.space6 : theme.spacing.space4,
      paddingBottom: theme.spacing.space16,
      alignItems: 'center',
    },
    contentWrapper: {
      width: '100%',
      maxWidth: isDesktop ? (isLargeDesktop ? 1200 : 1040) : 480,
      gap: theme.spacing.space4,
    },
    columnsContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: isLargeDesktop ? 24 : 16,
      width: '100%',
    },
    singleColumnContainer: {
      width: '100%',
      gap: theme.spacing.space4,
    },
    leftColumn: {
      flex: 1,
      minWidth: 0,
      gap: theme.spacing.space4,
    },
    rightColumn: {
      flex: 1,
      minWidth: 0,
      gap: theme.spacing.space4,
    },
    filtersSection: {
      width: '100%',
      gap: theme.spacing.space3,
    },
    resultsSection: {
      width: '100%',
      gap: theme.spacing.space3,
    },
    filtersHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.space1,
      minHeight: 28,
    },
    filtersTitle: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.espressoDark,
      letterSpacing: 0.3,
    },
    filtersSubtitle: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
    filterCard: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.rounded.lg,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: theme.spacing.space5,
      ...theme.shadows.soft,
      gap: theme.spacing.space3,
    },
    heroHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.space3,
    },
    heroTextCol: {
      flex: 1,
    },
    heroTitle: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.espressoDark,
      letterSpacing: 0.4,
    },
    heroSubtitle: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
      lineHeight: 18,
    },
    modeSwitcherContainer: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surfaceContainerLow,
      borderRadius: theme.rounded.full,
      padding: 4,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      gap: 4,
    },
    modeTab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
      paddingHorizontal: 12,
      borderRadius: theme.rounded.full,
      gap: 6,
    },
    modeTabActive: {
      backgroundColor: theme.colors.primary,
      ...theme.shadows.soft,
    },
    modeTabText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.espressoDark,
    },
    modeTabTextActive: {
      color: theme.colors.onPrimary,
      fontWeight: '700',
    },
    neighborhoodSection: {
      gap: theme.spacing.space3,
    },
    clearSearchInputBtn: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sectionDivider: {
      height: 1,
      backgroundColor: theme.colors.outlineVariant,
      marginVertical: theme.spacing.space1,
    },
    sectionLabel: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.espressoDark,
      letterSpacing: 0.2,
    },
    gpsButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.default,
      paddingHorizontal: theme.spacing.space4,
      minHeight: theme.spacing.touchable,
      gap: 8,
    },
    gpsButtonText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    manualAddressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.space2,
    },
    manualInputWrapper: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.default,
      paddingHorizontal: theme.spacing.space3,
      minHeight: theme.spacing.touchable,
    },
    manualInputIcon: {
      marginRight: 6,
    },
    manualInput: {
      flex: 1,
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 14,
      color: theme.colors.onSurface,
      minHeight: 44,
    },
    addressSearchBtn: {
      width: 48,
      height: 48,
      backgroundColor: theme.colors.primary,
      borderRadius: theme.rounded.default,
      alignItems: 'center',
      justifyContent: 'center',
    },
    activeLocationBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.chips.success.background,
      borderRadius: theme.rounded.full,
      paddingHorizontal: theme.spacing.space3,
      paddingVertical: 6,
      gap: 6,
    },
    activeLocationText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.chips.success.text,
      flex: 1,
    },
    radiusHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
    },
    radiusHelperText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    radiusOptionsRow: {
      flexDirection: 'row',
      gap: theme.spacing.space2,
    },
    radiusChip: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: theme.spacing.touchable,
      borderRadius: theme.rounded.default,
      borderWidth: 1,
      gap: 6,
      paddingHorizontal: theme.spacing.space2,
    },
    radiusChipUnselected: {
      backgroundColor: theme.colors.surfaceContainerLow,
      borderColor: theme.colors.outlineVariant,
    },
    radiusChipSelected: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    radiusChipText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '700',
    },
    radiusChipTextUnselected: {
      color: theme.colors.espressoDark,
    },
    radiusChipTextSelected: {
      color: theme.colors.onPrimary,
    },
    tagsHelperText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginTop: -4,
    },
    tagsChipsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    tagPill: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: theme.rounded.full,
      borderWidth: 1,
      gap: 4,
      minHeight: 34,
    },
    tagPillUnselected: {
      backgroundColor: theme.colors.surfaceContainerLow,
      borderColor: theme.colors.outlineVariant,
    },
    tagPillSelected: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    tagPillText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 12,
      fontWeight: '600',
    },
    tagPillTextUnselected: {
      color: theme.colors.onSurface,
    },
    tagPillTextSelected: {
      color: theme.colors.onPrimary,
    },
    customTagRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.space2,
      marginTop: theme.spacing.space1,
    },
    customTagInput: {
      flex: 1,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.default,
      paddingHorizontal: theme.spacing.space3,
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurface,
      minHeight: theme.spacing.touchable,
    },
    addTagBtn: {
      width: 48,
      height: 48,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.default,
      alignItems: 'center',
      justifyContent: 'center',
    },
    selectedTagsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: theme.spacing.space1,
    },
    selectedTagsCount: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    clearTagsBtn: {
      paddingVertical: 4,
      paddingHorizontal: 8,
    },
    clearTagsText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    resultsHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.space1,
      minHeight: 28,
    },
    resultsTitle: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.espressoDark,
      letterSpacing: 0.3,
    },
    resultsSubtitle: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
    bakersListWrapper: {
      width: '100%',
      gap: theme.spacing.space3,
    },
    bakersList: {
      width: '100%',
      flexDirection: 'column',
      gap: theme.spacing.space3,
    },
    bakerCardWrapper: {
      width: '100%',
    },
    paginationWrapper: {
      width: '100%',
      alignItems: 'center',
      marginTop: theme.spacing.space2,
    },
    loadMoreBtn: {
      minWidth: 240,
      minHeight: theme.spacing.touchable,
    },
    endOfResultsWrapper: {
      width: '100%',
      alignItems: 'center',
      paddingVertical: theme.spacing.space3,
    },
    endOfResultsText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
    },
    loadingContainer: {
      paddingVertical: 40,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },
    loadingText: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
    errorCard: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.rounded.lg,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: theme.spacing.space5,
      alignItems: 'center',
      gap: 8,
      ...theme.shadows.soft,
    },
    errorTitle: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.error,
    },
    errorMessage: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      marginBottom: 8,
    },
    retryBtn: {
      minWidth: 180,
    },
    emptyCard: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.rounded.lg,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: theme.spacing.space6,
      alignItems: 'center',
      gap: 10,
      ...theme.shadows.soft,
    },
    emptyTitle: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 17,
      fontWeight: '700',
      color: theme.colors.espressoDark,
      textAlign: 'center',
    },
    emptyDescription: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      lineHeight: 18,
      marginBottom: 6,
    },
    emptyActions: {
      width: '100%',
      gap: 8,
      alignItems: 'center',
    },
    emptyActionBtn: {
      width: '100%',
      maxWidth: 260,
    },
  });
