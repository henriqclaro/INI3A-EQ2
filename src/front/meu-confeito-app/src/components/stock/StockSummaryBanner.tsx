import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';
import { formatCurrency } from '@/src/utils/formatters';

interface StockSummaryBannerProps {
  totalItems: number;
  totalStockValue: number;
  outOfStockCount: number;
  expiringSoonCount: number;
}

export const StockSummaryBanner = ({
  totalItems,
  totalStockValue,
  outOfStockCount,
  expiringSoonCount,
}: StockSummaryBannerProps) => {
  const { theme } = useThemeMode();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {/* Metric 1: Total Items */}
        <View style={styles.metricCard}>
          <View style={styles.iconWrapper}>
            <MaterialCommunityIcons
              name="package-variant-closed"
              size={20}
              color={theme.colors.primary}
            />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.metricLabel}>Total de Itens</Text>
            <Text style={styles.metricValue}>{totalItems}</Text>
          </View>
        </View>

        {/* Metric 2: Total Value */}
        <View style={styles.metricCard}>
          <View style={styles.iconWrapper}>
            <MaterialCommunityIcons name="cash-multiple" size={20} color={theme.colors.tertiary} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.metricLabel}>Valor em Estoque</Text>
            <Text style={styles.metricValuePrimary}>{formatCurrency(totalStockValue)}</Text>
          </View>
        </View>

        {/* Metric 3: Out of stock */}
        <View style={[styles.metricCard, outOfStockCount > 0 && styles.metricCardAlert]}>
          <View style={[styles.iconWrapper, outOfStockCount > 0 && styles.iconWrapperCritical]}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={20}
              color={outOfStockCount > 0 ? theme.colors.error : theme.colors.outline}
            />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.metricLabel}>Em Falta</Text>
            <Text
              style={[
                styles.metricValue,
                outOfStockCount > 0 ? styles.metricValueCritical : undefined,
              ]}
            >
              {outOfStockCount}
            </Text>
          </View>
        </View>

        {/* Metric 4: Expiring soon */}
        <View style={[styles.metricCard, expiringSoonCount > 0 && styles.metricCardWarning]}>
          <View style={[styles.iconWrapper, expiringSoonCount > 0 && styles.iconWrapperWarning]}>
            <MaterialCommunityIcons
              name="clock-alert-outline"
              size={20}
              color={expiringSoonCount > 0 ? theme.colors.warning : theme.colors.outline}
            />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.metricLabel}>Vence em Breve</Text>
            <Text
              style={[
                styles.metricValue,
                expiringSoonCount > 0 ? styles.metricValueWarning : undefined,
              ]}
            >
              {expiringSoonCount}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      width: '100%',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.rounded.lg,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: 14,
      marginBottom: 16,
      ...theme.shadows.soft,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    metricCard: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: theme.colors.surfaceContainerLow,
      borderRadius: theme.rounded.md,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    metricCardAlert: {
      borderColor: theme.colors.error,
      backgroundColor: theme.colors.errorContainer,
    },
    metricCardWarning: {
      borderColor: theme.colors.warning,
      backgroundColor: theme.colors.surfaceContainerLow,
    },
    iconWrapper: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: theme.colors.surfaceContainerLowest,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    iconWrapperCritical: {
      borderColor: theme.colors.error,
      backgroundColor: theme.colors.surfaceContainerLowest,
    },
    iconWrapperWarning: {
      borderColor: theme.colors.warning,
      backgroundColor: theme.colors.surfaceContainerLowest,
    },
    textContainer: {
      flex: 1,
      justifyContent: 'center',
    },
    metricLabel: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
      marginBottom: 2,
    },
    metricValue: {
      fontFamily: theme.typography.bodyLg.fontFamily,
      fontSize: 17,
      fontWeight: '700',
      color: theme.colors.espressoDark,
    },
    metricValuePrimary: {
      fontFamily: theme.typography.bodyLg.fontFamily,
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.tertiary,
    },
    metricValueCritical: {
      color: theme.colors.error,
    },
    metricValueWarning: {
      color: theme.colors.warning,
    },
  });
