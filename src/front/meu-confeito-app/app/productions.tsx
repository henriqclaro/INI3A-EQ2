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
} from 'react-native';

import { Stack, router, useFocusEffect, useLocalSearchParams } from 'expo-router';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { ProductionCard, ProductionDetailsModal } from '@/src/components/production';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { useProductions } from '@/src/hooks/useProductions';
import { AppTheme } from '@/src/theme/themes';
import { ProductionItem } from '@/src/types/production';
import { formatCurrency } from '@/src/utils/formatters';

export default function ProductionsScreen() {
  const { theme } = useThemeMode();
  const { recipeId } = useLocalSearchParams<{ recipeId?: string }>();

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

  const { productions, isLoading, error, refetch, cancelProduction } = useProductions(queryParams);

  useFocusEffect(
    useCallback(() => {
      refetch(queryParams);
    }, [refetch, queryParams]),
  );

  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleOpenDetails = (prod: ProductionItem) => {
    setSelectedProduction(prod);
    setIsDetailsVisible(true);
  };

  const handleCloseDetails = () => {
    setIsDetailsVisible(false);
    setSelectedProduction(null);
  };

  const handleCancelProduction = (productionId: string) => {
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
        {/* Filter Tabs */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterBtn, activeFilter === 'active' && styles.filterBtnActive]}
            onPress={() => setActiveFilter('active')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Filtrar produções ativas"
          >
            <MaterialCommunityIcons
              name="check-circle-outline"
              size={16}
              color={activeFilter === 'active' ? theme.colors.secondaryText : theme.colors.text}
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
            <MaterialCommunityIcons
              name="format-list-bulleted"
              size={16}
              color={activeFilter === 'all' ? theme.colors.secondaryText : theme.colors.text}
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
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={56}
              color={theme.colors.placeholder}
            />
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
                <MaterialCommunityIcons
                  name="pot-steam-outline"
                  size={56}
                  color={theme.colors.placeholder}
                />
                <Text style={styles.emptyTitle}>Nenhuma produção encontrada</Text>
                <Text style={styles.emptySubtitle}>
                  Quando você registrar a produção de uma receita, os lotes aparecerão listados aqui
                  com o detalhamento de custos e consumo de insumos.
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
                    color={theme.colors.secondaryText}
                  />
                  <Text style={styles.actionBtnText}>Ver Minhas Receitas</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}

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

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingHorizontal: 16,
      paddingTop: 14,
    },
    filterRow: {
      flexDirection: 'row',
      backgroundColor: theme.colors.pitchBackground,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.colors.secBorder,
      padding: 4,
      gap: 6,
      marginBottom: 12,
    },
    filterBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
      borderRadius: 8,
      gap: 6,
      paddingHorizontal: 8,
    },
    filterBtnActive: {
      backgroundColor: theme.colors.primary,
    },
    filterBtnText: {
      fontFamily: 'Inter',
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.text,
    },
    filterBtnTextActive: {
      color: theme.colors.secondaryText,
    },
    summaryCard: {
      flexDirection: 'row',
      backgroundColor: theme.colors.pitchBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.secBorder,
      padding: 14,
      marginBottom: 14,
      alignItems: 'center',
    },
    summaryCol: {
      flex: 1,
      alignItems: 'center',
      gap: 2,
    },
    summaryDivider: {
      width: 1,
      height: '80%',
      backgroundColor: theme.colors.lightGray,
    },
    summaryLabel: {
      fontFamily: 'Inter',
      fontSize: 12,
      color: theme.colors.placeholder,
    },
    summaryValue: {
      fontFamily: 'Playfair Display SC',
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    summaryValuePrimary: {
      fontFamily: 'Playfair Display SC',
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.primary,
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
      fontFamily: 'Inter',
      fontSize: 14,
      color: theme.colors.text,
      marginTop: 8,
    },
    emptyContainer: {
      alignItems: 'center',
      paddingVertical: 48,
      paddingHorizontal: 20,
      gap: 10,
    },
    emptyTitle: {
      fontFamily: 'Playfair Display SC',
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontFamily: 'Inter',
      fontSize: 13,
      color: theme.colors.text,
      opacity: 0.75,
      textAlign: 'center',
      lineHeight: 19,
      maxWidth: 320,
    },
    actionBtn: {
      marginTop: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 20,
      minHeight: 48,
      borderRadius: 8,
      gap: 8,
    },
    actionBtnText: {
      fontFamily: 'Inter',
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.secondaryText,
    },
    retryBtn: {
      marginTop: 8,
      backgroundColor: theme.colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    retryBtnText: {
      color: theme.colors.secondaryText,
      fontFamily: 'Inter',
      fontSize: 14,
      fontWeight: '600',
    },
  });
