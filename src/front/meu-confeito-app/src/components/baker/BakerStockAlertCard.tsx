import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';

export interface BakerStockAlertCardProps {
  lowStockCount: number;
  expiringSoonCount: number;
  expiredCount?: number;
  totalItemsCount: number;
  onPress: () => void;
}

export function BakerStockAlertCard({
  lowStockCount,
  expiringSoonCount,
  expiredCount = 0,
  totalItemsCount,
  onPress,
}: BakerStockAlertCardProps) {
  const { theme } = useThemeMode();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const hasExpired = expiredCount > 0;
  const hasExpiringSoon = expiringSoonCount > 0;
  const hasLowStock = lowStockCount > 0;
  const hasAlert = hasExpired || hasExpiringSoon || hasLowStock;

  const description = useMemo(() => {
    if (totalItemsCount === 0) {
      return 'Nenhum insumo cadastrado ainda. Comece adicionando seus primeiros ingredientes!';
    }
    if (hasExpired) {
      const parts: string[] = [];
      parts.push(
        `${expiredCount} ${expiredCount === 1 ? 'insumo já venceu' : 'insumos já venceram'}`,
      );
      if (hasExpiringSoon) {
        parts.push(`${expiringSoonCount} próximo(s) do vencimento`);
      }
      if (hasLowStock) {
        parts.push(`${lowStockCount} em falta`);
      }
      return `${parts.join(' e ')}. Registre o descarte para manter a segurança alimentar.`;
    }
    if (hasExpiringSoon && hasLowStock) {
      return `${expiringSoonCount} ${expiringSoonCount === 1 ? 'insumo vence' : 'insumos vencem'} nos próximos dias e ${lowStockCount} ${lowStockCount === 1 ? 'insumo está' : 'insumos estão'} em falta.`;
    }
    if (hasExpiringSoon) {
      return `${expiringSoonCount} ${expiringSoonCount === 1 ? 'insumo vence' : 'insumos vencem'} nos próximos dias. Planeje a produção para evitar desperdício.`;
    }
    if (hasLowStock) {
      return `${lowStockCount} ${lowStockCount === 1 ? 'insumo está' : 'insumos estão'} abaixo da quantidade mínima ou em falta.`;
    }
    return `Todos os ${totalItemsCount} ${totalItemsCount === 1 ? 'insumo está' : 'insumos estão'} com estoque seguro e dentro da validade.`;
  }, [
    totalItemsCount,
    hasExpired,
    expiredCount,
    hasExpiringSoon,
    expiringSoonCount,
    hasLowStock,
    lowStockCount,
  ]);

  const cardTitle = useMemo(() => {
    if (totalItemsCount === 0) return 'Cadastre seu Estoque';
    if (hasExpired) return 'Insumos Vencidos';
    if (hasAlert) return 'Atenção ao Estoque';
    return 'Estoque em Dia';
  }, [totalItemsCount, hasExpired, hasAlert]);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        hasExpired ? styles.cardExpired : hasAlert ? styles.cardAlert : styles.cardNormal,
      ]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`${cardTitle}: ${description}`}
    >
      <View style={styles.contentRow}>
        <View
          style={[
            styles.iconCircle,
            hasExpired
              ? styles.iconCircleExpired
              : hasAlert
                ? styles.iconCircleAlert
                : styles.iconCircleNormal,
          ]}
        >
          <MaterialCommunityIcons
            name={
              totalItemsCount === 0
                ? 'package-variant'
                : hasExpired
                  ? 'alert-decagram'
                  : hasAlert
                    ? 'clock-alert-outline'
                    : 'check-circle-outline'
            }
            size={24}
            color={
              hasExpired
                ? theme.colors.error
                : hasAlert
                  ? theme.colors.warning
                  : theme.colors.tertiary
            }
          />
        </View>

        <View style={styles.textContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{cardTitle}</Text>
            <View style={styles.pillsWrapper}>
              {hasExpired && (
                <View style={styles.expiredPill}>
                  <Text style={styles.expiredPillText}>
                    {expiredCount} {expiredCount === 1 ? 'vencido' : 'vencidos'}
                  </Text>
                </View>
              )}
              {hasExpiringSoon && (
                <View style={styles.warningPill}>
                  <Text style={styles.warningPillText}>{expiringSoonCount} a vencer</Text>
                </View>
              )}
              {!hasExpired && !hasExpiringSoon && hasLowStock && (
                <View style={styles.alertPill}>
                  <Text style={styles.alertPillText}>{lowStockCount} em falta</Text>
                </View>
              )}
              {!hasAlert && totalItemsCount > 0 && (
                <View style={styles.successPill}>
                  <Text style={styles.successPillText}>Regular</Text>
                </View>
              )}
            </View>
          </View>
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        </View>

        <MaterialCommunityIcons
          name="chevron-right"
          size={22}
          color={theme.colors.onSurfaceVariant}
          style={styles.chevron}
        />
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    card: {
      width: '100%',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.rounded.lg,
      borderWidth: 1,
      padding: theme.spacing.space4,
      ...theme.shadows.soft,
    },
    cardNormal: {
      borderColor: theme.colors.outlineVariant,
    },
    cardExpired: {
      borderColor: theme.colors.error,
      backgroundColor: theme.colors.surfaceContainerLowest,
    },
    cardAlert: {
      borderColor: theme.colors.warning,
      backgroundColor: theme.colors.surfaceContainerLowest,
    },
    contentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.space3,
    },
    iconCircle: {
      width: 44,
      height: 44,
      borderRadius: theme.rounded.md,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    iconCircleNormal: {
      backgroundColor: theme.colors.surfaceContainerLow,
      borderColor: theme.colors.outlineVariant,
    },
    iconCircleExpired: {
      backgroundColor: theme.colors.errorContainer,
      borderColor: theme.colors.error,
    },
    iconCircleAlert: {
      backgroundColor: theme.colors.surfaceContainerLow,
      borderColor: theme.colors.warning,
    },
    textContainer: {
      flex: 1,
      gap: 2,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.space2,
    },
    title: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.espressoDark,
    },
    pillsWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 4,
    },
    expiredPill: {
      backgroundColor: theme.colors.errorContainer,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: theme.rounded.full,
    },
    expiredPillText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 10,
      fontWeight: '700',
      color: theme.colors.onErrorContainer,
      textTransform: 'uppercase',
    },
    warningPill: {
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.warning,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: theme.rounded.full,
    },
    warningPillText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 10,
      fontWeight: '700',
      color: theme.colors.warning,
      textTransform: 'uppercase',
    },
    alertPill: {
      backgroundColor: theme.colors.chips.accent.background,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: theme.rounded.full,
    },
    alertPillText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 10,
      fontWeight: '700',
      color: theme.colors.error,
      textTransform: 'uppercase',
    },
    successPill: {
      backgroundColor: theme.colors.chips.secondary.background,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: theme.rounded.full,
    },
    successPillText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 10,
      fontWeight: '700',
      color: theme.colors.chips.secondary.text,
      textTransform: 'uppercase',
    },
    description: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 16,
    },
    chevron: {
      marginLeft: 'auto',
    },
  });
