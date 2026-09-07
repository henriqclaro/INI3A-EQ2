import { useMemo } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';
import { ProductionItem } from '@/src/types/production';
import { formatCurrency, formatDate } from '@/src/utils/formatters';

export interface ProductionDetailsModalProps {
  isVisible: boolean;
  production: ProductionItem | null;
  onClose: () => void;
  onCancelProduction?: (productionId: string) => void;
  isCanceling?: boolean;
}

export function ProductionDetailsModal({
  isVisible,
  production,
  onClose,
  onCancelProduction,
  isCanceling = false,
}: ProductionDetailsModalProps) {
  const { theme } = useThemeMode();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (!production) return null;

  const hasCanceled = Boolean(production.canceledAt);
  const yieldProduced = Number(production.yieldProduced) || 0;
  const unit = production.recipe?.yieldUnit || 'UN';

  return (
    <Modal visible={isVisible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderTitleGroup}>
              <MaterialCommunityIcons
                name="clipboard-text-outline"
                size={22}
                color={theme.colors.primary}
              />
              <Text style={styles.modalTitle} numberOfLines={1}>
                Detalhes da Produção
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Fechar modal"
            >
              <MaterialCommunityIcons name="close" size={20} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Status & Title Card */}
            <View style={styles.recipeCard}>
              <View style={styles.recipeHeaderRow}>
                <Text style={styles.recipeTitle}>{production.recipe?.title || 'Receita'}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    hasCanceled ? styles.statusBadgeCanceled : styles.statusBadgeActive,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={hasCanceled ? 'close-circle-outline' : 'check-circle-outline'}
                    size={14}
                    color={hasCanceled ? theme.colors.danger : theme.colors.success}
                  />
                  <Text
                    style={[
                      styles.statusBadgeText,
                      hasCanceled ? styles.statusBadgeTextCanceled : styles.statusBadgeTextActive,
                    ]}
                  >
                    {hasCanceled ? 'Cancelada' : 'Concluída'}
                  </Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaText}>
                  Produzido em:{' '}
                  <Text style={styles.metaBold}>{formatDate(production.productionDate)}</Text>
                </Text>
                {production.expirationDate && (
                  <Text style={styles.metaText}>
                    Validade:{' '}
                    <Text style={styles.metaBold}>{formatDate(production.expirationDate)}</Text>
                  </Text>
                )}
                {hasCanceled && (
                  <Text style={styles.metaTextCanceled}>
                    Cancelada em: {formatDate(production.canceledAt)}
                  </Text>
                )}
              </View>

              <View style={styles.yieldContainer}>
                <Text style={styles.yieldLabel}>Rendimento do Lote:</Text>
                <Text style={styles.yieldValue}>
                  {yieldProduced} {unit}
                </Text>
              </View>
            </View>

            {/* Costs Breakdown Card */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons
                  name="calculator-variant-outline"
                  size={18}
                  color={theme.colors.primary}
                />
                <Text style={styles.sectionTitle}>Custos Operacionais</Text>
              </View>

              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Insumos / Ingredientes:</Text>
                <Text style={styles.costValue}>{formatCurrency(production.ingredientCost)}</Text>
              </View>

              {Number(production.laborCost) > 0 && (
                <View style={styles.costRow}>
                  <Text style={styles.costLabel}>Mão de Obra:</Text>
                  <Text style={styles.costValue}>{formatCurrency(production.laborCost)}</Text>
                </View>
              )}

              {Number(production.overheadCost) > 0 && (
                <View style={styles.costRow}>
                  <Text style={styles.costLabel}>Custos Fixos (Overhead):</Text>
                  <Text style={styles.costValue}>{formatCurrency(production.overheadCost)}</Text>
                </View>
              )}

              {Number(production.packagingCost) > 0 && (
                <View style={styles.costRow}>
                  <Text style={styles.costLabel}>Embalagem:</Text>
                  <Text style={styles.costValue}>{formatCurrency(production.packagingCost)}</Text>
                </View>
              )}

              <View style={[styles.costRow, styles.costRowTotal]}>
                <Text style={styles.totalLabel}>Custo Total do Lote:</Text>
                <Text style={styles.totalValue}>{formatCurrency(production.totalCost)}</Text>
              </View>

              <View style={styles.costRow}>
                <Text style={styles.unitCostLabel}>Custo Unitário ({unit}):</Text>
                <Text style={styles.unitCostValue}>{formatCurrency(production.unitCost)}</Text>
              </View>
            </View>

            {/* Inventory Transactions (Consumption) */}
            {production.transactions && production.transactions.length > 0 && (
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons
                    name="tray-arrow-down"
                    size={18}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.sectionTitle}>Insumos Utilizados no Estoque</Text>
                </View>

                {production.transactions.map((tx) => {
                  const qty = Math.abs(Number(tx.quantityChanged) || 0);
                  const ingName = tx.ingredient?.name || `Insumo #${tx.ingredientId}`;
                  return (
                    <View key={tx.id} style={styles.txRow}>
                      <View style={styles.txLeft}>
                        <Text style={styles.txName}>{ingName}</Text>
                        <Text style={styles.txQty}>
                          {qty} {tx.measurementUnit} • {formatCurrency(tx.unitCost)} /{' '}
                          {tx.measurementUnit}
                        </Text>
                      </View>
                      <Text style={styles.txTotal}>{formatCurrency(tx.totalCost)}</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footerRow}>
            {!hasCanceled && onCancelProduction && (
              <TouchableOpacity
                style={styles.cancelProductionBtn}
                onPress={() => onCancelProduction(production.id)}
                disabled={isCanceling}
                accessibilityRole="button"
                accessibilityLabel="Cancelar esta produção e devolver insumos ao estoque"
              >
                <MaterialCommunityIcons
                  name="archive-arrow-up-outline"
                  size={18}
                  color={theme.colors.danger}
                />
                <Text style={styles.cancelProductionBtnText}>Cancelar Produção</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.closeModalBtn}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Fechar"
            >
              <Text style={styles.closeModalBtnText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.colors.backdrop || 'rgba(64, 36, 43, 0.4)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    modalContent: {
      width: '100%',
      maxWidth: 520,
      backgroundColor: theme.colors.background,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.secBorder,
      padding: 20,
      maxHeight: '90%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.secBorder,
      paddingBottom: 10,
    },
    modalHeaderTitleGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    modalTitle: {
      fontFamily: 'Playfair Display SC',
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.primary,
      flex: 1,
    },
    closeBtn: {
      minWidth: 48,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scrollContent: {
      paddingBottom: 10,
      gap: 14,
    },
    recipeCard: {
      backgroundColor: theme.colors.pitchBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.secBorder,
      padding: 14,
      gap: 8,
    },
    recipeHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 10,
    },
    recipeTitle: {
      fontFamily: 'Playfair Display SC',
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      flex: 1,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius: 9999,
      borderWidth: 1,
      backgroundColor: theme.colors.pitchBackground,
      gap: 4,
    },
    statusBadgeActive: {
      borderColor: theme.colors.success,
    },
    statusBadgeCanceled: {
      borderColor: theme.colors.danger,
    },
    statusBadgeText: {
      fontFamily: 'Inter',
      fontSize: 12,
      fontWeight: 'bold',
    },
    statusBadgeTextActive: {
      color: theme.colors.success,
    },
    statusBadgeTextCanceled: {
      color: theme.colors.danger,
    },
    metaRow: {
      gap: 2,
    },
    metaText: {
      fontFamily: 'Inter',
      fontSize: 13,
      color: theme.colors.text,
      opacity: 0.85,
    },
    metaBold: {
      fontWeight: '600',
      color: theme.colors.text,
    },
    metaTextCanceled: {
      fontFamily: 'Inter',
      fontSize: 13,
      color: theme.colors.danger,
      fontWeight: '600',
    },
    yieldContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: theme.colors.lightGray,
      paddingTop: 8,
      marginTop: 4,
    },
    yieldLabel: {
      fontFamily: 'Inter',
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    yieldValue: {
      fontFamily: 'Inter',
      fontSize: 15,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    sectionCard: {
      backgroundColor: theme.colors.pitchBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.secBorder,
      padding: 14,
      gap: 8,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.secBorder,
      paddingBottom: 8,
      marginBottom: 4,
    },
    sectionTitle: {
      fontFamily: 'Playfair Display SC',
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    costRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 4,
    },
    costLabel: {
      fontFamily: 'Inter',
      fontSize: 13,
      color: theme.colors.text,
      opacity: 0.85,
    },
    costValue: {
      fontFamily: 'Inter',
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.text,
    },
    costRowTotal: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.secBorder,
      paddingTop: 8,
      marginTop: 4,
    },
    totalLabel: {
      fontFamily: 'Inter',
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    totalValue: {
      fontFamily: 'Inter',
      fontSize: 15,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    unitCostLabel: {
      fontFamily: 'Inter',
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.text,
    },
    unitCostValue: {
      fontFamily: 'Inter',
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    txRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.lightGray,
    },
    txLeft: {
      flex: 1,
      paddingRight: 8,
    },
    txName: {
      fontFamily: 'Inter',
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.text,
    },
    txQty: {
      fontFamily: 'Inter',
      fontSize: 11,
      color: theme.colors.placeholder,
      marginTop: 2,
    },
    txTotal: {
      fontFamily: 'Inter',
      fontSize: 13,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    footerRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 10,
    },
    cancelProductionBtn: {
      flex: 1,
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.pitchBackground,
      borderWidth: 1,
      borderColor: theme.colors.danger,
      borderRadius: 8,
      gap: 6,
    },
    cancelProductionBtnText: {
      fontFamily: 'Inter',
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.danger,
    },
    closeModalBtn: {
      flex: 1,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
    },
    closeModalBtnText: {
      fontFamily: 'Inter',
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.secondaryText,
    },
  });
