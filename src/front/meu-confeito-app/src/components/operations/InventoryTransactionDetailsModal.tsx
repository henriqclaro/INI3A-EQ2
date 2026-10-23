import { useMemo } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';
import { InventoryMovement, TransactionItem } from '@/src/types/inventory';
import { formatCurrency, formatDate } from '@/src/utils/formatters';

export interface InventoryTransactionDetailsModalProps {
  isVisible: boolean;
  transaction: TransactionItem | null;
  onClose: () => void;
  onViewProduction?: (productionId: string) => void;
}

export function InventoryTransactionDetailsModal({
  isVisible,
  transaction,
  onClose,
  onViewProduction,
}: InventoryTransactionDetailsModalProps) {
  const { theme, isDarkMode } = useThemeMode();
  const styles = useMemo(() => createStyles(theme, isDarkMode), [theme, isDarkMode]);

  const type = transaction?.transactionType as InventoryMovement | undefined;

  const movementTheme = useMemo(() => {
    switch (type) {
      case 'PURCHASE':
      case 'PRODUCTION_REVERSAL':
        return {
          color: isDarkMode ? '#93F7B8' : '#006139',
          backgroundColor: isDarkMode ? '#0A331E' : '#E8F8EE',
          borderColor: isDarkMode ? '#006139' : '#A3E5BA',
        };
      case 'WASTE':
        return {
          color: isDarkMode ? '#FFB4AB' : '#BA1A1A',
          backgroundColor: isDarkMode ? '#4E0E14' : '#FFECEB',
          borderColor: isDarkMode ? '#93000A' : '#FFDAD6',
        };
      case 'PRODUCTION_USAGE':
        return {
          color: isDarkMode ? '#FBA8AF' : '#A31940',
          backgroundColor: isDarkMode ? '#3C121B' : '#FBECEF',
          borderColor: isDarkMode ? '#6A1F30' : '#F5DDDE',
        };
      default:
        return {
          color: isDarkMode ? '#FBBF24' : '#B45309',
          backgroundColor: isDarkMode ? '#362000' : '#FEF3C7',
          borderColor: isDarkMode ? '#78350F' : '#FCD34D',
        };
    }
  }, [type, isDarkMode]);

  if (!transaction) return null;

  const qty = Number(transaction.quantityChanged) || 0;
  const isPositive = qty > 0;
  const unit = transaction.measurementUnit || transaction.ingredient?.baseUnit || 'UN';
  const formattedQty = isPositive ? `+${qty} ${unit}` : `${qty} ${unit}`;
  const totalCostValue = Number(transaction.totalCost) || 0;
  const unitCostValue = Number(transaction.unitCost) || 0;

  const ingredientName = transaction.ingredient?.name || `Insumo #${transaction.ingredientId}`;
  const production = transaction.production;

  const getMovementLabel = () => {
    switch (type) {
      case 'PURCHASE':
        return 'Compra de Insumo';
      case 'WASTE':
        return 'Descarte / Perda de Insumo';
      case 'MANUAL_ADJUSTMENT':
        return 'Ajuste Manual de Estoque';
      case 'PRODUCTION_USAGE':
        return 'Consumo em Produção';
      case 'PRODUCTION_REVERSAL':
        return 'Estorno de Produção Cancelada';
      default:
        return 'Movimentação de Estoque';
    }
  };

  const getMovementIcon = (): keyof typeof MaterialCommunityIcons.glyphMap => {
    switch (type) {
      case 'PURCHASE':
        return 'cart-arrow-down';
      case 'WASTE':
        return 'trash-can-outline';
      case 'MANUAL_ADJUSTMENT':
        return 'tune-vertical';
      case 'PRODUCTION_USAGE':
        return 'pot-steam-outline';
      case 'PRODUCTION_REVERSAL':
        return 'backup-restore';
      default:
        return 'swap-horizontal';
    }
  };

  return (
    <Modal visible={isVisible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: movementTheme.backgroundColor,
                    borderColor: movementTheme.borderColor,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={getMovementIcon()}
                  size={24}
                  color={movementTheme.color}
                />
              </View>
              <View style={styles.headerTextCol}>
                <Text style={styles.headerTitle}>{getMovementLabel()}</Text>
                <Text style={styles.headerSubtitle}>{ingredientName}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Fechar detalhes da movimentação"
            >
              <MaterialCommunityIcons
                name="close"
                size={22}
                color={theme.colors.onSurfaceVariant}
              />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Impact Highlights */}
            <View style={styles.impactCard}>
              <View style={styles.impactCol}>
                <Text style={styles.impactLabel}>Quantidade</Text>
                <Text
                  style={[
                    styles.impactValue,
                    isPositive ? styles.valuePositive : styles.valueNegative,
                  ]}
                >
                  {formattedQty}
                </Text>
              </View>

              <View style={styles.impactDivider} />

              <View style={styles.impactCol}>
                <Text style={styles.impactLabel}>Valor Contábil</Text>
                <Text style={styles.impactValuePrimary}>{formatCurrency(totalCostValue)}</Text>
              </View>
            </View>

            {/* General Details */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Detalhes do Registro</Text>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Custo Unitário no Momento</Text>
                <Text style={styles.detailValue}>
                  {formatCurrency(unitCostValue)} por {unit}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Data e Hora do Registro</Text>
                <Text style={styles.detailValue}>{formatDate(transaction.createdAt)}</Text>
              </View>

              {Boolean(transaction.expirationDate) && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Data de Validade Vinculada</Text>
                  <Text style={styles.detailValue}>{formatDate(transaction.expirationDate)}</Text>
                </View>
              )}

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Identificador da Transação</Text>
                <Text style={styles.detailCode} numberOfLines={1}>
                  {transaction.id}
                </Text>
              </View>
            </View>

            {/* Production association if available */}
            {Boolean(production || transaction.productionId) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Produção Vinculada</Text>

                {production?.recipe && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Receita Produzida</Text>
                    <Text style={styles.detailValueBold}>{production.recipe.title}</Text>
                  </View>
                )}

                {Boolean(production?.yieldProduced) && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Rendimento do Lote</Text>
                    <Text style={styles.detailValue}>
                      {production?.yieldProduced} {production?.recipe?.yieldUnit || 'UN'}
                    </Text>
                  </View>
                )}

                {Boolean(onViewProduction && transaction.productionId) && (
                  <TouchableOpacity
                    style={styles.viewProductionBtn}
                    onPress={() => {
                      onClose();
                      onViewProduction?.(transaction.productionId!);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Ver lote de produção completo"
                  >
                    <MaterialCommunityIcons
                      name="pot-steam-outline"
                      size={18}
                      color={theme.colors.onPrimary}
                    />
                    <Text style={styles.viewProductionBtnText}>Ver Lote de Produção</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </ScrollView>

          {/* Footer Action */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.closeFooterBtn}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Fechar janela de detalhes"
            >
              <Text style={styles.closeFooterBtnText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (theme: AppTheme, isDarkMode: boolean) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: theme.colors.backdrop,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    modalContainer: {
      width: '100%',
      maxWidth: 580,
      maxHeight: '85%',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.rounded.xl,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      paddingTop: 20,
      paddingHorizontal: 20,
      paddingBottom: 20,
      ...theme.shadows.modal,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    iconBox: {
      width: 44,
      height: 44,
      borderRadius: theme.rounded.md,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTextCol: {
      flex: 1,
      gap: 2,
    },
    headerTitle: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.espressoDark,
    },
    headerSubtitle: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
    closeBtn: {
      width: 48,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.rounded.full,
    },
    scrollArea: {
      paddingVertical: 16,
    },
    impactCard: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surfaceContainerLow,
      borderRadius: theme.rounded.lg,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: 16,
      marginBottom: 20,
      alignItems: 'center',
    },
    impactCol: {
      flex: 1,
      alignItems: 'center',
      gap: 4,
    },
    impactDivider: {
      width: 1,
      height: '80%',
      backgroundColor: theme.colors.outlineVariant,
    },
    impactLabel: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      fontWeight: '500',
      color: theme.colors.onSurfaceVariant,
    },
    impactValue: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 18,
      fontWeight: 'bold',
    },
    valuePositive: {
      color: theme.colors.tertiary,
    },
    valueNegative: {
      color: theme.colors.espressoDark,
    },
    impactValuePrimary: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.espressoDark,
    },
    section: {
      marginBottom: 20,
      gap: 10,
    },
    sectionTitle: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.espressoDark,
      letterSpacing: 0.3,
      textTransform: 'uppercase',
      marginBottom: 4,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.surfaceContainerHigh,
      gap: 8,
    },
    detailLabel: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      flex: 1,
    },
    detailValue: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 13,
      color: theme.colors.espressoDark,
      fontWeight: '500',
    },
    detailValueBold: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.espressoDark,
    },
    detailCode: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
      maxWidth: 160,
    },
    viewProductionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: theme.colors.primary,
      minHeight: 48,
      borderRadius: theme.rounded.md,
      marginTop: 8,
      paddingHorizontal: 16,
    },
    viewProductionBtnText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.onPrimary,
    },
    footer: {
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
    },
    closeFooterBtn: {
      minHeight: 48,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeFooterBtnText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.espressoDark,
    },
  });
