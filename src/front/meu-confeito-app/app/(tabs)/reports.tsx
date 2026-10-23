import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { OfflineBanner, OnboardingCard } from '@/src/components';
import {
  ProductionShortcutCard,
  ProfitSummarySection,
  PurchaseProjectionSection,
} from '@/src/components/analytics';
import { useAuth } from '@/src/contexts/AuthContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { useProfitSummary, usePurchaseProjection } from '@/src/hooks/useAnalytics';
import { AppTheme } from '@/src/theme/themes';
import { isBaker, isCustomer } from '@/src/utils/roles';

type AnalyticsTab = 'profit' | 'projection';

export default function ReportsScreen() {
  const { theme } = useThemeMode();
  const { user } = useAuth();
  const isBakerRole = isBaker(user?.role);
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{
    tab?: string;
    recipeId?: string;
    targetYield?: string;
    recipeTitle?: string;
    yieldUnit?: string;
  }>();

  const [activeTab, setActiveTab] = useState<AnalyticsTab>(() =>
    params.tab === 'projection' ? 'projection' : 'profit',
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  const lastHandledParamsKeyRef = useRef<string>('');
  const scrollViewRef = useRef<ScrollView>(null);
  const contentYRef = useRef(0);
  const tabSelectorYRef = useRef(0);

  const isDesktop = width >= 768;

  useEffect(() => {
    if (isCustomer(user?.role)) {
      router.replace('/(tabs)/home');
    }
  }, [user]);

  const {
    summary,
    isLoading: isProfitLoading,
    isOffline: isProfitOffline,
    hasError: hasProfitError,
    errorMessage: profitErrorMessage,
    activePreset,
    dateRange,
    changePreset,
    refetch: refetchProfit,
  } = useProfitSummary('30d', isBakerRole);

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
    setAndCalculatePlannedProductions,
  } = usePurchaseProjection();

  const handleTabChange = useCallback(
    (tab: AnalyticsTab) => {
      setActiveTab(tab);
      if (params.tab || params.recipeId) {
        router.setParams({
          tab: '',
          recipeId: '',
          targetYield: '',
          recipeTitle: '',
          yieldUnit: '',
        });
      }
    },
    [params.tab, params.recipeId],
  );

  const handleSelectTabWithScroll = useCallback(
    (tab: AnalyticsTab) => {
      handleTabChange(tab);
      setTimeout(() => {
        const totalY = contentYRef.current + tabSelectorYRef.current;
        const targetY = Math.max(0, totalY - 16);
        scrollViewRef.current?.scrollTo({
          y: targetY,
          animated: true,
        });
      }, 100);
    },
    [handleTabChange],
  );

  useFocusEffect(
    useCallback(() => {
      const hasProjectionParam = params.tab === 'projection' || Boolean(params.recipeId);
      const hasProfitParam = params.tab === 'profit';

      if (!hasProjectionParam && !hasProfitParam) {
        lastHandledParamsKeyRef.current = '';
        return;
      }

      const paramKey = `${params.tab || ''}_${params.recipeId || ''}_${params.targetYield || ''}`;
      if (paramKey && lastHandledParamsKeyRef.current !== paramKey) {
        lastHandledParamsKeyRef.current = paramKey;

        if (hasProjectionParam) {
          setActiveTab('projection');
        } else if (hasProfitParam) {
          setActiveTab('profit');
        }

        if (params.recipeId && params.targetYield) {
          setAndCalculatePlannedProductions([
            {
              recipeId: String(params.recipeId),
              targetYield: Number(params.targetYield) || 1,
              recipeTitle: params.recipeTitle ? String(params.recipeTitle) : undefined,
              yieldUnit: params.yieldUnit ? String(params.yieldUnit) : undefined,
            },
          ]);

          setTimeout(() => {
            const totalY = contentYRef.current + tabSelectorYRef.current;
            scrollViewRef.current?.scrollTo({
              y: Math.max(0, totalY - 16),
              animated: true,
            });
          }, 150);
        }

        router.setParams({
          tab: '',
          recipeId: '',
          targetYield: '',
          recipeTitle: '',
          yieldUnit: '',
        });
      }
    }, [
      params.tab,
      params.recipeId,
      params.targetYield,
      params.recipeTitle,
      params.yieldUnit,
      setAndCalculatePlannedProductions,
    ]),
  );

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

  if (!user || !isBakerRole) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
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
        <View
          style={styles.content}
          onLayout={(e) => {
            contentYRef.current = e.nativeEvent.layout.y;
          }}
        >
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
            </View>
          </View>

          {/* Onboarding Cards: Resumo Transformed into Card + Previsão de Compras Card */}
          <OnboardingCard
            id="reports_profit_summary"
            icon="chart-timeline-variant"
            title="Demonstrativo de Rentabilidade"
            description="Monitore o lucro líquido real, analise custos de produção e acompanhe a margem de contribuição de cada receita."
            actionText="Visualizar Rentabilidade"
            onPress={() => {
              handleSelectTabWithScroll('profit');
            }}
          />

          <OnboardingCard
            id="reports_purchase_projection"
            icon="cart-outline"
            title="Previsão Inteligente de Compras"
            description="Simule e planeje compras de insumos para encomendas futuras sem sobras ou falta de matéria-prima."
            actionText="Abrir Previsão de Compras"
            onPress={() => {
              handleSelectTabWithScroll('projection');
            }}
          />

          {/* Quick Operational History Card */}
          <ProductionShortcutCard isDesktop={isDesktop} />

          {/* Offline Mode Banner */}
          <OfflineBanner
            isVisible={isProfitOffline}
            message="Você está offline. Visualizando demonstrativo e métricas consolidadas localmente no seu dispositivo."
            onRetry={handleRefresh}
          />

          {/* Tab Selector Buttons */}
          <View
            style={styles.tabSelectorContainer}
            onLayout={(e) => {
              tabSelectorYRef.current = e.nativeEvent.layout.y;
            }}
          >
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'profit' && styles.tabButtonActive]}
              onPress={() => handleTabChange('profit')}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Ver resumo de rentabilidade e custos"
            >
              <MaterialCommunityIcons
                name="finance"
                size={18}
                color={
                  activeTab === 'profit' ? theme.colors.onPrimary : theme.colors.onSurfaceVariant
                }
              />
              <Text
                style={[styles.tabButtonText, activeTab === 'profit' && styles.tabButtonTextActive]}
              >
                Rentabilidade & Custos
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'projection' && styles.tabButtonActive]}
              onPress={() => handleTabChange('projection')}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Ver projeção e demanda de compras"
            >
              <MaterialCommunityIcons
                name="cart-outline"
                size={18}
                color={
                  activeTab === 'projection'
                    ? theme.colors.onPrimary
                    : theme.colors.onSurfaceVariant
                }
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

          {/* Operational Advisory Banner (Commented out per request) */}
          {/* <View style={styles.advisoryBanner}>
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
          </View> */}
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
      color: theme.colors.onSurfaceVariant,
    },
    tabButtonTextActive: {
      color: theme.colors.onPrimary,
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
    offlineBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.md,
      padding: 12,
      width: '100%',
    },
    offlineBannerText: {
      flex: 1,
      fontSize: 12,
      fontFamily: theme.typography.bodySm.fontFamily,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 16,
    },
  });
