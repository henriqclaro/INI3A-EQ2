import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

import { router } from 'expo-router';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import {
  ProductionShortcutCard,
  ProfitSummarySection,
  PurchaseProjectionSection,
} from '@/src/components/analytics';
import { useAuth } from '@/src/contexts/AuthContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { useProfitSummary, usePurchaseProjection } from '@/src/hooks/useAnalytics';
import { AppTheme } from '@/src/theme/themes';

type AnalyticsTab = 'profit' | 'projection';

export default function ReportsScreen() {
  const { theme } = useThemeMode();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('profit');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isDesktop = width >= 768;

  useEffect(() => {
    if (user?.role?.trim().toUpperCase() === 'CUSTOMER') {
      router.replace('/(tabs)/home');
    }
  }, [user]);

  const {
    summary,
    isLoading: isProfitLoading,
    hasError: hasProfitError,
    errorMessage: profitErrorMessage,
    activePreset,
    dateRange,
    changePreset,
    refetch: refetchProfit,
  } = useProfitSummary('30d');

  const {
    plannedProductions,
    projection,
    isCalculating: isProjectionCalculating,
    hasError: hasProjectionError,
    errorMessage: projectionErrorMessage,
    addPlannedProduction,
    updatePlannedProductionYield,
    removePlannedProduction,
    clearPlannedProductions,
    calculateProjection,
  } = usePurchaseProjection();

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      if (activeTab === 'profit') {
        await refetchProfit();
      } else if (plannedProductions.length > 0) {
        await calculateProjection();
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [activeTab, refetchProfit, plannedProductions.length, calculateProjection]);

  const styles = useMemo(() => createStyles(theme, isDesktop), [theme, isDesktop]);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        <View style={styles.content}>
          {/* Header Banner */}
          <View style={styles.headerSection}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons
                name="chart-timeline-variant"
                size={isDesktop ? 36 : 30}
                color={theme.colors.primary}
              />
            </View>
            <View style={styles.headerTextCol}>
              <Text style={styles.title}>Centro de Análises & Métricas</Text>
              <Text style={styles.subtitle}>
                Monitore o lucro líquido real, decomponha seus custos de produção e simule compras
                estratégicas para suas próximas receitas.
              </Text>
            </View>
          </View>

          {/* Quick Production History Card (Kept per request) */}
          <ProductionShortcutCard isDesktop={isDesktop} />

          {/* Tab Selector Buttons */}
          <View style={styles.tabSelectorContainer}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'profit' && styles.tabButtonActive]}
              onPress={() => setActiveTab('profit')}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Ver resumo de rentabilidade e custos"
            >
              <MaterialCommunityIcons
                name="finance"
                size={18}
                color={activeTab === 'profit' ? theme.colors.white : theme.colors.espressoDark}
              />
              <Text
                style={[styles.tabButtonText, activeTab === 'profit' && styles.tabButtonTextActive]}
              >
                Rentabilidade & Custos
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'projection' && styles.tabButtonActive]}
              onPress={() => setActiveTab('projection')}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Ver projeção e demanda de compras"
            >
              <MaterialCommunityIcons
                name="cart-outline"
                size={18}
                color={activeTab === 'projection' ? theme.colors.white : theme.colors.espressoDark}
              />
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === 'projection' && styles.tabButtonTextActive,
                ]}
              >
                Previsão de Compras
              </Text>
            </TouchableOpacity>
          </View>

          {/* Main Analytics View */}
          {activeTab === 'profit' ? (
            <ProfitSummarySection
              summary={summary}
              isLoading={isProfitLoading}
              hasError={hasProfitError}
              errorMessage={profitErrorMessage}
              activePreset={activePreset}
              onChangePreset={changePreset}
              dateRange={dateRange}
              onRefresh={refetchProfit}
              isDesktop={isDesktop}
            />
          ) : (
            <PurchaseProjectionSection
              plannedProductions={plannedProductions}
              projection={projection}
              isCalculating={isProjectionCalculating}
              hasError={hasProjectionError}
              errorMessage={projectionErrorMessage}
              onAddPlannedProduction={addPlannedProduction}
              onUpdateYield={updatePlannedProductionYield}
              onRemovePlannedProduction={removePlannedProduction}
              onClearPlannedProductions={clearPlannedProductions}
              onCalculate={calculateProjection}
              isDesktop={isDesktop}
            />
          )}

          {/* Operational Advisory Banner */}
          <View style={styles.advisoryBanner}>
            <MaterialCommunityIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
              style={styles.advisoryIcon}
            />
            <View style={styles.advisoryContent}>
              <Text style={styles.advisoryTitle}>Inteligência Financeira no Meu Confeito</Text>
              <Text style={styles.advisoryText}>
                As métricas de rentabilidade consolidam o custo real dos ingredientes, perdas no
                estoque e mão de obra em cada lote fabricado. Na previsão de compras, nosso
                algoritmo decompõe todas as sub-receitas para comparar exatamente com o seu estoque
                atual.
              </Text>
            </View>
          </View>

          <Text style={styles.pullHint}>Puxe para baixo para atualizar</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: AppTheme, isDesktop: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContainer: {
      flexGrow: 1,
      alignItems: 'center',
      justifyContent: isDesktop ? 'flex-start' : 'center',
      paddingHorizontal: isDesktop ? 32 : 16,
      paddingVertical: isDesktop ? 32 : 24,
    },
    content: {
      alignItems: 'center',
      maxWidth: isDesktop ? 1040 : 440,
      width: '100%',
      gap: 20,
    },
    headerSection: {
      flexDirection: isDesktop ? 'row' : 'column',
      alignItems: 'center',
      width: '100%',
      gap: 16,
      backgroundColor: theme.colors.surfaceContainerLowest,
      padding: isDesktop ? 24 : 20,
      borderRadius: theme.rounded.lg,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      ...theme.shadows.soft,
    },
    iconCircle: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: theme.colors.secondaryContainer,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTextCol: {
      flex: isDesktop ? 1 : undefined,
      alignItems: isDesktop ? 'flex-start' : 'center',
    },
    title: {
      fontFamily: theme.typography.headlineLg.fontFamily,
      fontSize: isDesktop ? 24 : 20,
      fontWeight: '700',
      color: theme.colors.espressoDark,
      textAlign: isDesktop ? 'left' : 'center',
      marginBottom: 4,
    },
    subtitle: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      textAlign: isDesktop ? 'left' : 'center',
      lineHeight: 20,
    },
    tabSelectorContainer: {
      flexDirection: 'row',
      width: '100%',
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.default,
      padding: 4,
      gap: 6,
    },
    tabButton: {
      flex: 1,
      minHeight: theme.spacing.touchable,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderRadius: theme.rounded.default,
      paddingHorizontal: 12,
    },
    tabButtonActive: {
      backgroundColor: theme.colors.primary,
      ...theme.shadows.glow,
    },
    tabButtonText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.espressoDark,
    },
    tabButtonTextActive: {
      color: theme.colors.white,
    },
    advisoryBanner: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: theme.colors.parchment,
      borderRadius: theme.rounded.md,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: 16,
      gap: 12,
    },
    advisoryIcon: {
      marginTop: 2,
    },
    advisoryContent: {
      flex: 1,
      gap: 4,
    },
    advisoryTitle: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.espressoDark,
    },
    advisoryText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      lineHeight: 18,
      color: theme.colors.onSurfaceVariant,
    },
    pullHint: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      color: theme.colors.outline,
      textAlign: 'center',
      marginTop: 4,
    },
  });
