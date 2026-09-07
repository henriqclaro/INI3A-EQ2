import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
}

export function ProductionCard({
  production,
  onViewDetails,
  onCancel,
  isCanceling = false,
}: ProductionCardProps) {
  const { theme } = useThemeMode();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const hasCanceled = Boolean(production.canceledAt);
  const yieldProduced = Number(production.yieldProduced) || 0;
  const unit = production.recipe?.yieldUnit || 'UN';

  return (
    <View style={styles.card}>
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

      {production.expirationDate && (
        <View style={styles.expirationRow}>
          <MaterialCommunityIcons
            name="calendar-clock"
            size={14}
            color={theme.colors.placeholder}
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
            <MaterialCommunityIcons name="undo-variant" size={16} color={theme.colors.danger} />
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
      backgroundColor: theme.colors.pitchBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.secBorder,
      padding: 16,
      marginBottom: 12,
      gap: 12,
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
      fontFamily: 'Playfair Display SC',
      fontSize: 17,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 2,
    },
    dateText: {
      fontFamily: 'Inter',
      fontSize: 12,
      color: theme.colors.placeholder,
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
      fontSize: 11,
      fontWeight: 'bold',
    },
    statusBadgeTextActive: {
      color: theme.colors.success,
    },
    statusBadgeTextCanceled: {
      color: theme.colors.danger,
    },
    metricsRow: {
      flexDirection: 'row',
      backgroundColor: theme.colors.background,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.secBorder,
      padding: 10,
      justifyContent: 'space-between',
    },
    metricCol: {
      flex: 1,
      alignItems: 'center',
    },
    metricLabel: {
      fontFamily: 'Inter',
      fontSize: 11,
      color: theme.colors.placeholder,
      marginBottom: 2,
    },
    metricValue: {
      fontFamily: 'Inter',
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.text,
    },
    metricValuePrimary: {
      fontFamily: 'Inter',
      fontSize: 13,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    expirationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    expirationText: {
      fontFamily: 'Inter',
      fontSize: 12,
      color: theme.colors.placeholder,
    },
    actionRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 8,
      borderTopWidth: 1,
      borderTopColor: theme.colors.lightGray,
      paddingTop: 10,
    },
    detailsBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
      paddingHorizontal: 14,
      borderRadius: 8,
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.primary,
      gap: 6,
    },
    detailsBtnText: {
      fontFamily: 'Inter',
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
      borderRadius: 8,
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.danger,
      gap: 6,
    },
    cancelBtnText: {
      fontFamily: 'Inter',
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.danger,
    },
  });
