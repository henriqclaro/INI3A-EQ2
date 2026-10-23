import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

import { Stack, router, useFocusEffect, useLocalSearchParams } from 'expo-router';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import {
  Input,
  InventoryTransactionCard,
  InventoryTransactionDetailsModal,
  OfflineBanner,
  OperationsSummaryCard,
  ProductionCard,
  ProductionDetailsModal,
} from '@/src/components';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { useDebounce } from '@/src/hooks/useDebounce';
import { useInventoryTransactions } from '@/src/hooks/useInventory';
import { useProductions } from '@/src/hooks/useProductions';
import { AppTheme } from '@/src/theme/themes';
import { TransactionItem } from '@/src/types/inventory';
import { ProductionItem } from '@/src/types/production';
import { matchesSearch } from '@/src/utils/text';

type OperationTab = 'movements' | 'productions';
type MovementFilter = 'ALL' | 'PURCHASE' | 'WASTE' | 'MANUAL_ADJUSTMENT' | 'PRODUCTION';

export default function OperationsHistoryScreen() {
  const { theme } = useThemeMode();
  const params = useLocalSearchParams<{
    tab?: string;
    recipeId?: string;
    ingredientId?: string;
    type?: string;
  }>();

  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const numCols = isDesktop ? 2 : 1;
  const containerMaxWidth = 1040;
  const horizontalPadding = isDesktop ? 64 : 32;
  const innerContentWidth = Math.min(width, containerMaxWidth) - horizontalPadding;
  const cardWidth = isDesktop ? Math.floor((innerContentWidth - 16) / 2) : undefined;

  // Track navigation parameters to allow automatic tab switches when route params change
  const [prevTabParam, setPrevTabParam] = useState(params.tab);
  const [prevRecipeId, setPrevRecipeId] = useState(params.recipeId);
  const [userTab, setUserTab] = useState<OperationTab | null>(null);

  if (params.tab !== prevTabParam || params.recipeId !== prevRecipeId) {
    setPrevTabParam(params.tab);
    setPrevRecipeId(params.recipeId);
    setUserTab(null);
  }

  const activeTab: OperationTab = useMemo(() => {
    if (userTab) return userTab;
    if (params.recipeId || params.tab === 'productions') return 'productions';
    return 'movements';
  }, [userTab, params.recipeId, params.tab]);

  const handleSelectTab = useCallback((tab: OperationTab) => {
    setUserTab(tab);
  }, []);

  // ---------------------------------------------------------------------------
  // MOVEMENTS STATE & DATA
  // ---------------------------------------------------------------------------
  const [movementFilter, setMovementFilter] = useState<MovementFilter>(() => {
    if (params.type === 'PURCHASE') return 'PURCHASE';
    if (params.type === 'WASTE') return 'WASTE';
    if (params.type === 'MANUAL_ADJUSTMENT') return 'MANUAL_ADJUSTMENT';
    return 'ALL';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 250);

  const [selectedTransaction, setSelectedTransaction] = useState<TransactionItem | null>(null);
  const [isTransactionModalVisible, setIsTransactionModalVisible] = useState(false);

  const transactionsQuery = useMemo(
    () => ({
      ingredientId: params.ingredientId ? Number(params.ingredientId) : undefined,
      limit: 100,
    }),
    [params.ingredientId],
  );

  const {
    transactions,
    isLoading: isLoadingTransactions,
    isOffline: isTransactionsOffline,
    error: transactionsError,
    refetch: refetchTransactions,
  } = useInventoryTransactions(transactionsQuery);

  // ---------------------------------------------------------------------------
  // PRODUCTIONS STATE & DATA
  // ---------------------------------------------------------------------------
  const [productionFilter, setProductionFilter] = useState<'active' | 'all'>('active');
  const [selectedProduction, setSelectedProduction] = useState<ProductionItem | null>(null);
  const [isProductionModalVisible, setIsProductionModalVisible] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  const productionsQuery = useMemo(
    () => ({
      recipeId: params.recipeId || undefined,
      includeCanceled: productionFilter === 'all',
    }),
    [params.recipeId, productionFilter],
  );

  const {
    productions,
    isLoading: isLoadingProductions,
    isOffline: isProductionsOffline,
    error: productionsError,
    refetch: refetchProductions,
    cancelProduction,
  } = useProductions(productionsQuery);

  // Refresh both on focus
  useFocusEffect(
    useCallback(() => {
      refetchTransactions();
      refetchProductions(productionsQuery);
    }, [refetchTransactions, refetchProductions, productionsQuery]),
  );

  const isCurrentOffline = activeTab === 'movements' ? isTransactionsOffline : isProductionsOffline;

  // ---------------------------------------------------------------------------
  // MOVEMENTS FILTERING & METRICS
  // ---------------------------------------------------------------------------
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Type filter
      if (movementFilter === 'PURCHASE' && tx.transactionType !== 'PURCHASE') return false;
      if (movementFilter === 'WASTE' && tx.transactionType !== 'WASTE') return false;
      if (movementFilter === 'MANUAL_ADJUSTMENT' && tx.transactionType !== 'MANUAL_ADJUSTMENT')
        return false;
      if (
        movementFilter === 'PRODUCTION' &&
        tx.transactionType !== 'PRODUCTION_USAGE' &&
        tx.transactionType !== 'PRODUCTION_REVERSAL'
      ) {
        return false;
      }

      // Diacritic-agnostic search by ingredient or recipe title
      if (debouncedSearch.trim()) {
        const hasIngredientMatch = matchesSearch(tx.ingredient?.name, debouncedSearch);
        const hasRecipeMatch = matchesSearch(tx.production?.recipe?.title, debouncedSearch);
        if (!hasIngredientMatch && !hasRecipeMatch) return false;
      }

      return true;
    });
  }, [transactions, movementFilter, debouncedSearch]);

  const purchasesTotal = useMemo(() => {
    return transactions.reduce((acc, tx) => {
      if (tx.transactionType === 'PURCHASE') {
        return acc + (Number(tx.totalCost) || 0);
      }
      return acc;
    }, 0);
  }, [transactions]);

  const wasteTotal = useMemo(() => {
    return transactions.reduce((acc, tx) => {
      if (tx.transactionType === 'WASTE') {
        return acc + (Number(tx.totalCost) || 0);
      }
      return acc;
    }, 0);
  }, [transactions]);

  // ---------------------------------------------------------------------------
  // PRODUCTIONS METRICS
  // ---------------------------------------------------------------------------
  const totalCostSum = useMemo(() => {
    return productions.reduce((acc, p) => {
      if (p.canceledAt) return acc;
      return acc + (Number(p.totalCost) || 0);
    }, 0);
  }, [productions]);

  const activeProductionsCount = useMemo(() => {
    return productions.filter((p) => !p.canceledAt).length;
  }, [productions]);

  // ---------------------------------------------------------------------------
  // HANDLERS
  // ---------------------------------------------------------------------------
  const handleOpenTransactionDetails = (tx: TransactionItem) => {
    setSelectedTransaction(tx);
    setIsTransactionModalVisible(true);
  };

  const handleCloseTransactionDetails = () => {
    setIsTransactionModalVisible(false);
    setSelectedTransaction(null);
  };

  const handleOpenProductionDetails = (prod: ProductionItem) => {
    setSelectedProduction(prod);
    setIsProductionModalVisible(true);
  };

  const handleCloseProductionDetails = () => {
    setIsProductionModalVisible(false);
    setSelectedProduction(null);
  };

  const handleViewLinkedProduction = (productionId: string) => {
    handleSelectTab('productions');
    const matched = productions.find((p) => p.id === productionId);
    if (matched) {
      setSelectedProduction(matched);
      setIsProductionModalVisible(true);
    }
  };

  const handleCancelProduction = (productionId: string) => {
    if (isProductionsOffline) {
      Alert.alert(
        'Ação Indisponível Offline',
        'O cancelamento de lotes de produção e a recomposição de estoque requerem conexão com a internet.',
      );
      return;
    }

    Alert.alert(
      'Cancelar Produção',
      'Tem certeza de que deseja cancelar esta produção? Todos os ingredientes consumidos retornarão ao seu estoque.',
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim, Cancelar',
          style: 'destructive',
          onPress: async () => {
            setIsCanceling(true);
            try {
              const updated = await cancelProduction(productionId);
              if (selectedProduction?.id === productionId) {
                setSelectedProduction(updated);
              }
              refetchTransactions();
              Alert.alert('Sucesso', 'Produção cancelada com sucesso! O estoque foi restaurado.');
            } catch (err: unknown) {
              const apiErr = err as {
                response?: { data?: { message?: string } };
                message?: string;
              };
              const msg =
                apiErr?.response?.data?.message ||
                apiErr?.message ||
                'Não foi possível cancelar a produção.';
              Alert.alert('Erro', msg);
            } finally {
              setIsCanceling(false);
            }
          },
        },
      ],
    );
  };

  const styles = useMemo(
    () => createStyles(theme, isDesktop, cardWidth),
    [theme, isDesktop, cardWidth],
  );

  const itemSeparator = useCallback(() => <View style={styles.separator} />, [styles.separator]);

  return (
    <>
      <Stack.Screen options={{ title: 'Histórico Operacional' }} />

      <View style={styles.container}>
        <View style={styles.innerContainer}>
          <OfflineBanner
            isVisible={isCurrentOffline}
            message="Você está offline. Visualizando dados salvos no dispositivo."
            onRetry={() => {
              refetchTransactions();
              refetchProductions(productionsQuery);
            }}
            style={styles.offlineBanner}
          />

          {/* Section Navigation Tabs */}
          <View style={styles.mainTabRow}>
            <TouchableOpacity
              style={[styles.mainTabBtn, activeTab === 'movements' && styles.mainTabBtnActive]}
              onPress={() => handleSelectTab('movements')}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`Aba de movimentações de estoque, ${transactions.length} registros`}
            >
              <MaterialCommunityIcons
                name="swap-horizontal"
                size={18}
                color={
                  activeTab === 'movements' ? theme.colors.onPrimary : theme.colors.onSurfaceVariant
                }
              />
              <Text
                style={[
                  styles.mainTabBtnText,
                  activeTab === 'movements' && styles.mainTabBtnTextActive,
                ]}
              >
                Movimentações ({transactions.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.mainTabBtn, activeTab === 'productions' && styles.mainTabBtnActive]}
              onPress={() => handleSelectTab('productions')}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`Aba de lotes de produção, ${productions.length} lotes`}
            >
              <MaterialCommunityIcons
                name="pot-steam-outline"
                size={18}
                color={
                  activeTab === 'productions'
                    ? theme.colors.onPrimary
                    : theme.colors.onSurfaceVariant
                }
              />
              <Text
                style={[
                  styles.mainTabBtnText,
                  activeTab === 'productions' && styles.mainTabBtnTextActive,
                ]}
              >
                Produções ({productions.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Unified Summary Card */}
          <OperationsSummaryCard
            mode={activeTab}
            purchasesTotal={purchasesTotal}
            wasteTotal={wasteTotal}
            movementsCount={transactions.length}
            productionsCount={activeProductionsCount}
            productionsTotalCost={totalCostSum}
          />

          {/* ================================================================= */}
          {/* TAB 1: MOVIMENTAÇÕES DE ESTOQUE                                   */}
          {/* ================================================================= */}
          {activeTab === 'movements' && (
            <View style={styles.tabContentContainer}>
              {/* Type Filter Chips */}
              <View style={styles.filterChipScroll}>
                {(
                  [
                    { key: 'ALL', label: 'Todas' },
                    { key: 'PURCHASE', label: 'Compras' },
                    { key: 'WASTE', label: 'Descartes' },
                    { key: 'MANUAL_ADJUSTMENT', label: 'Ajustes' },
                    { key: 'PRODUCTION', label: 'Produções' },
                  ] as { key: MovementFilter; label: string }[]
                ).map((chip) => {
                  const isChipActive = movementFilter === chip.key;
                  return (
                    <TouchableOpacity
                      key={chip.key}
                      style={[styles.chipBtn, isChipActive && styles.chipBtnActive]}
                      onPress={() => setMovementFilter(chip.key)}
                      accessibilityRole="button"
                      accessibilityLabel={`Filtrar por ${chip.label}`}
                    >
                      <Text style={[styles.chipText, isChipActive && styles.chipTextActive]}>
                        {chip.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Search Bar */}
              <View style={styles.searchWrapper}>
                <Input
                  value={searchQuery}
                  placeholder="Buscar insumo ou receita..."
                  onChangeText={setSearchQuery}
                  isClearable
                  onClear={() => setSearchQuery('')}
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

              {/* Movements List */}
              {isLoadingTransactions && transactions.length === 0 ? (
                <View style={styles.centerContainer}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                  <Text style={styles.loadingText}>Carregando movimentações de estoque...</Text>
                </View>
              ) : transactionsError && transactions.length === 0 ? (
                <View style={styles.centerContainer}>
                  <MaterialCommunityIcons
                    name="alert-circle-outline"
                    size={56}
                    color={theme.colors.error}
                  />
                  <Text style={styles.emptyTitle}>Erro ao carregar movimentações</Text>
                  <Text style={styles.emptySubtitle}>{transactionsError}</Text>
                  <TouchableOpacity
                    style={styles.retryBtn}
                    onPress={() => refetchTransactions()}
                    accessibilityRole="button"
                    accessibilityLabel="Tentar novamente"
                  >
                    <Text style={styles.retryBtnText}>Tentar Novamente</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <FlatList
                  data={filteredTransactions}
                  keyExtractor={(item) => item.id}
                  numColumns={numCols}
                  key={isDesktop ? 'desktop-grid-movements' : 'mobile-list-movements'}
                  columnWrapperStyle={numCols > 1 ? styles.columnWrapper : undefined}
                  ItemSeparatorComponent={itemSeparator}
                  contentContainerStyle={styles.listContent}
                  showsVerticalScrollIndicator={false}
                  refreshControl={
                    <RefreshControl
                      refreshing={isLoadingTransactions}
                      onRefresh={refetchTransactions}
                      tintColor={theme.colors.primary}
                      colors={[theme.colors.primary]}
                    />
                  }
                  renderItem={({ item }) => (
                    <View style={styles.cardWrapper}>
                      <InventoryTransactionCard
                        transaction={item}
                        onPress={handleOpenTransactionDetails}
                        style={isDesktop ? styles.desktopTransactionCard : undefined}
                      />
                    </View>
                  )}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <MaterialCommunityIcons
                        name="clipboard-text-clock-outline"
                        size={56}
                        color={theme.colors.outline}
                      />
                      <Text style={styles.emptyTitle}>Nenhuma movimentação encontrada</Text>
                      <Text style={styles.emptySubtitle}>
                        Quando você registrar compras, descartes, perdas ou produzir receitas, as
                        transações do livro-razão aparecerão registradas aqui.
                      </Text>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => router.push('/stock')}
                        accessibilityRole="button"
                        accessibilityLabel="Ir para o Estoque"
                      >
                        <MaterialCommunityIcons
                          name="package-variant-closed"
                          size={18}
                          color={theme.colors.onPrimary}
                        />
                        <Text style={styles.actionBtnText}>Acessar Meu Estoque</Text>
                      </TouchableOpacity>
                    </View>
                  }
                />
              )}
            </View>
          )}

          {/* ================================================================= */}
          {/* TAB 2: LOTES DE PRODUÇÃO                                          */}
          {/* ================================================================= */}
          {activeTab === 'productions' && (
            <View style={styles.tabContentContainer}>
              {/* Filter Tabs */}
              <View style={styles.productionFilterRow}>
                <TouchableOpacity
                  style={[
                    styles.prodFilterBtn,
                    productionFilter === 'active' && styles.prodFilterBtnActive,
                  ]}
                  onPress={() => setProductionFilter('active')}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Filtrar produções ativas"
                >
                  <MaterialCommunityIcons
                    name="check-circle-outline"
                    size={16}
                    color={
                      productionFilter === 'active'
                        ? theme.colors.onPrimary
                        : theme.colors.onSurfaceVariant
                    }
                  />
                  <Text
                    style={[
                      styles.prodFilterBtnText,
                      productionFilter === 'active' && styles.prodFilterBtnTextActive,
                    ]}
                  >
                    Ativas ({activeProductionsCount})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.prodFilterBtn,
                    productionFilter === 'all' && styles.prodFilterBtnActive,
                  ]}
                  onPress={() => setProductionFilter('all')}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Filtrar todas as produções incluindo canceladas"
                >
                  <MaterialCommunityIcons
                    name="format-list-bulleted"
                    size={16}
                    color={
                      productionFilter === 'all'
                        ? theme.colors.onPrimary
                        : theme.colors.onSurfaceVariant
                    }
                  />
                  <Text
                    style={[
                      styles.prodFilterBtnText,
                      productionFilter === 'all' && styles.prodFilterBtnTextActive,
                    ]}
                  >
                    Todas ({productions.length})
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Productions List */}
              {isLoadingProductions && productions.length === 0 ? (
                <View style={styles.centerContainer}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                  <Text style={styles.loadingText}>Carregando histórico de produções...</Text>
                </View>
              ) : productionsError && productions.length === 0 ? (
                <View style={styles.centerContainer}>
                  <MaterialCommunityIcons
                    name="alert-circle-outline"
                    size={56}
                    color={theme.colors.error}
                  />
                  <Text style={styles.emptyTitle}>Erro ao carregar produções</Text>
                  <Text style={styles.emptySubtitle}>{productionsError}</Text>
                  <TouchableOpacity
                    style={styles.retryBtn}
                    onPress={() => refetchProductions(productionsQuery)}
                    accessibilityRole="button"
                    accessibilityLabel="Tentar novamente"
                  >
                    <Text style={styles.retryBtnText}>Tentar Novamente</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <FlatList
                  data={productions}
                  keyExtractor={(item) => item.id}
                  numColumns={numCols}
                  key={isDesktop ? 'desktop-grid-productions' : 'mobile-list-productions'}
                  columnWrapperStyle={numCols > 1 ? styles.columnWrapper : undefined}
                  ItemSeparatorComponent={itemSeparator}
                  contentContainerStyle={styles.listContent}
                  showsVerticalScrollIndicator={false}
                  refreshControl={
                    <RefreshControl
                      refreshing={isLoadingProductions}
                      onRefresh={() => refetchProductions(productionsQuery)}
                      tintColor={theme.colors.primary}
                      colors={[theme.colors.primary]}
                    />
                  }
                  renderItem={({ item }) => (
                    <View style={styles.cardWrapper}>
                      <ProductionCard
                        production={item}
                        onViewDetails={handleOpenProductionDetails}
                        onCancel={handleCancelProduction}
                        isCanceling={isCanceling}
                        style={isDesktop ? styles.desktopProductionCard : undefined}
                      />
                    </View>
                  )}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <MaterialCommunityIcons
                        name="pot-steam-outline"
                        size={56}
                        color={theme.colors.outline}
                      />
                      <Text style={styles.emptyTitle}>Nenhuma produção encontrada</Text>
                      <Text style={styles.emptySubtitle}>
                        Quando você registrar a produção de uma receita, os lotes aparecerão
                        listados aqui com o detalhamento de custos e consumo de insumos.
                      </Text>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => router.push('/(tabs)/recipes')}
                        accessibilityRole="button"
                        accessibilityLabel="Ir para Receitas"
                      >
                        <MaterialCommunityIcons
                          name="book-open-outline"
                          size={18}
                          color={theme.colors.onPrimary}
                        />
                        <Text style={styles.actionBtnText}>Ver Minhas Receitas</Text>
                      </TouchableOpacity>
                    </View>
                  }
                />
              )}
            </View>
          )}
        </View>

        {/* Transaction Details Modal */}
        <InventoryTransactionDetailsModal
          isVisible={isTransactionModalVisible}
          transaction={selectedTransaction}
          onClose={handleCloseTransactionDetails}
          onViewProduction={handleViewLinkedProduction}
        />

        {/* Production Details Modal */}
        <ProductionDetailsModal
          isVisible={isProductionModalVisible}
          production={selectedProduction}
          onClose={handleCloseProductionDetails}
          onCancelProduction={handleCancelProduction}
          isCanceling={isCanceling}
        />
      </View>
    </>
  );
}

const createStyles = (theme: AppTheme, isDesktop: boolean, cardWidth?: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      alignItems: 'center',
    },
    innerContainer: {
      flex: 1,
      width: '100%',
      maxWidth: isDesktop ? 1040 : undefined,
      paddingHorizontal: isDesktop ? 32 : 16,
      paddingTop: isDesktop ? 20 : 14,
    },
    mainTabRow: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surfaceContainerLow,
      borderRadius: theme.rounded.md,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: 4,
      gap: 6,
      marginBottom: 14,
    },
    mainTabBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
      borderRadius: theme.rounded.sm,
      gap: 8,
      paddingHorizontal: 8,
    },
    mainTabBtnActive: {
      backgroundColor: theme.colors.primary,
    },
    mainTabBtnText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
    },
    mainTabBtnTextActive: {
      color: theme.colors.onPrimary,
      fontWeight: '700',
    },
    tabContentContainer: {
      flex: 1,
      width: '100%',
    },
    filterChipScroll: {
      width: '100%',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 12,
    },
    chipBtn: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: theme.rounded.full,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chipBtnActive: {
      backgroundColor: theme.colors.secondaryContainer,
      borderColor: theme.colors.primary,
    },
    chipText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
    },
    chipTextActive: {
      color: theme.colors.espressoDark,
      fontWeight: '700',
    },
    searchWrapper: {
      width: '100%',
      marginBottom: 14,
    },
    searchInput: {
      width: '100%',
      margin: 0,
      marginHorizontal: 0,
      marginVertical: 0,
    },
    productionFilterRow: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surfaceContainerLow,
      borderRadius: theme.rounded.md,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: 4,
      gap: 6,
      marginBottom: 14,
    },
    prodFilterBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
      borderRadius: theme.rounded.sm,
      gap: 6,
      paddingHorizontal: 8,
    },
    prodFilterBtnActive: {
      backgroundColor: theme.colors.primary,
    },
    prodFilterBtnText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
    },
    prodFilterBtnTextActive: {
      color: theme.colors.onPrimary,
      fontWeight: '700',
    },
    listContent: {
      paddingBottom: 40,
    },
    columnWrapper: {
      gap: 16,
      width: '100%',
      justifyContent: 'flex-start',
    },
    separator: {
      height: 16,
    },
    cardWrapper: {
      width: isDesktop ? cardWidth : '100%',
      maxWidth: isDesktop ? cardWidth : undefined,
    },
    desktopTransactionCard: {
      height: 164,
      minHeight: 164,
      justifyContent: 'space-between',
    },
    desktopProductionCard: {
      height: 245,
      minHeight: 245,
      justifyContent: 'space-between',
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
      gap: 12,
    },
    loadingText: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginTop: 8,
    },
    emptyContainer: {
      alignItems: 'center',
      paddingVertical: 48,
      paddingHorizontal: 20,
      gap: 12,
    },
    emptyTitle: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.espressoDark,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      lineHeight: 20,
      maxWidth: 320,
    },
    actionBtn: {
      marginTop: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 20,
      minHeight: 48,
      borderRadius: theme.rounded.md,
      gap: 8,
      ...theme.shadows.soft,
    },
    actionBtnText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.onPrimary,
    },
    retryBtn: {
      marginTop: 10,
      backgroundColor: theme.colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: theme.rounded.md,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
      ...theme.shadows.soft,
    },
    retryBtnText: {
      color: theme.colors.onPrimary,
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 14,
      fontWeight: '600',
    },
    offlineBanner: {
      marginBottom: 12,
    },
  });
