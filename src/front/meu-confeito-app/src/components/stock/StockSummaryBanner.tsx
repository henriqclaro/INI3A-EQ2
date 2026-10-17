import { useMemo } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useSettings } from '@/src/contexts/SettingsContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';
import { formatCurrency } from '@/src/utils/formatters';

interface StockSummaryBannerProps {
  totalItems: number;
  totalStockValue: number;
  outOfStockCount: number;
  expiringSoonCount: number;
  expiredCount?: number;
}

export const StockSummaryBanner = ({
  totalItems,
  totalStockValue,
  outOfStockCount,
  expiringSoonCount,
  expiredCount = 0,
}: StockSummaryBannerProps) => {
  const { theme } = useThemeMode();
  const { priceDecimalPlaces } = useSettings();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;
  const isWideScreen = isDesktop || isTablet;

  const styles = useMemo(
    () => createStyles(theme, isDesktop, isTablet),
    [theme, isDesktop, isTablet],
  );

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {/* Metric 1: Total Items */}
        <View style={styles.metricCard}>
          <View style={styles.iconWrapper}>
            <MaterialCommunityIcons
              name="package-variant-closed"
              size={isWideScreen ? 20 : 18}
              color={theme.colors.primary}
            />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.metricLabel} numberOfLines={1}>
              Total de Itens
            </Text>
            <Text style={styles.metricValue} numberOfLines={1}>
              {totalItems}
            </Text>
          </View>
        </View>

        {/* Metric 2: Total Value */}
        <View style={[styles.metricCard, styles.metricCardValue]}>
          <View style={styles.iconWrapper}>
            <MaterialCommunityIcons
              name="cash-multiple"
              size={isWideScreen ? 20 : 18}
              color={theme.colors.tertiary}
            />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.metricLabel} numberOfLines={1}>
              Valor em Estoque
            </Text>
            <Text style={styles.metricValuePrimary} numberOfLines={1} adjustsFontSizeToFit>
              {formatCurrency(totalStockValue, priceDecimalPlaces)}
            </Text>
          </View>
        </View>

        {/* Metric 3: Out of stock */}
        <View style={[styles.metricCard, outOfStockCount > 0 && styles.metricCardAlert]}>
          <View style={[styles.iconWrapper, outOfStockCount > 0 && styles.iconWrapperCritical]}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={isWideScreen ? 20 : 18}
              color={outOfStockCount > 0 ? theme.colors.error : theme.colors.outline}
            />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.metricLabel} numberOfLines={1}>
              Em Falta
            </Text>
            <Text
              style={[
                styles.metricValue,
                outOfStockCount > 0 ? styles.metricValueCritical : undefined,
              ]}
              numberOfLines={1}
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
              size={isWideScreen ? 20 : 18}
              color={expiringSoonCount > 0 ? theme.colors.warning : theme.colors.outline}
            />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.metricLabel} numberOfLines={1}>
              Vence em Breve
            </Text>
            <Text
              style={[
                styles.metricValue,
                expiringSoonCount > 0 ? styles.metricValueWarning : undefined,
              ]}
              numberOfLines={1}
            >
              {expiringSoonCount}
            </Text>
          </View>
        </View>

        {/* Metric 5: Expired items */}
        {expiredCount > 0 && (
          <View style={[styles.metricCard, styles.metricCardAlert]}>
            <View style={[styles.iconWrapper, styles.iconWrapperCritical]}>
              <MaterialCommunityIcons
                name="alert-decagram"
                size={isWideScreen ? 20 : 18}
                color={theme.colors.error}
              />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.metricLabel} numberOfLines={1}>
                Vencidos
              </Text>
              <Text style={[styles.metricValue, styles.metricValueCritical]} numberOfLines={1}>
                {expiredCount}
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const createStyles = (theme: AppTheme, isDesktop: boolean, isTablet: boolean) => {
  const isWide = isDesktop || isTablet;
  return StyleSheet.create({
    container: {
      width: '100%',
      alignSelf: 'center',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.rounded.lg,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: isWide ? 14 : 10,
      marginBottom: isWide ? 16 : 0,
      ...theme.shadows.soft,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: isWide ? 'flex-start' : 'center',
      gap: isWide ? 10 : 8,
    },
    metricCard: {
      flex: 1,
      minWidth: isDesktop ? 190 : isTablet ? 155 : '46%',
      backgroundColor: theme.colors.surfaceContainerLow,
      borderRadius: theme.rounded.md,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: isWide ? 10 : 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: isWide ? 10 : 8,
    },
    metricCardValue: {
      flex: isDesktop ? 1.3 : isWide ? 1.15 : 1,
      minWidth: isDesktop ? 220 : isTablet ? 175 : '46%',
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
      width: isWide ? 36 : 32,
      height: isWide ? 36 : 32,
      borderRadius: isWide ? 18 : 16,
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
      minWidth: 0,
      justifyContent: 'center',
    },
    metricLabel: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
      marginBottom: 2,
      lineHeight: 14,
    },
    metricValue: {
      fontFamily: theme.typography.bodyLg.fontFamily,
      fontSize: isDesktop ? 17 : isTablet ? 15 : 14,
      fontWeight: '700',
      color: theme.colors.espressoDark,
    },
    metricValuePrimary: {
      fontFamily: theme.typography.bodyLg.fontFamily,
      fontSize: isDesktop ? 16 : isTablet ? 15 : 13,
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
};
