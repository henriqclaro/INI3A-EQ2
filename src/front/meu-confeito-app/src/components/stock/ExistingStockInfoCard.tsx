import { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';
import { InventoryItem } from '@/src/types/inventory';
import { StockEntryMode } from '@/src/types/stockEntry';
import {
  formatCurrency,
  formatDate,
  formatQuantity,
  isExpired,
  isExpiringSoon,
} from '@/src/utils/formatters';

export interface ExistingStockInfoCardProps {
  existingItem: InventoryItem;
  baseUnit: string;
  entryMode: StockEntryMode;
  parsedQuantity: number;
  parsedCost: number;
  priceDecimalPlaces: number;
  isMobile: boolean;
}

export const ExistingStockInfoCard = memo(function ExistingStockInfoCard({
  existingItem,
  baseUnit,
  entryMode,
  parsedQuantity,
  parsedCost,
  priceDecimalPlaces,
  isMobile,
}: ExistingStockInfoCardProps) {
  const { theme } = useThemeMode();
  const styles = useMemo(() => createStyles(theme, isMobile), [theme, isMobile]);

  const currentQty = Number(existingItem.currentQuantity) || 0;
  const unitCost = Number(existingItem.costPerBaseUnit) || 0;
  const isOutOfStock = currentQty <= 0;

  const isItemExpired = !isOutOfStock && isExpired(existingItem.expirationDate);
  const isItemExpiringSoon =
    !isOutOfStock && !isItemExpired && isExpiringSoon(existingItem.expirationDate);
  const hasExpiration = Boolean(existingItem.expirationDate);
  const hasLastUpdated = Boolean(existingItem.lastUpdated);

  const hasEnteredQuantity = parsedQuantity > 0;
  const hasEnteredCost = parsedCost > 0;

  // Projected calculations
  const projectedQuantity = useMemo(() => {
    if (entryMode === 'purchase') {
      return currentQty + parsedQuantity;
    }
    return parsedQuantity;
  }, [entryMode, currentQty, parsedQuantity]);

  const projectedUnitCost = useMemo(() => {
    if (entryMode === 'purchase') {
      if (currentQty > 0 && hasEnteredCost && hasEnteredQuantity) {
        return (
          (currentQty * unitCost + parsedCost) / (projectedQuantity > 0 ? projectedQuantity : 1)
        );
      }
      if (hasEnteredCost && hasEnteredQuantity) {
        return parsedCost / parsedQuantity;
      }
      return unitCost;
    }
    return unitCost;
  }, [
    entryMode,
    currentQty,
    unitCost,
    parsedCost,
    hasEnteredCost,
    hasEnteredQuantity,
    projectedQuantity,
    parsedQuantity,
  ]);

  const quantityDifference =
    entryMode === 'adjustment' ? parsedQuantity - currentQty : parsedQuantity;

  return (
    <View
      style={[
        styles.container,
        isOutOfStock ? styles.containerOutOfStock : styles.containerInStock,
      ]}
      accessibilityRole="summary"
      accessibilityLabel={`Informações de estoque existente: ${
        isOutOfStock
          ? 'Item em falta'
          : 'Item em estoque com ' + formatQuantity(currentQty, baseUnit)
      }`}
    >
      {/* Header with status badges */}
      <View style={styles.header}>
        <View style={styles.badgeRow}>
          {/* Status pill: In stock vs Out of stock */}
          <View
            style={[
              styles.statusPill,
              isOutOfStock ? styles.statusPillOutOfStock : styles.statusPillInStock,
            ]}
          >
            <MaterialCommunityIcons
              name={isOutOfStock ? 'alert-circle-outline' : 'check-circle-outline'}
              size={15}
              color={isOutOfStock ? theme.colors.error : theme.colors.tertiary}
            />
            <Text
              style={[
                styles.statusPillText,
                isOutOfStock ? styles.statusPillTextOutOfStock : styles.statusPillTextInStock,
              ]}
            >
              {isOutOfStock
                ? 'Em falta (Saldo zerado)'
                : `Em estoque (${formatQuantity(currentQty, baseUnit)})`}
            </Text>
          </View>

          {/* Catalog badge */}
          <View style={styles.catalogBadge}>
            <MaterialCommunityIcons
              name="database-outline"
              size={14}
              color={theme.colors.onSurfaceVariant}
            />
            <Text style={styles.catalogBadgeText}>Item já cadastrado</Text>
          </View>
        </View>

        {/* Clear Title */}
        <Text style={styles.title}>
          {isOutOfStock
            ? 'Insumo cadastrado no sistema (Atualmente em falta)'
            : 'Insumo já cadastrado com saldo ativo'}
        </Text>

        {/* Explanatory subtitle clarifying form behavior */}
        <Text style={styles.subtitle}>
          {isOutOfStock
            ? 'Este insumo já faz parte do seu catálogo, porém a cozinha não possui unidades em estoque. Ao registrar esta entrada, o insumo será reabastecido normalmente.'
            : entryMode === 'purchase'
              ? 'Este insumo já possui registros ativos no estoque. A compra abaixo será somada ao saldo atual e recalculará o custo médio unitário ponderado.'
              : 'Este insumo já possui registros ativos no estoque. O valor informado abaixo substituirá a contagem do saldo físico atual.'}
        </Text>
      </View>

      {/* Metrics Grid */}
      <View style={styles.metricsGrid}>
        {/* Metric 1: Current Balance */}
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Saldo Atual na Cozinha</Text>
          <Text
            style={[
              styles.metricValue,
              isOutOfStock ? styles.metricValueAlert : styles.metricValueHighlight,
            ]}
          >
            {formatQuantity(currentQty, baseUnit)}
          </Text>
          <View style={styles.metricStatusRow}>
            <View
              style={[styles.statusDot, isOutOfStock ? styles.statusDotAlert : styles.statusDotOk]}
            />
            <Text
              style={[styles.metricSubtext, isOutOfStock ? styles.metricSubtextAlert : undefined]}
            >
              {isOutOfStock ? 'Sem unidades físicas' : 'Disponível para uso'}
            </Text>
          </View>
        </View>

        {/* Metric 2: Average Cost */}
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Custo Unitário Médio</Text>
          <Text style={styles.metricValue}>
            {formatCurrency(unitCost, priceDecimalPlaces)}{' '}
            <Text style={styles.metricUnit}>/ {baseUnit}</Text>
          </Text>
          <Text style={styles.metricSubtext}>
            {unitCost > 0 ? 'Base histórica calculada' : 'Sem custo definido'}
          </Text>
        </View>

        {/* Metric 3: Expiration Date */}
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Validade do Lote</Text>
          <Text
            style={[
              styles.metricValue,
              isItemExpired
                ? styles.metricValueAlert
                : isItemExpiringSoon
                  ? styles.metricValueWarning
                  : undefined,
            ]}
          >
            {hasExpiration ? formatDate(existingItem.expirationDate) : 'Não informada'}
          </Text>
          <Text
            style={[
              styles.metricSubtext,
              isItemExpired
                ? styles.metricSubtextAlert
                : isItemExpiringSoon
                  ? styles.metricSubtextWarning
                  : undefined,
            ]}
          >
            {isItemExpired
              ? 'Lote vencido'
              : isItemExpiringSoon
                ? 'Vence nos próximos dias'
                : hasExpiration
                  ? 'Dentro da validade'
                  : 'Opcional'}
          </Text>
        </View>

        {/* Metric 4: Last Movement */}
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Última Movimentação</Text>
          <Text style={styles.metricValue}>
            {hasLastUpdated ? formatDate(existingItem.lastUpdated) : 'Recente'}
          </Text>
          <Text style={styles.metricSubtext}>No controle de estoque</Text>
        </View>
      </View>

      {/* Projected Result Callout (Live preview of what this entry does) */}
      {hasEnteredQuantity && (
        <View style={styles.projectionBox}>
          <View style={styles.projectionHeader}>
            <MaterialCommunityIcons
              name="swap-horizontal-bold"
              size={18}
              color={theme.colors.primary}
            />
            <Text style={styles.projectionTitle}>Previsão após salvar este registro</Text>
          </View>

          <View style={styles.projectionRow}>
            <Text style={styles.projectionItemLabel}>Novo Saldo Previsto:</Text>
            <Text style={styles.projectionItemValue}>
              {formatQuantity(currentQty, baseUnit)} ➔{' '}
              <Text style={styles.projectionItemValueBold}>
                {formatQuantity(projectedQuantity, baseUnit)}
              </Text>{' '}
              (
              {entryMode === 'purchase'
                ? `+${formatQuantity(parsedQuantity, baseUnit)}`
                : quantityDifference >= 0
                  ? `+${formatQuantity(quantityDifference, baseUnit)}`
                  : `-${formatQuantity(Math.abs(quantityDifference), baseUnit)}`}
              )
            </Text>
          </View>

          {entryMode === 'purchase' && hasEnteredCost && (
            <View style={styles.projectionRow}>
              <Text style={styles.projectionItemLabel}>Novo Custo Médio:</Text>
              <Text style={styles.projectionItemValue}>
                {formatCurrency(unitCost, priceDecimalPlaces)} ➔{' '}
                <Text style={styles.projectionItemValueBold}>
                  {formatCurrency(projectedUnitCost, priceDecimalPlaces)} / {baseUnit}
                </Text>
              </Text>
            </View>
          )}

          {isOutOfStock && (
            <View style={styles.outOfStockResolutionNote}>
              <MaterialCommunityIcons name="check-circle" size={16} color={theme.colors.tertiary} />
              <Text style={styles.outOfStockResolutionText}>
                Este insumo sairá da condição de &apos;Em falta&apos; e passará a ter saldo
                disponível para produção.
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
});

const createStyles = (theme: AppTheme, isMobile: boolean) =>
  StyleSheet.create({
    container: {
      width: '100%',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.rounded.md,
      borderWidth: 1,
      padding: isMobile ? 12 : 16,
      gap: 12,
      ...theme.shadows.soft,
    },
    containerInStock: {
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surfaceContainerLow,
    },
    containerOutOfStock: {
      borderColor: theme.colors.error,
      backgroundColor: theme.colors.surfaceContainerLowest,
    },
    header: {
      gap: 6,
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
    },
    statusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: theme.rounded.full,
      borderWidth: 1,
    },
    statusPillInStock: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderColor: theme.colors.tertiary,
    },
    statusPillOutOfStock: {
      backgroundColor: theme.colors.errorContainer,
      borderColor: theme.colors.error,
    },
    statusPillText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    statusPillTextInStock: {
      color: theme.colors.tertiary,
    },
    statusPillTextOutOfStock: {
      color: theme.colors.onErrorContainer,
    },
    catalogBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: theme.colors.parchment,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: theme.rounded.sm,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    catalogBadgeText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.espressoDark,
    },
    title: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.espressoDark,
      marginTop: 2,
    },
    subtitle: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      lineHeight: 17,
      color: theme.colors.onSurfaceVariant,
    },
    metricsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      width: '100%',
    },
    metricCard: {
      flex: 1,
      minWidth: isMobile ? '47%' : '22%',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.rounded.sm,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: 10,
      gap: 3,
    },
    metricLabel: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
    },
    metricValue: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.espressoDark,
    },
    metricValueHighlight: {
      color: theme.colors.tertiary,
    },
    metricValueAlert: {
      color: theme.colors.error,
    },
    metricValueWarning: {
      color: theme.colors.warning,
    },
    metricUnit: {
      fontSize: 11,
      fontWeight: '400',
      color: theme.colors.onSurfaceVariant,
    },
    metricStatusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginTop: 2,
    },
    statusDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
    },
    statusDotOk: {
      backgroundColor: theme.colors.tertiary,
    },
    statusDotAlert: {
      backgroundColor: theme.colors.error,
    },
    metricSubtext: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 10,
      color: theme.colors.onSurfaceVariant,
    },
    metricSubtextAlert: {
      color: theme.colors.error,
      fontWeight: '600',
    },
    metricSubtextWarning: {
      color: theme.colors.warning,
      fontWeight: '600',
    },
    projectionBox: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.rounded.sm,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: 10,
      gap: 6,
    },
    projectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 2,
    },
    projectionTitle: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    projectionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 4,
    },
    projectionItemLabel: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    projectionItemValue: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      color: theme.colors.espressoDark,
    },
    projectionItemValueBold: {
      fontWeight: '700',
      color: theme.colors.espressoDark,
    },
    outOfStockResolutionNote: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.tertiary,
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: theme.rounded.sm,
      marginTop: 4,
    },
    outOfStockResolutionText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.tertiary,
      flex: 1,
    },
  });
