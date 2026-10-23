import { useMemo } from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';
import { ProductionItem } from '@/src/types/production';
import { formatCurrency, formatDate } from '@/src/utils/formatters';

export interface ProductionCardProps {
  production: ProductionItem;
  onViewDetails: (production: ProductionItem) => void;
  onCancel: (productionId: string) => void;
  isCanceling?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function ProductionCard({
  production,
  onViewDetails,
  onCancel,
  isCanceling = false,
  style,
}: ProductionCardProps) {
  const { theme } = useThemeMode();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const hasCanceled = Boolean(production.canceledAt);
  const yieldProduced = Number(production.yieldProduced) || 0;
  const unit = production.recipe?.yieldUnit || 'UN';

  return (
    <View style={[styles.card, style]}>
      {/* Top row: Recipe title and status badge */}
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {production.recipe?.title || 'Produção de Receita'}
          </Text>
          <Text style={styles.dateText}>Produzido em {formatDate(production.productionDate)}</Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            hasCanceled ? styles.statusBadgeCanceled : styles.statusBadgeActive,
          ]}
        >
          <MaterialCommunityIcons
            name={hasCanceled ? 'close-circle-outline' : 'check-circle-outline'}
            size={13}
            color={hasCanceled ? theme.colors.error : theme.colors.tertiary}
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

      {/* Metrics Row */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCol}>
          <Text style={styles.metricLabel}>Rendimento</Text>
          <Text style={styles.metricValue}>
            {yieldProduced} {unit}
          </Text>
        </View>

        <View style={styles.metricCol}>
          <Text style={styles.metricLabel}>Custo Unitário</Text>
          <Text style={styles.metricValue}>{formatCurrency(production.unitCost)}</Text>
        </View>

        <View style={styles.metricCol}>
          <Text style={styles.metricLabel}>Custo Total</Text>
          <Text style={styles.metricValuePrimary}>{formatCurrency(production.totalCost)}</Text>
        </View>
      </View>

      {Boolean(production.expirationDate) && (
        <View style={styles.expirationRow}>
          <MaterialCommunityIcons
            name="calendar-clock"
            size={14}
            color={theme.colors.onSurfaceVariant}
          />
          <Text style={styles.expirationText}>
            Validade: {formatDate(production.expirationDate)}
          </Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.detailsBtn}
          onPress={() => onViewDetails(production)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Ver detalhes de custos e insumos"
        >
          <MaterialCommunityIcons
            name="format-list-bulleted"
            size={16}
            color={theme.colors.primary}
          />
          <Text style={styles.detailsBtnText}>Ver Detalhes</Text>
        </TouchableOpacity>

        {!hasCanceled && (
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => onCancel(production.id)}
            disabled={isCanceling}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Cancelar produção"
          >
            <MaterialCommunityIcons name="undo-variant" size={16} color={theme.colors.error} />
            <Text style={styles.cancelBtnText}>Cancelar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.rounded.lg,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: 16,
      gap: 12,
      minHeight: 48,
      ...theme.shadows.soft,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 8,
    },
    titleContainer: {
      flex: 1,
    },
    title: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 17,
      fontWeight: '600',
      color: theme.colors.espressoDark,
      marginBottom: 2,
    },
    dateText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius: theme.rounded.full,
      borderWidth: 1,
      gap: 4,
    },
    statusBadgeActive: {
      borderColor: theme.colors.tertiary,
      backgroundColor: theme.colors.chips.success.background,
    },
    statusBadgeCanceled: {
      borderColor: theme.colors.errorContainer,
      backgroundColor: theme.colors.errorContainer,
    },
    statusBadgeText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      fontWeight: '600',
    },
    statusBadgeTextActive: {
      color: theme.colors.chips.success.text,
    },
    statusBadgeTextCanceled: {
      color: theme.colors.error,
    },
    metricsRow: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surfaceContainerLow,
      borderRadius: theme.rounded.sm,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: 10,
      justifyContent: 'space-between',
    },
    metricCol: {
      flex: 1,
      alignItems: 'center',
    },
    metricLabel: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 2,
    },
    metricValue: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    metricValuePrimary: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.tertiary,
    },
    expirationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    expirationText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    actionRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 8,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
      paddingTop: 10,
    },
    detailsBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
      paddingHorizontal: 14,
      borderRadius: theme.rounded.sm,
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      gap: 6,
    },
    detailsBtnText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    cancelBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
      paddingHorizontal: 14,
      borderRadius: theme.rounded.sm,
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.errorContainer,
      gap: 6,
    },
    cancelBtnText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.error,
    },
  });
