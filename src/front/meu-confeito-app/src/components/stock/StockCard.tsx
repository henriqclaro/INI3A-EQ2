import { memo, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';
import { InventoryItem } from '@/src/types/inventory';
import {
  formatCurrency,
  formatDate,
  formatQuantity,
  isExpired,
  isExpiringSoon,
} from '@/src/utils/formatters';

interface StockCardProps {
  item: InventoryItem;
  cardWidth?: number;
  onAdjust: (item: InventoryItem) => void;
  onPurchase: (item: InventoryItem) => void;
  onWaste: (item: InventoryItem) => void;
}

export const StockCard = memo(function StockCard({
  item,
  cardWidth,
  onAdjust,
  onPurchase,
  onWaste,
}: StockCardProps) {
  const { theme } = useThemeMode();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const qty = Number(item.currentQuantity) || 0;
  const unitCost = Number(item.costPerBaseUnit) || 0;
  const totalValue = qty * unitCost;

  const isOutOfStock = qty <= 0;
  const isCardExpired = isExpired(item.expirationDate);
  const isCardExpiringSoon = !isCardExpired && isExpiringSoon(item.expirationDate);

  const ingredientName = item.ingredient?.name || 'Ingrediente';
  const categoryName = item.ingredient?.category || 'Geral';
  const baseUnit = item.ingredient?.baseUnit || 'un';

  return (
    <View style={[styles.card, cardWidth ? { width: cardWidth } : undefined]}>
      {/* Header: Title + Category pill */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.ingredientName} numberOfLines={2}>
            {ingredientName}
          </Text>
          <View style={styles.categoryPill}>
            <Text style={styles.categoryText}>{categoryName}</Text>
          </View>
        </View>
      </View>

      {/* Main Stock Indicator */}
      <View style={styles.quantitySection}>
        <Text style={styles.quantityLabel}>Saldo em estoque</Text>
        <Text style={styles.quantityValue}>{formatQuantity(qty, baseUnit)}</Text>

        <View style={styles.statusRow}>
          <View
            style={[styles.statusDot, isOutOfStock ? styles.statusDotEmpty : styles.statusDotOk]}
          />
          <Text style={[styles.statusText, isOutOfStock ? styles.statusTextEmpty : undefined]}>
            {isOutOfStock ? 'Em falta' : 'Disponível'}
          </Text>
        </View>
      </View>

      {/* Valuation Metrics */}
      <View style={styles.metricsContainer}>
        <View style={styles.metricItem}>
          <Text style={styles.metricItemLabel}>Custo Unitário Médio</Text>
          <Text style={styles.metricItemValue}>
            {formatCurrency(unitCost)} <Text style={styles.metricUnit}>/ {baseUnit}</Text>
          </Text>
        </View>

        <View style={styles.metricItem}>
          <Text style={styles.metricItemLabel}>Valor no Estoque</Text>
          <Text style={styles.metricItemValuePrimary}>{formatCurrency(totalValue)}</Text>
        </View>
      </View>

      {/* Expiration Date Info */}
      {Boolean(item.expirationDate) && (
        <View
          style={[
            styles.expirationRow,
            isCardExpired
              ? styles.expirationExpired
              : isCardExpiringSoon
                ? styles.expirationSoon
                : undefined,
          ]}
        >
          <MaterialCommunityIcons
            name={
              isCardExpired
                ? 'alert-circle'
                : isCardExpiringSoon
                  ? 'clock-alert-outline'
                  : 'calendar-month-outline'
            }
            size={16}
            color={
              isCardExpired
                ? theme.colors.error
                : isCardExpiringSoon
                  ? theme.colors.warning
                  : theme.colors.onSurfaceVariant
            }
          />
          <Text
            style={[
              styles.expirationText,
              isCardExpired
                ? styles.expirationTextExpired
                : isCardExpiringSoon
                  ? styles.expirationTextSoon
                  : undefined,
            ]}
          >
            {isCardExpired
              ? `Vencido em ${formatDate(item.expirationDate)}`
              : isCardExpiringSoon
                ? `Vence em breve: ${formatDate(item.expirationDate)}`
                : `Validade: ${formatDate(item.expirationDate)}`}
          </Text>
        </View>
      )}

      {/* Action Buttons Row */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionBtnSecondary}
          onPress={() => onAdjust(item)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`Ajustar estoque de ${ingredientName}`}
        >
          <MaterialCommunityIcons name="tune-variant" size={18} color={theme.colors.onSurface} />
          <Text style={styles.actionBtnTextSecondary}>Ajustar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtnPrimary}
          onPress={() => onPurchase(item)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`Registrar compra para ${ingredientName}`}
        >
          <MaterialCommunityIcons name="plus" size={18} color={theme.colors.onPrimary} />
          <Text style={styles.actionBtnTextPrimary}>Compra</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtnDanger}
          onPress={() => onWaste(item)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`Registrar perda de ${ingredientName}`}
          disabled={isOutOfStock}
        >
          <MaterialCommunityIcons
            name="trash-can-outline"
            size={18}
            color={isOutOfStock ? theme.colors.outline : theme.colors.error}
          />
          <Text
            style={[
              styles.actionBtnTextDanger,
              isOutOfStock ? styles.actionBtnTextDisabled : undefined,
            ]}
          >
            Perda
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    card: {
      width: '100%',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.rounded.lg,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: 16,
      gap: 12,
      ...theme.shadows.soft,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    titleContainer: {
      flex: 1,
      gap: 6,
    },
    ingredientName: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.espressoDark,
      lineHeight: 22,
    },
    categoryPill: {
      alignSelf: 'flex-start',
      backgroundColor: theme.colors.surfaceContainerHigh,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: theme.rounded.full,
    },
    categoryText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    quantitySection: {
      backgroundColor: theme.colors.surfaceContainerLow,
      borderRadius: theme.rounded.md,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: 12,
    },
    quantityLabel: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      fontWeight: '500',
      color: theme.colors.onSurfaceVariant,
      marginBottom: 2,
    },
    quantityValue: {
      fontFamily: theme.typography.bodyLg.fontFamily,
      fontSize: 24,
      fontWeight: '800',
      color: theme.colors.espressoDark,
      marginBottom: 6,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    statusDotOk: {
      backgroundColor: theme.colors.tertiary,
    },
    statusDotEmpty: {
      backgroundColor: theme.colors.error,
    },
    statusText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.tertiary,
    },
    statusTextEmpty: {
      color: theme.colors.error,
    },
    metricsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 8,
      paddingHorizontal: 4,
    },
    metricItem: {
      flex: 1,
    },
    metricItemLabel: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 2,
    },
    metricItemValue: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    metricItemValuePrimary: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.tertiary,
    },
    metricUnit: {
      fontSize: 11,
      fontWeight: '400',
      color: theme.colors.onSurfaceVariant,
    },
    expirationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.colors.surfaceContainerLow,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: theme.rounded.sm,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    expirationSoon: {
      backgroundColor: theme.colors.surfaceContainerLow,
      borderColor: theme.colors.warning,
    },
    expirationExpired: {
      backgroundColor: theme.colors.errorContainer,
      borderColor: theme.colors.error,
    },
    expirationText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      fontWeight: '500',
      color: theme.colors.onSurface,
    },
    expirationTextSoon: {
      color: theme.colors.warning,
      fontWeight: '700',
    },
    expirationTextExpired: {
      color: theme.colors.error,
      fontWeight: '700',
    },
    actionsRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 4,
    },
    actionBtnSecondary: {
      flex: 1,
      height: 48,
      borderRadius: theme.rounded.sm,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surfaceContainerLowest,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingHorizontal: 8,
    },
    actionBtnTextSecondary: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    actionBtnPrimary: {
      flex: 1.2,
      height: 48,
      borderRadius: theme.rounded.sm,
      backgroundColor: theme.colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingHorizontal: 8,
      ...theme.shadows.glow,
    },
    actionBtnTextPrimary: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.onPrimary,
    },
    actionBtnDanger: {
      flex: 0.9,
      height: 48,
      borderRadius: theme.rounded.sm,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surfaceContainerLowest,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingHorizontal: 8,
    },
    actionBtnTextDanger: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.error,
    },
    actionBtnTextDisabled: {
      color: theme.colors.outline,
    },
  });
