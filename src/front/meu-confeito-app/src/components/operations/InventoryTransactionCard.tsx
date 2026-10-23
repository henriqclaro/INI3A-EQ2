import { useMemo } from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';
import { InventoryMovement, TransactionItem } from '@/src/types/inventory';
import { formatCurrency, formatDate } from '@/src/utils/formatters';

export interface InventoryTransactionCardProps {
  transaction: TransactionItem;
  onPress: (transaction: TransactionItem) => void;
  style?: StyleProp<ViewStyle>;
}

interface MovementTypeConfig {
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  backgroundColor: string;
  borderColor: string;
  isPositive: boolean;
}

export function InventoryTransactionCard({
  transaction,
  onPress,
  style,
}: InventoryTransactionCardProps) {
  const { theme, isDarkMode } = useThemeMode();
  const styles = useMemo(() => createStyles(theme, isDarkMode), [theme, isDarkMode]);

  const config = useMemo((): MovementTypeConfig => {
    const type = transaction.transactionType as InventoryMovement;
    switch (type) {
      case 'PURCHASE':
        return {
          label: 'Compra / Entrada',
          icon: 'cart-arrow-down',
          color: isDarkMode ? '#93F7B8' : '#006139',
          backgroundColor: isDarkMode ? '#0A331E' : '#E8F8EE',
          borderColor: isDarkMode ? '#006139' : '#A3E5BA',
          isPositive: true,
        };
      case 'WASTE':
        return {
          label: 'Descarte / Perda',
          icon: 'trash-can-outline',
          color: isDarkMode ? '#FFB4AB' : '#BA1A1A',
          backgroundColor: isDarkMode ? '#4E0E14' : '#FFECEB',
          borderColor: isDarkMode ? '#93000A' : '#FFDAD6',
          isPositive: false,
        };
      case 'MANUAL_ADJUSTMENT': {
        const qtyNum = Number(transaction.quantityChanged) || 0;
        const isQtyPositive = qtyNum >= 0;
        return {
          label: 'Ajuste Manual',
          icon: 'tune-vertical',
          color: isQtyPositive
            ? isDarkMode
              ? '#93F7B8'
              : '#006139'
            : isDarkMode
              ? '#FBBF24'
              : '#B45309',
          backgroundColor: isQtyPositive
            ? isDarkMode
              ? '#0A331E'
              : '#E8F8EE'
            : isDarkMode
              ? '#362000'
              : '#FEF3C7',
          borderColor: isQtyPositive
            ? isDarkMode
              ? '#006139'
              : '#A3E5BA'
            : isDarkMode
              ? '#78350F'
              : '#FCD34D',
          isPositive: isQtyPositive,
        };
      }
      case 'PRODUCTION_USAGE':
        return {
          label: 'Consumo em Produção',
          icon: 'pot-steam-outline',
          color: isDarkMode ? '#FBA8AF' : '#A31940',
          backgroundColor: isDarkMode ? '#3C121B' : '#FBECEF',
          borderColor: isDarkMode ? '#6A1F30' : '#F5DDDE',
          isPositive: false,
        };
      case 'PRODUCTION_REVERSAL':
        return {
          label: 'Estorno de Produção',
          icon: 'backup-restore',
          color: isDarkMode ? '#93F7B8' : '#006139',
          backgroundColor: isDarkMode ? '#0A331E' : '#E8F8EE',
          borderColor: isDarkMode ? '#006139' : '#A3E5BA',
          isPositive: true,
        };
      default:
        return {
          label: 'Movimentação',
          icon: 'swap-horizontal',
          color: theme.colors.onSurfaceVariant,
          backgroundColor: theme.colors.surfaceContainerLow,
          borderColor: theme.colors.outlineVariant,
          isPositive: false,
        };
    }
  }, [transaction.transactionType, transaction.quantityChanged, isDarkMode, theme]);

  const qty = Number(transaction.quantityChanged) || 0;
  const unit = transaction.measurementUnit || transaction.ingredient?.baseUnit || 'UN';
  const formattedQtyPrefix = qty > 0 ? `+${qty}` : `${qty}`;
  const totalCostValue = Number(transaction.totalCost) || 0;
  const unitCostValue = Number(transaction.unitCost) || 0;

  const ingredientName = transaction.ingredient?.name || `Insumo #${transaction.ingredientId}`;
  const recipeTitle = transaction.production?.recipe?.title;

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={() => onPress(transaction)}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`Movimentação de ${ingredientName}, ${config.label}, quantidade ${formattedQtyPrefix} ${unit}`}
    >
      <View style={styles.topRow}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.typeBadge,
              {
                backgroundColor: config.backgroundColor,
                borderColor: config.borderColor,
              },
            ]}
          >
            <MaterialCommunityIcons name={config.icon} size={14} color={config.color} />
            <Text style={[styles.typeBadgeText, { color: config.color }]}>{config.label}</Text>
          </View>

          <Text style={styles.dateText}>{formatDate(transaction.createdAt)}</Text>
        </View>

        <View style={styles.headerRight}>
          <Text
            style={[
              styles.quantityText,
              config.isPositive ? styles.quantityPositive : styles.quantityNegative,
            ]}
          >
            {formattedQtyPrefix} {unit}
          </Text>
        </View>
      </View>

      <View style={styles.bodyRow}>
        <View style={styles.ingredientInfo}>
          <Text style={styles.ingredientTitle} numberOfLines={1}>
            {ingredientName}
          </Text>

          {Boolean(recipeTitle) && (
            <View style={styles.recipeTag}>
              <MaterialCommunityIcons
                name="book-open-variant-outline"
                size={12}
                color={theme.colors.onSurfaceVariant}
              />
              <Text style={styles.recipeTagText} numberOfLines={1}>
                Receita: {recipeTitle}
              </Text>
            </View>
          )}

          {Boolean(transaction.expirationDate) && (
            <View style={styles.expirationTag}>
              <MaterialCommunityIcons
                name="calendar-clock"
                size={12}
                color={theme.colors.onSurfaceVariant}
              />
              <Text style={styles.expirationText}>
                Validade: {formatDate(transaction.expirationDate)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.costInfo}>
          <Text style={styles.totalCostText}>{formatCurrency(totalCostValue)}</Text>
          {unitCostValue > 0 && (
            <Text style={styles.unitCostText}>
              {formatCurrency(unitCostValue)}/{unit}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.tapToViewText}>Toque para ver detalhes da transação</Text>
        <MaterialCommunityIcons
          name="chevron-right"
          size={16}
          color={theme.colors.onSurfaceVariant}
        />
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (theme: AppTheme, isDarkMode: boolean) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.rounded.lg,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: 16,
      minHeight: 48,
      ...theme.shadows.soft,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexShrink: 1,
    },
    typeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: theme.rounded.full,
      borderWidth: 1,
    },
    typeBadgeText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      fontWeight: '700',
    },
    dateText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    headerRight: {
      alignItems: 'flex-end',
    },
    quantityText: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 16,
      fontWeight: 'bold',
    },
    quantityPositive: {
      color: theme.colors.tertiary,
    },
    quantityNegative: {
      color: theme.colors.espressoDark,
    },
    bodyRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      paddingVertical: 4,
      gap: 12,
    },
    ingredientInfo: {
      flex: 1,
      gap: 4,
    },
    ingredientTitle: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.espressoDark,
    },
    recipeTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 2,
    },
    recipeTagText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
    },
    expirationTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 2,
    },
    expirationText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
    },
    costInfo: {
      alignItems: 'flex-end',
      justifyContent: 'center',
      gap: 2,
    },
    totalCostText: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.espressoDark,
    },
    unitCostText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
    },
    footerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 10,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
    },
    tapToViewText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
    },
  });
