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

import { MaterialSymbol, OfflineBanner } from '@/src/components';
import { ProductionCard, ProductionDetailsModal } from '@/src/components/production';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { useProductions } from '@/src/hooks/useProductions';
import { AppTheme } from '@/src/theme/themes';
import { ProductionItem } from '@/src/types/production';
import { formatCurrency } from '@/src/utils/formatters';

export default function ProductionsScreen() {
  const { theme } = useThemeMode();
  const { recipeId } = useLocalSearchParams<{ recipeId?: string }>();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [activeFilter, setActiveFilter] = useState<'active' | 'all'>('active');
  const [selectedProduction, setSelectedProduction] = useState<ProductionItem | null>(null);
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  const queryParams = useMemo(
    () => ({
      recipeId: recipeId || undefined,
      includeCanceled: activeFilter === 'all',
    }),
    [recipeId, activeFilter],
  );

  const { productions, isLoading, isOffline, error, refetch, cancelProduction } =
    useProductions(queryParams);

  useFocusEffect(
    useCallback(() => {
      refetch(queryParams);
    }, [refetch, queryParams]),
  );

  const styles = useMemo(() => createStyles(theme, isDesktop), [theme, isDesktop]);

  const handleOpenDetails = (prod: ProductionItem) => {
    setSelectedProduction(prod);
    setIsDetailsVisible(true);
  };

  const handleCloseDetails = () => {
    setIsDetailsVisible(false);
    setSelectedProduction(null);
  };

  const handleCancelProduction = (productionId: string) => {
    if (isOffline) {
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

  // Summary calculations
  const totalCostSum = useMemo(() => {
    return productions.reduce((acc, p) => {
      if (p.canceledAt) return acc;
      return acc + (Number(p.totalCost) || 0);
    }, 0);
  }, [productions]);

  const activeCount = useMemo(() => {
    return productions.filter((p) => !p.canceledAt).length;
  }, [productions]);

  return (
    <>
      <Stack.Screen options={{ title: 'Histórico de Produções' }} />

      <View style={styles.container}>
        <View style={styles.innerContainer}>
          <OfflineBanner
            isVisible={isOffline}
            message="Você está offline. Visualizando produções salvas no dispositivo."
            onRetry={() => refetch(queryParams)}
            style={styles.offlineBanner}
          />

          {/* Filter Tabs */}
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[styles.filterBtn, activeFilter === 'active' && styles.filterBtnActive]}
              onPress={() => setActiveFilter('active')}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Filtrar produções ativas"
            >
              <MaterialSymbol
                name="check_circle"
                size={18}
                color={
                  activeFilter === 'active' ? theme.colors.onPrimary : theme.colors.onSurfaceVariant
                }
              />
              <Text
                style={[
                  styles.filterBtnText,
                  activeFilter === 'active' && styles.filterBtnTextActive,
                ]}
              >
                Ativas ({activeCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterBtn, activeFilter === 'all' && styles.filterBtnActive]}
              onPress={() => setActiveFilter('all')}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Filtrar todas as produções incluindo canceladas"
            >
              <MaterialSymbol
                name="format_list_bulleted"
                size={18}
                color={
                  activeFilter === 'all' ? theme.colors.onPrimary : theme.colors.onSurfaceVariant
                }
              />
              <Text
                style={[styles.filterBtnText, activeFilter === 'all' && styles.filterBtnTextActive]}
              >
                Todas ({productions.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Lotes Concluídos</Text>
              <Text style={styles.summaryValue}>{activeCount}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Custo Total Produzido</Text>
              <Text style={styles.summaryValuePrimary}>{formatCurrency(totalCostSum)}</Text>
            </View>
          </View>

          {/* Content List */}
          {isLoading && productions.length === 0 ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Carregando histórico de produções...</Text>
            </View>
          ) : error && productions.length === 0 ? (
            <View style={styles.centerContainer}>
              <MaterialSymbol name="error" size={56} color={theme.colors.error} />
              <Text style={styles.emptyTitle}>Erro ao carregar produções</Text>
              <Text style={styles.emptySubtitle}>{error}</Text>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => refetch(queryParams)}
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
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={isLoading}
                  onRefresh={() => refetch(queryParams)}
                  tintColor={theme.colors.primary}
                  colors={[theme.colors.primary]}
                />
              }
              renderItem={({ item }) => (
                <ProductionCard
                  production={item}
                  onViewDetails={handleOpenDetails}
                  onCancel={handleCancelProduction}
                  isCanceling={isCanceling}
                />
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <MaterialSymbol name="skillet" size={56} color={theme.colors.outline} />
                  <Text style={styles.emptyTitle}>Nenhuma produção encontrada</Text>
                  <Text style={styles.emptySubtitle}>
                    Quando você registrar a produção de uma receita, os lotes aparecerão listados
                    aqui com o detalhamento de custos e consumo de insumos.
                  </Text>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => router.push('/(tabs)/recipes')}
                    accessibilityRole="button"
                    accessibilityLabel="Ir para Receitas"
                  >
                    <MaterialSymbol name="menu_book" size={18} color={theme.colors.onPrimary} />
                    <Text style={styles.actionBtnText}>Ver Minhas Receitas</Text>
                  </TouchableOpacity>
                </View>
              }
            />
          )}
        </View>

        {/* Details Modal */}
        <ProductionDetailsModal
          isVisible={isDetailsVisible}
          production={selectedProduction}
          onClose={handleCloseDetails}
          onCancelProduction={handleCancelProduction}
          isCanceling={isCanceling}
        />
      </View>
    </>
  );
}

const createStyles = (theme: AppTheme, isDesktop: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      alignItems: 'center',
    },
    innerContainer: {
      flex: 1,
      width: '100%',
      maxWidth: isDesktop ? 960 : undefined,
      paddingHorizontal: isDesktop ? 32 : 16,
      paddingTop: isDesktop ? 20 : 14,
    },
    filterRow: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surfaceContainerLow,
      borderRadius: theme.rounded.md,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: 4,
      gap: 6,
      marginBottom: 14,
    },
    filterBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
      borderRadius: theme.rounded.sm,
      gap: 6,
      paddingHorizontal: 8,
    },
    filterBtnActive: {
      backgroundColor: theme.colors.primary,
    },
    filterBtnText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
    },
    filterBtnTextActive: {
      color: theme.colors.onPrimary,
      fontWeight: '700',
    },
    summaryCard: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.rounded.lg,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: 16,
      marginBottom: 16,
      alignItems: 'center',
      ...theme.shadows.soft,
    },
    summaryCol: {
      flex: 1,
      alignItems: 'center',
      gap: 4,
    },
    summaryDivider: {
      width: 1,
      height: '80%',
      backgroundColor: theme.colors.outlineVariant,
    },
    summaryLabel: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      fontWeight: '500',
      color: theme.colors.onSurfaceVariant,
    },
    summaryValue: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.espressoDark,
    },
    summaryValuePrimary: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.tertiary,
    },
    listContent: {
      paddingBottom: 40,
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
