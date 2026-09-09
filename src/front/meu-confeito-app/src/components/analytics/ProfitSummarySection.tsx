import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AnalyticsPeriodPreset } from '@/src/hooks/useAnalytics';
import { AppTheme } from '@/src/theme/themes';
import { ProfitSummaryData } from '@/src/types/analytics';
import { formatCurrency, formatDate } from '@/src/utils/formatters';

export interface ProfitSummarySectionProps {
  summary: ProfitSummaryData | null;
  isLoading: boolean;
  hasError: boolean;
  errorMessage: string | null;
  activePreset: AnalyticsPeriodPreset;
  onChangePreset: (preset: AnalyticsPeriodPreset) => void;
  dateRange: { startDate: string; endDate: string };
  onRefresh: () => void;
  isDesktop?: boolean;
}

const PRESET_OPTIONS: { key: AnalyticsPeriodPreset; label: string }[] = [
  { key: '7d', label: '7 Dias' },
  { key: '15d', label: '15 Dias' },
  { key: '30d', label: '30 Dias' },
  { key: 'month', label: 'Este Mês' },
];

export function ProfitSummarySection({
  summary,
  isLoading,
  hasError,
  errorMessage,
  activePreset,
  onChangePreset,
  dateRange,
  onRefresh,
  isDesktop = false,
}: ProfitSummarySectionProps) {
  const { theme } = useThemeMode();
  const styles = useMemo(() => createStyles(theme, isDesktop), [theme, isDesktop]);

  const netProfitNumber = useMemo(() => {
    if (!summary) return 0;
    const val = summary.netProfit;
    return typeof val === 'string' ? parseFloat(val) : (val ?? 0);
  }, [summary]);

  const isNetProfitPositive = netProfitNumber >= 0;

  const totalCostNumber = useMemo(() => {
    if (!summary?.costBreakdown?.totalProductionCost) return 0;
    const val = summary.costBreakdown.totalProductionCost;
    return typeof val === 'string' ? parseFloat(val) : (val ?? 0);
  }, [summary]);

  const costBreakdownCalculated = useMemo(() => {
    if (!summary?.costBreakdown) {
      return {
        ingredient: { value: 0, percent: 0 },
        labor: { value: 0, percent: 0 },
        overhead: { value: 0, percent: 0 },
        packaging: { value: 0, percent: 0 },
      };
    }

    const parseVal = (v: number | string | null | undefined) =>
      typeof v === 'string' ? parseFloat(v) : (v ?? 0);

    const ing = parseVal(summary.costBreakdown.ingredientCost);
    const lab = parseVal(summary.costBreakdown.laborCost);
    const ovh = parseVal(summary.costBreakdown.overheadCost);
    const pkg = parseVal(summary.costBreakdown.packagingCost);
    const tot = totalCostNumber > 0 ? totalCostNumber : 1;

    return {
      ingredient: { value: ing, percent: totalCostNumber > 0 ? (ing / tot) * 100 : 0 },
      labor: { value: lab, percent: totalCostNumber > 0 ? (lab / tot) * 100 : 0 },
      overhead: { value: ovh, percent: totalCostNumber > 0 ? (ovh / tot) * 100 : 0 },
      packaging: { value: pkg, percent: totalCostNumber > 0 ? (pkg / tot) * 100 : 0 },
    };
  }, [summary, totalCostNumber]);

  const hasProductions = Boolean(summary && summary.totalProductions > 0);

  return (
    <View style={styles.container}>
      {/* Period Selection Controls */}
      <View style={styles.periodControlsCard}>
        <View style={styles.periodHeaderRow}>
          <View style={styles.periodTitleCol}>
            <Text style={styles.sectionHeading}>Rentabilidade & Custos</Text>
            <Text style={styles.periodDateLabel}>
              Período: {formatDate(dateRange.startDate)} a {formatDate(dateRange.endDate)}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={onRefresh}
            activeOpacity={0.7}
            disabled={isLoading}
            accessibilityRole="button"
            accessibilityLabel="Atualizar métricas de rentabilidade"
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <MaterialCommunityIcons name="refresh" size={20} color={theme.colors.primary} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.presetsRow}>
          {PRESET_OPTIONS.map((item) => {
            const isSelected = activePreset === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.presetChip, isSelected && styles.presetChipActive]}
                onPress={() => onChangePreset(item.key)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`Selecionar período ${item.label}`}
              >
                <Text style={[styles.presetChipText, isSelected && styles.presetChipTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Error Banner */}
      {hasError && (
        <View style={styles.errorBanner}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={20}
            color={theme.colors.error}
          />
          <Text style={styles.errorText}>
            {errorMessage || 'Não foi possível carregar os dados do relatório.'}
          </Text>
        </View>
      )}

      {/* Main Content Loading */}
      {isLoading && !summary && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Carregando métricas de rentabilidade...</Text>
        </View>
      )}

      {/* Metrics Grid */}
      {summary && (
        <>
          {/* Top KPI Cards Grid */}
          <View style={styles.kpiGrid}>
            {/* 1. Faturamento Projetado */}
            <View style={styles.kpiCard}>
              <View style={styles.kpiTopRow}>
                <Text style={styles.kpiLabel}>Faturamento Estimado</Text>
                <View style={styles.kpiIconBox}>
                  <MaterialCommunityIcons
                    name="cash-register"
                    size={20}
                    color={theme.colors.primary}
                  />
                </View>
              </View>
              <Text style={styles.kpiValue}>{formatCurrency(summary.projectedRevenue)}</Text>
              <Text style={styles.kpiSubtitle}>Receita prevista com as margens das receitas</Text>
            </View>

            {/* 2. Custo de Produção */}
            <View style={styles.kpiCard}>
              <View style={styles.kpiTopRow}>
                <Text style={styles.kpiLabel}>Custos de Produção</Text>
                <View style={styles.kpiIconBox}>
                  <MaterialCommunityIcons
                    name="chart-pie"
                    size={20}
                    color={theme.colors.secondary}
                  />
                </View>
              </View>
              <Text style={styles.kpiValue}>{formatCurrency(summary.totalProductionCost)}</Text>
              <Text style={styles.kpiSubtitle}>
                {summary.totalProductions} lote(s) de receitas fabricados
              </Text>
            </View>

            {/* 3. Desperdício / Perdas */}
            <View style={styles.kpiCard}>
              <View style={styles.kpiTopRow}>
                <Text style={styles.kpiLabel}>Desperdício / Perdas</Text>
                <View style={styles.kpiIconBox}>
                  <MaterialCommunityIcons
                    name="trash-can-outline"
                    size={20}
                    color={theme.colors.error}
                  />
                </View>
              </View>
              <Text style={[styles.kpiValue, styles.kpiValueWarning]}>
                {formatCurrency(summary.wasteCost)}
              </Text>
              <Text style={styles.kpiSubtitle}>Baixas por descarte no estoque</Text>
            </View>

            {/* 4. Lucro Líquido Realizado (Highlighted Hero KPI) */}
            <View
              style={[
                styles.kpiCard,
                styles.kpiCardHero,
                isNetProfitPositive ? styles.kpiCardHeroPositive : styles.kpiCardHeroNegative,
              ]}
            >
              <View style={styles.kpiTopRow}>
                <Text style={styles.kpiLabel}>Lucro Líquido Realizado</Text>
                <View
                  style={[
                    styles.marginBadge,
                    isNetProfitPositive ? styles.marginBadgePositive : styles.marginBadgeNegative,
                  ]}
                >
                  <Text
                    style={[
                      styles.marginBadgeText,
                      isNetProfitPositive
                        ? styles.marginBadgeTextPositive
                        : styles.marginBadgeTextNegative,
                    ]}
                  >
                    {isNetProfitPositive ? '+' : ''}
                    {summary.achievedMarginPercent}% margem
                  </Text>
                </View>
              </View>
              <Text
                style={[
                  styles.kpiValueHero,
                  isNetProfitPositive ? styles.kpiValuePositive : styles.kpiValueNegative,
                ]}
              >
                {formatCurrency(summary.netProfit)}
              </Text>
              <Text style={styles.kpiSubtitle}>
                {isNetProfitPositive
                  ? 'Receita estimada deduzida de custos e perdas'
                  : 'Atenção: custos e desperdícios superaram o faturamento previsto'}
              </Text>
            </View>
          </View>

          {/* Cost Breakdown Section */}
          <View style={styles.breakdownCard}>
            <View style={styles.breakdownHeader}>
              <View>
                <Text style={styles.breakdownTitle}>Composição dos Custos</Text>
                <Text style={styles.breakdownSubtitle}>
                  Detalhamento de gastos dos lotes fabricados no período
                </Text>
              </View>
              <Text style={styles.breakdownTotal}>{formatCurrency(totalCostNumber)}</Text>
            </View>

            {/* Stacked Proportional Bar */}
            {totalCostNumber > 0 && (
              <View style={styles.progressBarWrapper}>
                <View
                  style={[
                    styles.progressSegment,
                    {
                      width: `${costBreakdownCalculated.ingredient.percent}%`,
                      backgroundColor: theme.colors.primary,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.progressSegment,
                    {
                      width: `${costBreakdownCalculated.labor.percent}%`,
                      backgroundColor: theme.colors.secondary,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.progressSegment,
                    {
                      width: `${costBreakdownCalculated.overhead.percent}%`,
                      backgroundColor: theme.colors.accentBrown,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.progressSegment,
                    {
                      width: `${costBreakdownCalculated.packaging.percent}%`,
                      backgroundColor: theme.colors.warning,
                    },
                  ]}
                />
              </View>
            )}

            {/* Breakdown Rows */}
            <View style={styles.breakdownList}>
              {/* Row 1: Insumos */}
              <View style={styles.breakdownRow}>
                <View style={styles.breakdownLeftCol}>
                  <View style={[styles.colorDot, { backgroundColor: theme.colors.primary }]} />
                  <Text style={styles.breakdownName}>Insumos & Ingredientes</Text>
                </View>
                <View style={styles.breakdownRightCol}>
                  <Text style={styles.breakdownAmount}>
                    {formatCurrency(costBreakdownCalculated.ingredient.value)}
                  </Text>
                  <View style={styles.percentBadge}>
                    <Text style={styles.percentBadgeText}>
                      {costBreakdownCalculated.ingredient.percent.toFixed(1)}%
                    </Text>
                  </View>
                </View>
              </View>

              {/* Row 2: Mão de Obra */}
              <View style={styles.breakdownRow}>
                <View style={styles.breakdownLeftCol}>
                  <View style={[styles.colorDot, { backgroundColor: theme.colors.secondary }]} />
                  <Text style={styles.breakdownName}>Mão de Obra</Text>
                </View>
                <View style={styles.breakdownRightCol}>
                  <Text style={styles.breakdownAmount}>
                    {formatCurrency(costBreakdownCalculated.labor.value)}
                  </Text>
                  <View style={styles.percentBadge}>
                    <Text style={styles.percentBadgeText}>
                      {costBreakdownCalculated.labor.percent.toFixed(1)}%
                    </Text>
                  </View>
                </View>
              </View>

              {/* Row 3: Custos Fixos */}
              <View style={styles.breakdownRow}>
                <View style={styles.breakdownLeftCol}>
                  <View style={[styles.colorDot, { backgroundColor: theme.colors.accentBrown }]} />
                  <Text style={styles.breakdownName}>Custos Operacionais / Fixos</Text>
                </View>
                <View style={styles.breakdownRightCol}>
                  <Text style={styles.breakdownAmount}>
                    {formatCurrency(costBreakdownCalculated.overhead.value)}
                  </Text>
                  <View style={styles.percentBadge}>
                    <Text style={styles.percentBadgeText}>
                      {costBreakdownCalculated.overhead.percent.toFixed(1)}%
                    </Text>
                  </View>
                </View>
              </View>

              {/* Row 4: Embalagens */}
              <View style={[styles.breakdownRow, styles.breakdownRowLast]}>
                <View style={styles.breakdownLeftCol}>
                  <View style={[styles.colorDot, { backgroundColor: theme.colors.warning }]} />
                  <Text style={styles.breakdownName}>Embalagens</Text>
                </View>
                <View style={styles.breakdownRightCol}>
                  <Text style={styles.breakdownAmount}>
                    {formatCurrency(costBreakdownCalculated.packaging.value)}
                  </Text>
                  <View style={styles.percentBadge}>
                    <Text style={styles.percentBadgeText}>
                      {costBreakdownCalculated.packaging.percent.toFixed(1)}%
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Empty state when 0 productions */}
          {!hasProductions && (
            <View style={styles.emptyStateCard}>
              <MaterialCommunityIcons
                name="clipboard-text-search-outline"
                size={36}
                color={theme.colors.outline}
              />
              <Text style={styles.emptyStateTitle}>Nenhuma produção no período</Text>
              <Text style={styles.emptyStateDescription}>
                Não encontramos lotes fabricados entre {formatDate(dateRange.startDate)} e{' '}
                {formatDate(dateRange.endDate)}. Selecione um período diferente ou registre uma
                produção para visualizar indicadores operacionais.
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const createStyles = (theme: AppTheme, isDesktop: boolean) =>
  StyleSheet.create({
    container: {
      width: '100%',
      gap: 16,
    },
    periodControlsCard: {
      width: '100%',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.lg,
      padding: isDesktop ? 20 : 16,
      gap: 16,
      ...theme.shadows.soft,
    },
    periodHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    periodTitleCol: {
      flex: 1,
      gap: 2,
    },
    sectionHeading: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: isDesktop ? 20 : 18,
      fontWeight: '700',
      color: theme.colors.espressoDark,
    },
    periodDateLabel: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    refreshButton: {
      minWidth: theme.spacing.touchable,
      minHeight: theme.spacing.touchable,
      borderRadius: theme.rounded.full,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },
    presetsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    presetChip: {
      minHeight: theme.spacing.touchable,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: theme.rounded.full,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },
    presetChipActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    presetChipText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.espressoDark,
    },
    presetChipTextActive: {
      color: theme.colors.white,
    },
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: theme.colors.errorContainer,
      borderRadius: theme.rounded.default,
      padding: 12,
      borderWidth: 1,
      borderColor: theme.colors.error,
    },
    errorText: {
      flex: 1,
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onErrorContainer,
    },
    loadingContainer: {
      padding: 32,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },
    loadingText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
    kpiGrid: {
      width: '100%',
      flexDirection: isDesktop ? 'row' : 'column',
      flexWrap: isDesktop ? 'wrap' : 'nowrap',
      gap: 14,
    },
    kpiCard: {
      flex: isDesktop ? 1 : undefined,
      minWidth: isDesktop ? '48%' : '100%',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.lg,
      padding: 16,
      gap: 8,
      ...theme.shadows.soft,
    },
    kpiCardHero: {
      minWidth: '100%',
    },
    kpiCardHeroPositive: {
      borderColor: theme.colors.tertiary,
      backgroundColor: theme.colors.surfaceContainerLow,
    },
    kpiCardHeroNegative: {
      borderColor: theme.colors.error,
      backgroundColor: theme.colors.errorContainer,
    },
    kpiTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    kpiLabel: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    kpiIconBox: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },
    kpiValue: {
      fontFamily: theme.typography.headlineLg.fontFamily,
      fontSize: 22,
      fontWeight: '700',
      color: theme.colors.espressoDark,
    },
    kpiValueWarning: {
      color: theme.colors.error,
    },
    kpiValueHero: {
      fontFamily: theme.typography.headlineXl.fontFamily,
      fontSize: 28,
      fontWeight: '700',
    },
    kpiValuePositive: {
      color: theme.colors.tertiary,
    },
    kpiValueNegative: {
      color: theme.colors.error,
    },
    kpiSubtitle: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    marginBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: theme.rounded.full,
      borderWidth: 1,
    },
    marginBadgePositive: {
      backgroundColor: theme.colors.chips.success.background,
      borderColor: theme.colors.tertiary,
    },
    marginBadgeNegative: {
      backgroundColor: theme.colors.errorContainer,
      borderColor: theme.colors.error,
    },
    marginBadgeText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      fontWeight: '700',
    },
    marginBadgeTextPositive: {
      color: theme.colors.chips.success.text,
    },
    marginBadgeTextNegative: {
      color: theme.colors.onErrorContainer,
    },
    breakdownCard: {
      width: '100%',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.lg,
      padding: isDesktop ? 20 : 16,
      gap: 16,
      ...theme.shadows.soft,
    },
    breakdownHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    breakdownTitle: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.espressoDark,
    },
    breakdownSubtitle: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
    },
    breakdownTotal: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    progressBarWrapper: {
      width: '100%',
      height: 12,
      borderRadius: 6,
      backgroundColor: theme.colors.surfaceContainerHigh,
      flexDirection: 'row',
      overflow: 'hidden',
    },
    progressSegment: {
      height: '100%',
    },
    breakdownList: {
      width: '100%',
    },
    breakdownRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.surfaceContainerHigh,
      minHeight: 44,
    },
    breakdownRowLast: {
      borderBottomWidth: 0,
    },
    breakdownLeftCol: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    colorDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    breakdownName: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 14,
      color: theme.colors.espressoDark,
    },
    breakdownRightCol: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    breakdownAmount: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.espressoDark,
    },
    percentBadge: {
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: theme.rounded.default,
      minWidth: 44,
      alignItems: 'center',
    },
    percentBadgeText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
    },
    emptyStateCard: {
      width: '100%',
      backgroundColor: theme.colors.parchment,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.lg,
      padding: 24,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      textAlign: 'center',
    },
    emptyStateTitle: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.espressoDark,
    },
    emptyStateDescription: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      lineHeight: 18,
      maxWidth: 400,
    },
  });
