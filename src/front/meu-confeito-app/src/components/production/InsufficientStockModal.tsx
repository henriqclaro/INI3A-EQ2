import { useMemo } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { CustomButton } from '@/src/components/common';
import { useSettings } from '@/src/contexts/SettingsContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';
import { PurchaseProjectionDeficitItem } from '@/src/types/analytics';
import { formatCurrency, formatQuantity } from '@/src/utils/formatters';

export interface InsufficientStockModalProps {
  isVisible: boolean;
  recipeTitle: string;
  targetYield: number | string;
  yieldUnit?: string;
  deficitItems: PurchaseProjectionDeficitItem[];
  totalEstimatedExpenditure?: number | string;
  onClose: () => void;
  onNavigateToForecast: () => void;
}

export function InsufficientStockModal({
  isVisible,
  recipeTitle,
  targetYield,
  yieldUnit,
  deficitItems,
  totalEstimatedExpenditure,
  onClose,
  onNavigateToForecast,
}: InsufficientStockModalProps) {
  const { theme } = useThemeMode();
  const { priceDecimalPlaces } = useSettings();
  const { width } = useWindowDimensions();

  const isDesktop = width >= 768;
  const styles = useMemo(() => createStyles(theme, isDesktop), [theme, isDesktop]);

  const hasEstimatedCost =
    totalEstimatedExpenditure !== undefined &&
    totalEstimatedExpenditure !== null &&
    Number(totalEstimatedExpenditure) > 0;

  const renderDeficitItem = ({ item }: { item: PurchaseProjectionDeficitItem }) => {
    const hasItemEstimatedCost =
      item.estimatedCost !== undefined &&
      item.estimatedCost !== null &&
      Number(item.estimatedCost) > 0;

    return (
      <View style={styles.itemCard}>
        <View style={styles.itemCardHeader}>
          <View style={styles.itemTitleRow}>
            <MaterialCommunityIcons
              name="food-apple-outline"
              size={18}
              color={theme.colors.primary}
            />
            <Text style={styles.itemName} numberOfLines={1}>
              {item.name}
            </Text>
          </View>

          <View style={styles.deficitBadge}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={14}
              color={theme.colors.error}
            />
            <Text style={styles.deficitBadgeText}>
              Falta {formatQuantity(item.deficitQuantity, item.unit)}
            </Text>
          </View>
        </View>

        <View style={styles.itemDetailsRow}>
          <View style={styles.itemDetailCol}>
            <Text style={styles.itemDetailLabel}>Em Estoque</Text>
            <Text style={styles.itemDetailValue}>
              {formatQuantity(item.currentQuantity, item.unit)}
            </Text>
          </View>

          <View style={styles.itemDetailDivider} />

          <View style={styles.itemDetailCol}>
            <Text style={styles.itemDetailLabel}>Necessário</Text>
            <Text style={styles.itemDetailValue}>
              {formatQuantity(item.requiredQuantity, item.unit)}
            </Text>
          </View>

          {hasItemEstimatedCost && (
            <>
              <View style={styles.itemDetailDivider} />
              <View style={styles.itemDetailCol}>
                <Text style={styles.itemDetailLabel}>Custo Est.</Text>
                <Text style={styles.itemDetailValueCost}>
                  {formatCurrency(item.estimatedCost, priceDecimalPlaces)}
                </Text>
              </View>
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent} accessibilityRole="alert">
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIconContainer}>
              <MaterialCommunityIcons
                name="package-variant-remove"
                size={28}
                color={theme.colors.error}
              />
            </View>
            <View style={styles.headerTextGroup}>
              <Text style={styles.title}>Estoque Insuficiente</Text>
              <Text style={styles.subtitle}>
                Faltam insumos para produzir {targetYield} {yieldUnit || 'unidades'} de &ldquo;
                {recipeTitle}&rdquo;.
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Fechar aviso de estoque insuficiente"
            >
              <MaterialCommunityIcons
                name="close"
                size={20}
                color={theme.colors.onSurfaceVariant}
              />
            </TouchableOpacity>
          </View>

          {/* Missing items list */}
          <View style={styles.listContainer}>
            <Text style={styles.listSectionTitle}>Insumos em Falta ({deficitItems.length}):</Text>
            <FlatList
              data={deficitItems}
              keyExtractor={(item) => String(item.ingredientId)}
              renderItem={renderDeficitItem}
              showsVerticalScrollIndicator={true}
              style={styles.list}
              contentContainerStyle={styles.listContent}
            />
          </View>

          {/* Total Estimated Cost Banner */}
          {hasEstimatedCost && (
            <View style={styles.estimatedCostBanner}>
              <View style={styles.estimatedCostIconWrap}>
                <MaterialCommunityIcons
                  name="calculator-variant-outline"
                  size={18}
                  color={theme.colors.tertiary}
                />
              </View>
              <View style={styles.estimatedCostTextCol}>
                <Text style={styles.estimatedCostLabel}>Estimativa Total para Reposição</Text>
                <Text style={styles.estimatedCostValue}>
                  {formatCurrency(totalEstimatedExpenditure, priceDecimalPlaces)}
                </Text>
              </View>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <CustomButton
              variant="primary"
              onPress={onNavigateToForecast}
              style={styles.forecastButton}
              accessibilityLabel="Ir para previsão de compras desta receita"
            >
              <View style={styles.forecastBtnContent}>
                <MaterialCommunityIcons
                  name="cart-outline"
                  size={18}
                  color={theme.colors.onPrimary}
                />
                <Text style={styles.forecastBtnText}>Previsão de Compras</Text>
              </View>
            </CustomButton>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Voltar para a receita"
            >
              <Text style={styles.cancelBtnText}>Voltar para a Receita</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (theme: AppTheme, isDesktop: boolean) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.colors.backdrop,
      justifyContent: 'center',
      alignItems: 'center',
      padding: isDesktop ? 24 : 16,
    },
    modalContent: {
      width: '100%',
      maxWidth: isDesktop ? 540 : 420,
      maxHeight: '90%',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.rounded.lg,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: isDesktop ? 24 : 18,
      ...theme.shadows.modal,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 16,
      gap: 12,
    },
    headerIconContainer: {
      width: 44,
      height: 44,
      borderRadius: theme.rounded.default,
      backgroundColor: theme.colors.errorContainer,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTextGroup: {
      flex: 1,
    },
    title: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.espressoDark,
      marginBottom: 4,
    },
    subtitle: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 18,
    },
    closeBtn: {
      width: 44,
      height: 44,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: theme.rounded.full,
      marginTop: -8,
      marginRight: -8,
    },
    listContainer: {
      marginBottom: 12,
      maxHeight: 280,
    },
    listSectionTitle: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.espressoDark,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 8,
    },
    list: {
      maxHeight: 240,
    },
    listContent: {
      gap: 8,
      paddingVertical: 2,
    },
    itemCard: {
      backgroundColor: theme.colors.surfaceContainerLow,
      borderRadius: theme.rounded.default,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: 12,
      gap: 8,
    },
    itemCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 8,
    },
    itemTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flex: 1,
    },
    itemName: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.espressoDark,
      flex: 1,
    },
    deficitBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.errorContainer,
      borderRadius: theme.rounded.full,
      paddingHorizontal: 8,
      paddingVertical: 3,
      gap: 4,
    },
    deficitBadgeText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.onErrorContainer,
    },
    itemDetailsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 4,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
    },
    itemDetailCol: {
      flex: 1,
      alignItems: 'flex-start',
    },
    itemDetailDivider: {
      width: 1,
      height: 24,
      backgroundColor: theme.colors.outlineVariant,
      marginHorizontal: 8,
    },
    itemDetailLabel: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
    },
    itemDetailValue: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.espressoDark,
    },
    itemDetailValueCost: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.tertiary,
    },
    estimatedCostBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceContainerLow,
      borderRadius: theme.rounded.default,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: 10,
      gap: 10,
      marginBottom: 16,
    },
    estimatedCostIconWrap: {
      width: 32,
      height: 32,
      borderRadius: theme.rounded.sm,
      backgroundColor: theme.colors.surfaceContainerHighest,
      justifyContent: 'center',
      alignItems: 'center',
    },
    estimatedCostTextCol: {
      flex: 1,
    },
    estimatedCostLabel: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
    },
    estimatedCostValue: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.tertiary,
    },
    actionsContainer: {
      gap: 8,
      width: '100%',
    },
    forecastButton: {
      width: '100%',
      minHeight: 48,
      height: 48,
      margin: 0,
      borderRadius: theme.rounded.default,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
      ...theme.shadows.soft,
    },
    forecastBtnContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    forecastBtnText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.onPrimary,
    },
    cancelBtn: {
      width: '100%',
      minHeight: 48,
      height: 48,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: theme.rounded.default,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surfaceContainerLowest,
    },
    cancelBtnText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.espressoDark,
    },
  });
