import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';
import { formatCurrency } from '@/src/utils/formatters';

export interface OperationsSummaryCardProps {
  mode: 'movements' | 'productions';
  // Movements metrics
  purchasesTotal?: number;
  wasteTotal?: number;
  movementsCount?: number;
  // Productions metrics
  productionsCount?: number;
  productionsTotalCost?: number;
}

export function OperationsSummaryCard({
  mode,
  purchasesTotal = 0,
  wasteTotal = 0,
  movementsCount = 0,
  productionsCount = 0,
  productionsTotalCost = 0,
}: OperationsSummaryCardProps) {
  const { theme } = useThemeMode();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (mode === 'movements') {
    return (
      <View style={styles.summaryCard}>
        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>Total Compras</Text>
          <Text style={styles.summaryValueTertiary}>{formatCurrency(purchasesTotal)}</Text>
        </View>

        <View style={styles.summaryDivider} />

        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>Total Descartes</Text>
          <Text style={styles.summaryValueError}>{formatCurrency(wasteTotal)}</Text>
        </View>

        <View style={styles.summaryDivider} />

        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>Movimentações</Text>
          <Text style={styles.summaryValue}>{movementsCount}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryCol}>
        <Text style={styles.summaryLabel}>Lotes Concluídos</Text>
        <Text style={styles.summaryValue}>{productionsCount}</Text>
      </View>

      <View style={styles.summaryDivider} />

      <View style={styles.summaryCol}>
        <Text style={styles.summaryLabel}>Custo Total Produzido</Text>
        <Text style={styles.summaryValuePrimary}>{formatCurrency(productionsTotalCost)}</Text>
      </View>
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    summaryCard: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.rounded.lg,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: 16,
      marginBottom: 16,
      alignItems: 'center',
      ...theme.shadows.soft,
    },
    summaryCol: {
      flex: 1,
      alignItems: 'center',
      gap: 4,
    },
    summaryDivider: {
      width: 1,
      height: '70%',
      backgroundColor: theme.colors.outlineVariant,
    },
    summaryLabel: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      fontWeight: '500',
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
    },
    summaryValue: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.espressoDark,
    },
    summaryValueTertiary: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.tertiary,
    },
    summaryValueError: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.error,
    },
    summaryValuePrimary: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.tertiary,
    },
  });
