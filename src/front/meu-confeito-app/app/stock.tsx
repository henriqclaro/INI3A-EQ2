import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

import { Stack, router, useFocusEffect } from 'expo-router';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import {
  AddStockCard,
  CustomButton,
  Input,
  StockCard,
  StockOperationModal,
  StockOperationType,
  StockSummaryBanner,
} from '@/src/components';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { useInventory } from '@/src/hooks/useInventory';
import { AppTheme } from '@/src/theme/themes';
import { InventoryItem } from '@/src/types/inventory';
import { isExpired, isExpiringSoon } from '@/src/utils/formatters';

type FilterType = 'all' | 'in_stock' | 'out_of_stock' | 'expired' | 'expiring';

export default function StockScreen() {
  const { theme } = useThemeMode();
  const { width } = useWindowDimensions();

  const {
    inventory,
    isLoading,
    error,
    refetch,
    registerAdjustment,
    registerPurchase,
    registerWaste,
  } = useInventory();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');

  // Operation Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [modalMode, setModalMode] = useState<StockOperationType>('adjust');

  const isMobile = width < 768;
  const containerWidth = Math.min(width - (isMobile ? 32 : 48), 1200);
  const numCols = isMobile ? 1 : Math.max(1, Math.min(3, Math.floor(containerWidth / 340)));
  const cardWidth = isMobile
    ? Math.min(width - 32, 480)
    : Math.floor((containerWidth - (numCols - 1) * 16) / numCols);

  // Calculations for summary metrics
  const summaryMetrics = useMemo(() => {
    let totalItems = 0;
    let totalStockValue = 0;
    let outOfStockCount = 0;
    let expiringSoonCount = 0;
    let expiredCount = 0;

    for (const item of inventory) {
      totalItems += 1;
      const qty = Number(item.currentQuantity) || 0;
      const unitCost = Number(item.costPerBaseUnit) || 0;
      totalStockValue += qty * unitCost;

      if (qty <= 0) {
        outOfStockCount += 1;
      } else if (isExpired(item.expirationDate)) {
        expiredCount += 1;
      } else if (isExpiringSoon(item.expirationDate)) {
        expiringSoonCount += 1;
      }
    }

    return {
      totalItems,
      totalStockValue,
      outOfStockCount,
      expiringSoonCount,
      expiredCount,
    };
  }, [inventory]);

  // Filtered inventory list
  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const ingredientName = item.ingredient?.name?.toLowerCase() || '';
      const categoryName = item.ingredient?.category?.toLowerCase() || '';
      const searchLower = search.toLowerCase().trim();

      const hasSearchMatch =
        !searchLower || ingredientName.includes(searchLower) || categoryName.includes(searchLower);

      if (!hasSearchMatch) return false;

      const qty = Number(item.currentQuantity) || 0;

      switch (selectedFilter) {
        case 'in_stock':
          return qty > 0;
        case 'out_of_stock':
          return qty <= 0;
        case 'expired':
          return qty > 0 && isExpired(item.expirationDate);
        case 'expiring':
          return qty > 0 && !isExpired(item.expirationDate) && isExpiringSoon(item.expirationDate);
        case 'all':
        default:
          return true;
      }
    });
  }, [inventory, search, selectedFilter]);

  // Actions
  const handleOpenAdjust = useCallback((item: InventoryItem) => {
    setSelectedItem(item);
    setModalMode('adjust');
    setIsModalOpen(true);
  }, []);

  const handleOpenPurchase = useCallback((item: InventoryItem) => {
    setSelectedItem(item);
    setModalMode('purchase');
    setIsModalOpen(true);
  }, []);

  const handleOpenWaste = useCallback((item: InventoryItem) => {
    setSelectedItem(item);
    setModalMode('waste');
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedItem(null);
  }, []);

  const handleNavigateToRegister = useCallback(() => {
    router.push('/register-stock');
  }, []);

  const styles = useMemo(
    () => createStyles(theme, isMobile, containerWidth, cardWidth),
    [theme, isMobile, containerWidth, cardWidth],
  );

  const renderStockItem = useCallback(
    ({ item }: { item: InventoryItem }) => (
      <View style={styles.cardWrapper}>
        <StockCard
          item={item}
          style={!isMobile ? styles.desktopCard : undefined}
          onAdjust={handleOpenAdjust}
          onPurchase={handleOpenPurchase}
          onWaste={handleOpenWaste}
        />
      </View>
    ),
    [
      handleOpenAdjust,
      handleOpenPurchase,
      handleOpenWaste,
      isMobile,
      styles.cardWrapper,
      styles.desktopCard,
    ],
  );

  const listHeader = useMemo(
    () => (
      <View style={styles.headerWrapper}>
        <View style={styles.headerSection}>
          <View>
            <Text style={styles.pageTitle}>Controle de Estoque</Text>
            <Text style={styles.pageSubtitle}>
              Monitore insumos, controle custos médios e registre movimentações.
            </Text>
          </View>

          {!isMobile && (
            <CustomButton
              title="+ Novo Insumo"
              variant="primary"
              onPress={handleNavigateToRegister}
              style={styles.desktopAddButton}
            />
          )}
        </View>

        <StockSummaryBanner
          totalItems={summaryMetrics.totalItems}
          totalStockValue={summaryMetrics.totalStockValue}
          outOfStockCount={summaryMetrics.outOfStockCount}
          expiringSoonCount={summaryMetrics.expiringSoonCount}
          expiredCount={summaryMetrics.expiredCount}
        />

        <View style={styles.searchRow}>
          <Input
            value={search}
            placeholder="Buscar insumo ou categoria..."
            onChangeText={setSearch}
            isClearable
            onClear={() => setSearch('')}
            containerStyle={styles.searchInput}
            leftIcon={
              <MaterialCommunityIcons
                name="magnify"
                size={20}
                color={theme.colors.onSurfaceVariant}
              />
            }
          />
        </View>

        <View style={styles.filterPillsRow}>
          <TouchableOpacity
            style={[styles.filterPill, selectedFilter === 'all' && styles.filterPillActive]}
            onPress={() => setSelectedFilter('all')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Filtrar todos os insumos"
          >
            <Text
              style={[
                styles.filterPillText,
                selectedFilter === 'all' && styles.filterPillTextActive,
              ]}
            >
              Todos ({inventory.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, selectedFilter === 'in_stock' && styles.filterPillActive]}
            onPress={() => setSelectedFilter('in_stock')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Filtrar insumos em estoque"
          >
            <Text
              style={[
                styles.filterPillText,
                selectedFilter === 'in_stock' && styles.filterPillTextActive,
              ]}
            >
              Em estoque
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              selectedFilter === 'out_of_stock' && styles.filterPillActive,
            ]}
            onPress={() => setSelectedFilter('out_of_stock')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Filtrar insumos em falta"
          >
            <Text
              style={[
                styles.filterPillText,
                selectedFilter === 'out_of_stock' && styles.filterPillTextActive,
              ]}
            >
              Em falta ({summaryMetrics.outOfStockCount})
            </Text>
          </TouchableOpacity>

          {summaryMetrics.expiredCount > 0 && (
            <TouchableOpacity
              style={[
                styles.filterPill,
                styles.filterPillExpired,
                selectedFilter === 'expired' && styles.filterPillExpiredActive,
              ]}
              onPress={() => setSelectedFilter('expired')}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Filtrar insumos vencidos"
            >
              <Text
                style={[
                  styles.filterPillText,
                  styles.filterPillTextExpired,
                  selectedFilter === 'expired' && styles.filterPillTextExpiredActive,
                ]}
              >
                Vencidos ({summaryMetrics.expiredCount})
              </Text>
            </TouchableOpacity>
          )}

          {summaryMetrics.expiringSoonCount > 0 && (
            <TouchableOpacity
              style={[styles.filterPill, selectedFilter === 'expiring' && styles.filterPillActive]}
              onPress={() => setSelectedFilter('expiring')}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Filtrar insumos vencendo em breve"
            >
              <Text
                style={[
                  styles.filterPillText,
                  selectedFilter === 'expiring' && styles.filterPillTextActive,
                ]}
              >
                A vencer ({summaryMetrics.expiringSoonCount})
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    ),
    [
      handleNavigateToRegister,
      inventory.length,
      isMobile,
      search,
      selectedFilter,
      styles,
      summaryMetrics.expiredCount,
      summaryMetrics.expiringSoonCount,
      summaryMetrics.outOfStockCount,
      summaryMetrics.totalItems,
      summaryMetrics.totalStockValue,
      theme.colors.onSurfaceVariant,
    ],
  );

  const listEmpty = useMemo(() => {
    if (isLoading && inventory.length === 0) {
      return (
        <View style={styles.feedbackContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.feedbackText}>Carregando estoque...</Text>
        </View>
      );
    }
    if (error && inventory.length === 0) {
      return (
        <View style={styles.feedbackContainer}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={40}
            color={theme.colors.error}
          />
          <Text style={styles.errorText}>{error}</Text>
          <CustomButton
            title="Tentar Novamente"
            variant="secondary"
            onPress={refetch}
            style={styles.retryButton}
          />
        </View>
      );
    }
    return (
      <View style={styles.feedbackContainer}>
        <MaterialCommunityIcons
          name="package-variant"
          size={48}
          color={theme.colors.onSurfaceVariant}
        />
        <Text style={styles.emptyTitle}>
          {search.trim() || selectedFilter !== 'all' ? 'Nenhum insumo encontrado' : 'Estoque vazio'}
        </Text>
        <Text style={styles.emptySubtitle}>
          {search.trim() || selectedFilter !== 'all'
            ? 'Tente ajustar os filtros ou o termo de busca.'
            : 'Cadastre os insumos e ingredientes que você usa nas suas receitas.'}
        </Text>
        {!search.trim() && selectedFilter === 'all' && (
          <CustomButton
            title="+ Cadastrar Primeiro Insumo"
            variant="primary"
            onPress={handleNavigateToRegister}
            style={styles.emptyButton}
          />
        )}
      </View>
    );
  }, [
    error,
    handleNavigateToRegister,
    inventory.length,
    isLoading,
    refetch,
    search,
    selectedFilter,
    styles,
    theme.colors.error,
    theme.colors.onSurfaceVariant,
    theme.colors.primary,
  ]);

  const listFooter = useMemo(() => {
    if (isLoading || inventory.length === 0) return null;
    return (
      <View style={styles.footerWrapper}>
        <AddStockCard isMobile={isMobile} onPress={handleNavigateToRegister} />
      </View>
    );
  }, [handleNavigateToRegister, inventory.length, isLoading, isMobile, styles.footerWrapper]);

  const itemSeparator = useCallback(() => <View style={styles.separator} />, [styles.separator]);
  const keyExtractor = useCallback((item: InventoryItem) => String(item.ingredientId), []);

  return (
    <>
      <Stack.Screen options={{ title: 'Estoque' }} />

      <View style={styles.container}>
        <FlatList
          data={isLoading && inventory.length === 0 ? [] : filteredInventory}
          keyExtractor={keyExtractor}
          renderItem={renderStockItem}
          numColumns={numCols}
          key={`stock-grid-${numCols}`}
          columnWrapperStyle={numCols > 1 ? styles.columnWrapper : undefined}
          ItemSeparatorComponent={itemSeparator}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={listEmpty}
          ListFooterComponent={listFooter}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          initialNumToRender={6}
          maxToRenderPerBatch={8}
          windowSize={5}
          removeClippedSubviews={Platform.OS === 'android'}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
        />

        {/* Floating Action Button (Reserved Elevation strictly per DESIGN.md) */}
        {isMobile && (
          <TouchableOpacity
            style={styles.mobileFab}
            onPress={handleNavigateToRegister}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Cadastrar novo insumo no estoque"
          >
            <MaterialCommunityIcons name="plus" size={28} color={theme.colors.onPrimary} />
          </TouchableOpacity>
        )}

        {/* Modal for adjusting, purchasing, or recording waste */}
        <StockOperationModal
          isOpen={isModalOpen}
          item={selectedItem}
          initialMode={modalMode}
          onClose={handleCloseModal}
          onRegisterAdjustment={registerAdjustment}
          onRegisterPurchase={registerPurchase}
          onRegisterWaste={registerWaste}
        />
      </View>
    </>
  );
}

const createStyles = (
  theme: AppTheme,
  isMobile: boolean,
  containerWidth: number,
  cardWidth: number,
) =>
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
      flexGrow: 1,
      alignItems: 'center',
      paddingHorizontal: isMobile ? 16 : 24,
      paddingTop: 16,
      paddingBottom: 96,
    },
    headerSection: {
      flexDirection: isMobile ? 'column' : 'row',
      justifyContent: 'space-between',
      alignItems: isMobile ? 'flex-start' : 'center',
      marginBottom: 8,
      gap: 12,
    },
    pageTitle: {
      fontFamily: theme.typography.headlineLg.fontFamily,
      fontSize: isMobile ? 24 : 30,
      fontWeight: '700',
      color: theme.colors.espressoDark,
      marginBottom: 4,
    },
    pageSubtitle: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 18,
    },
    desktopAddButton: {
      height: 48,
      minHeight: 48,
      margin: 0,
      borderRadius: theme.rounded.default,
      paddingHorizontal: 20,
      width: undefined,
    },
    searchRow: {
      width: '100%',
      marginBottom: 4,
    },
    searchInput: {
      width: '100%',
      height: 52,
      minHeight: 48,
      margin: 0,
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.rounded.default,
      borderColor: theme.colors.outlineVariant,
    },
    filterPillsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 8,
    },
    filterPill: {
      minHeight: 48,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: theme.rounded.full,
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      justifyContent: 'center',
      alignItems: 'center',
    },
    filterPillActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
      ...theme.shadows.soft,
    },
    filterPillExpired: {
      borderColor: theme.colors.error,
      backgroundColor: theme.colors.errorContainer,
    },
    filterPillExpiredActive: {
      backgroundColor: theme.colors.error,
      borderColor: theme.colors.error,
    },
    filterPillText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
    },
    filterPillTextActive: {
      color: theme.colors.onPrimary,
      fontWeight: '700',
    },
    filterPillTextExpired: {
      color: theme.colors.onErrorContainer,
      fontWeight: '700',
    },
    filterPillTextExpiredActive: {
      color: theme.colors.onError,
      fontWeight: '700',
    },
    headerWrapper: {
      width: isMobile ? cardWidth : '100%',
      maxWidth: isMobile ? cardWidth : containerWidth,
      alignSelf: 'center',
      gap: 12,
      marginBottom: 16,
    },
    footerWrapper: {
      width: isMobile ? cardWidth : '100%',
      maxWidth: isMobile ? cardWidth : containerWidth,
      alignSelf: 'center',
      marginTop: 20,
    },
    columnWrapper: {
      gap: 16,
      width: '100%',
      maxWidth: containerWidth,
      alignSelf: 'center',
      justifyContent: 'flex-start',
    },
    separator: {
      height: 16,
    },
    cardWrapper: {
      width: cardWidth,
      maxWidth: '100%',
      minHeight: isMobile ? undefined : 365,
      alignSelf: 'center',
    },
    desktopCard: {
      minHeight: 365,
      height: '100%',
      justifyContent: 'space-between',
    },
    feedbackContainer: {
      width: isMobile ? cardWidth : '100%',
      maxWidth: 420,
      alignSelf: 'center',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 48,
      gap: 10,
    },
    feedbackText: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 15,
      color: theme.colors.onSurfaceVariant,
      marginTop: 8,
    },
    errorText: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 15,
      color: theme.colors.error,
      textAlign: 'center',
      paddingHorizontal: 20,
    },
    retryButton: {
      width: 200,
      height: 48,
      minHeight: 48,
      margin: 0,
      marginTop: 8,
      borderRadius: theme.rounded.default,
    },
    emptyTitle: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.espressoDark,
      textAlign: 'center',
      marginTop: 8,
    },
    emptySubtitle: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      maxWidth: 340,
      lineHeight: 18,
    },
    emptyButton: {
      width: undefined,
      height: 48,
      minHeight: 48,
      margin: 0,
      marginTop: 12,
      paddingHorizontal: 24,
      borderRadius: theme.rounded.default,
    },
    mobileFab: {
      position: 'absolute',
      bottom: 24,
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 40,
      ...theme.shadows.glow,
    },
  });
