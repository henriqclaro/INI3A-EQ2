import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';

export interface BakerStockAlertCardProps {
  lowStockCount: number;
  expiringSoonCount: number;
  totalItemsCount: number;
  onPress: () => void;
}

export function BakerStockAlertCard({
  lowStockCount,
  expiringSoonCount,
  totalItemsCount,
  onPress,
}: BakerStockAlertCardProps) {
  const { theme } = useThemeMode();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const hasAlert = lowStockCount > 0 || expiringSoonCount > 0;

  const description = useMemo(() => {
    if (totalItemsCount === 0) {
      return 'Nenhum insumo cadastrado ainda. Comece adicionando seus primeiros ingredientes!';
    }
    if (lowStockCount > 0 && expiringSoonCount > 0) {
      return `${lowStockCount} ${lowStockCount === 1 ? 'insumo com estoque baixo' : 'insumos com estoque baixo'} e ${expiringSoonCount} próximo(s) do vencimento.`;
    }
    if (lowStockCount > 0) {
      return `${lowStockCount} ${lowStockCount === 1 ? 'insumo está' : 'insumos estão'} abaixo da quantidade mínima recomendada.`;
    }
    if (expiringSoonCount > 0) {
      return `${expiringSoonCount} ${expiringSoonCount === 1 ? 'insumo vence' : 'insumos vencem'} nos próximos dias.`;
    }
    return `Todos os ${totalItemsCount} ${totalItemsCount === 1 ? 'insumo está' : 'insumos estão'} com estoque seguro e dentro da validade.`;
  }, [totalItemsCount, lowStockCount, expiringSoonCount]);

  const cardTitle = useMemo(() => {
    if (totalItemsCount === 0) return 'Cadastre seu Estoque';
    if (hasAlert) return 'Atenção ao Estoque';
    return 'Estoque em Dia';
  }, [totalItemsCount, hasAlert]);

  return (
    <TouchableOpacity
      style={[styles.card, hasAlert ? styles.cardAlert : styles.cardNormal]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`${cardTitle}: ${description}`}
    >
      <View style={styles.contentRow}>
        <View
          style={[styles.iconCircle, hasAlert ? styles.iconCircleAlert : styles.iconCircleNormal]}
        >
          <MaterialCommunityIcons
            name={
              totalItemsCount === 0
                ? 'package-variant'
                : hasAlert
                  ? 'alert-circle-outline'
                  : 'check-circle-outline'
            }
            size={24}
            color={hasAlert ? theme.colors.error : theme.colors.tertiary}
          />
        </View>

        <View style={styles.textContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{cardTitle}</Text>
            {hasAlert ? (
              <View style={styles.alertPill}>
                <Text style={styles.alertPillText}>
                  {lowStockCount + expiringSoonCount} aviso(s)
                </Text>
              </View>
            ) : totalItemsCount > 0 ? (
              <View style={styles.successPill}>
                <Text style={styles.successPillText}>Regular</Text>
              </View>
            ) : null}
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
    cardAlert: {
      borderColor: theme.colors.error,
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
    iconCircleAlert: {
      backgroundColor: theme.colors.chips.accent.background,
      borderColor: theme.colors.error,
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
