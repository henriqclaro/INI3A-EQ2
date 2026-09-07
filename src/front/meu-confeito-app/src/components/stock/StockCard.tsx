import { useMemo } from 'react';
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

export const StockCard = ({ item, cardWidth, onAdjust, onPurchase, onWaste }: StockCardProps) => {
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
                ? theme.colors.primary
                : isCardExpiringSoon
                  ? theme.colors.tags.product
                  : theme.colors.text
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
          <MaterialCommunityIcons name="tune-variant" size={18} color={theme.colors.text} />
          <Text style={styles.actionBtnTextSecondary}>Ajustar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtnPrimary}
          onPress={() => onPurchase(item)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`Registrar compra para ${ingredientName}`}
        >
          <MaterialCommunityIcons name="plus" size={18} color={theme.colors.secondaryText} />
          <Text style={styles.actionBtnTextPrimary}>+ Compra</Text>
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
            color={isOutOfStock ? theme.colors.placeholder : theme.colors.primary}
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
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    card: {
      width: '100%',
      backgroundColor: theme.colors.pitchBackground,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: 16,
      gap: 12,
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
      fontFamily: 'Playfair Display SC',
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.text,
      lineHeight: 22,
    },
    categoryPill: {
      alignSelf: 'flex-start',
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.secBorder,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 9999,
    },
    categoryText: {
      fontFamily: 'Inter',
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.text,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    quantitySection: {
      backgroundColor: theme.colors.background,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: 12,
    },
    quantityLabel: {
      fontFamily: 'Inter',
      fontSize: 12,
      fontWeight: '500',
      color: theme.colors.text,
      opacity: 0.75,
      marginBottom: 2,
    },
    quantityValue: {
      fontFamily: 'Inter',
      fontSize: 24,
      fontWeight: '800',
      color: theme.colors.text,
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
      backgroundColor: theme.colors.success,
    },
    statusDotEmpty: {
      backgroundColor: theme.colors.primary,
    },
    statusText: {
      fontFamily: 'Inter',
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.success,
    },
    statusTextEmpty: {
      color: theme.colors.primary,
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
      fontFamily: 'Inter',
      fontSize: 11,
      color: theme.colors.placeholder,
      marginBottom: 2,
    },
    metricItemValue: {
      fontFamily: 'Inter',
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
    },
    metricItemValuePrimary: {
      fontFamily: 'Inter',
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    metricUnit: {
      fontSize: 11,
      fontWeight: '400',
      color: theme.colors.placeholder,
    },
    expirationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.colors.background,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    expirationSoon: {
      backgroundColor: theme.colors.background,
      borderColor: theme.colors.tags.product,
    },
    expirationExpired: {
      backgroundColor: theme.colors.background,
      borderColor: theme.colors.secBorder,
    },
    expirationText: {
      fontFamily: 'Inter',
      fontSize: 12,
      fontWeight: '500',
      color: theme.colors.text,
    },
    expirationTextSoon: {
      color: theme.colors.tags.product,
      fontWeight: '600',
    },
    expirationTextExpired: {
      color: theme.colors.primary,
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
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.background,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingHorizontal: 8,
    },
    actionBtnTextSecondary: {
      fontFamily: 'Inter',
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.text,
    },
    actionBtnPrimary: {
      flex: 1.2,
      height: 48,
      borderRadius: 8,
      backgroundColor: theme.colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingHorizontal: 8,
    },
    actionBtnTextPrimary: {
      fontFamily: 'Inter',
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.secondaryText,
    },
    actionBtnDanger: {
      flex: 0.9,
      height: 48,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.secBorder,
      backgroundColor: theme.colors.pitchBackground,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingHorizontal: 8,
    },
    actionBtnTextDanger: {
      fontFamily: 'Inter',
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    actionBtnTextDisabled: {
      color: theme.colors.placeholder,
    },
  });
