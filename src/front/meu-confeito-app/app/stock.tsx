import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

import { Stack, router } from 'expo-router';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import {
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
import { isExpiringSoon } from '@/src/utils/formatters';

type FilterType = 'all' | 'in_stock' | 'out_of_stock' | 'expiring';

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

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');

  // Operation Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [modalMode, setModalMode] = useState<StockOperationType>('adjust');

  const isMobile = width < 768;

  // Calculations for summary metrics
  const summaryMetrics = useMemo(() => {
    let totalValue = 0;
    let outOfStockCount = 0;
    let expiringSoonCount = 0;

    inventory.forEach((item) => {
      const qty = Number(item.currentQuantity) || 0;
      const unitCost = Number(item.costPerBaseUnit) || 0;
      totalValue += qty * unitCost;

      if (qty <= 0) {
        outOfStockCount += 1;
      }

      if (isExpiringSoon(item.expirationDate)) {
        expiringSoonCount += 1;
      }
    });

    return {
      totalItems: inventory.length,
      totalStockValue: totalValue,
      outOfStockCount,
      expiringSoonCount,
    };
  }, [inventory]);

  // Filtered inventory list
  const filteredInventory = useMemo(() => {
    let list = inventory;

    // Apply category / name search
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      list = list.filter((item) => {
        const hasMatchingName = Boolean(item.ingredient?.name?.toLowerCase().includes(searchLower));
        const hasMatchingCategory = Boolean(
          item.ingredient?.category?.toLowerCase().includes(searchLower),
        );
        return hasMatchingName || hasMatchingCategory;
      });
    }

    // Apply status filter pill
    if (selectedFilter === 'in_stock') {
      list = list.filter((item) => (Number(item.currentQuantity) || 0) > 0);
    } else if (selectedFilter === 'out_of_stock') {
      list = list.filter((item) => (Number(item.currentQuantity) || 0) <= 0);
    } else if (selectedFilter === 'expiring') {
      list = list.filter((item) => isExpiringSoon(item.expirationDate));
    }

    return list;
  }, [inventory, search, selectedFilter]);

  // Actions
  const handleOpenAdjust = (item: InventoryItem) => {
    setSelectedItem(item);
    setModalMode('adjust');
    setIsModalOpen(true);
  };

  const handleOpenPurchase = (item: InventoryItem) => {
    setSelectedItem(item);
    setModalMode('purchase');
    setIsModalOpen(true);
  };

  const handleOpenWaste = (item: InventoryItem) => {
    setSelectedItem(item);
    setModalMode('waste');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const styles = useMemo(() => createStyles(theme, isMobile), [theme, isMobile]);

  return (
    <>
      <Stack.Screen options={{ title: 'Estoque' }} />

      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
        >
          <View style={styles.innerContainer}>
            {/* Header Title Section */}
            <View style={styles.headerSection}>
              <View>
                <Text style={styles.pageTitle}>Controle de Estoque</Text>
                <Text style={styles.pageSubtitle}>
                  Monitore insumos, controle custos médios e registre movimentações.
                </Text>
              </View>

              {/* Desktop direct action button */}
              {!isMobile && (
                <CustomButton
                  title="+ Novo Insumo"
                  variant="primary"
                  onPress={() => router.push('/register-stock')}
                  style={styles.desktopAddButton}
                />
              )}
            </View>

            {/* Inventory Valuation & Health Metrics */}
            <StockSummaryBanner
              totalItems={summaryMetrics.totalItems}
              totalStockValue={summaryMetrics.totalStockValue}
              outOfStockCount={summaryMetrics.outOfStockCount}
              expiringSoonCount={summaryMetrics.expiringSoonCount}
            />

            {/* Search Bar */}
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

            {/* Filter Pills */}
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
                style={[
                  styles.filterPill,
                  selectedFilter === 'in_stock' && styles.filterPillActive,
                ]}
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

              {summaryMetrics.expiringSoonCount > 0 && (
                <TouchableOpacity
                  style={[
                    styles.filterPill,
                    selectedFilter === 'expiring' && styles.filterPillActive,
                  ]}
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
                    Vencendo ({summaryMetrics.expiringSoonCount})
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* List / Grid Content */}
            {isLoading && inventory.length === 0 ? (
              <View style={styles.feedbackContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.feedbackText}>Carregando estoque...</Text>
              </View>
            ) : error && inventory.length === 0 ? (
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
            ) : filteredInventory.length === 0 ? (
              <View style={styles.feedbackContainer}>
                <MaterialCommunityIcons
                  name="package-variant"
                  size={48}
                  color={theme.colors.onSurfaceVariant}
                />
                <Text style={styles.emptyTitle}>
                  {search.trim() || selectedFilter !== 'all'
                    ? 'Nenhum insumo encontrado'
                    : 'Estoque vazio'}
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
                    onPress={() => router.push('/register-stock')}
                    style={styles.emptyButton}
                  />
                )}
              </View>
            ) : (
              <View style={styles.cardsGrid}>
                {filteredInventory.map((item) => (
                  <View key={item.ingredientId} style={styles.cardWrapper}>
                    <StockCard
                      item={item}
                      onAdjust={handleOpenAdjust}
                      onPurchase={handleOpenPurchase}
                      onWaste={handleOpenWaste}
                    />
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Floating Action Button (Reserved Elevation strictly per DESIGN.md) */}
        {isMobile && (
          <TouchableOpacity
            style={styles.mobileFab}
            onPress={() => router.push('/register-stock')}
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

const createStyles = (theme: AppTheme, isMobile: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      flexGrow: 1,
      alignItems: 'center',
      paddingHorizontal: isMobile ? 16 : 24,
      paddingTop: 16,
      paddingBottom: 96,
    },
    innerContainer: {
      width: '100%',
      maxWidth: 1200,
      gap: 12,
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
    cardsGrid: {
      width: '100%',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
    },
    cardWrapper: {
      width: isMobile ? '100%' : undefined,
      flex: isMobile ? undefined : 1,
      minWidth: isMobile ? '100%' : 300,
      maxWidth: isMobile ? '100%' : 380,
    },
    feedbackContainer: {
      width: '100%',
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
