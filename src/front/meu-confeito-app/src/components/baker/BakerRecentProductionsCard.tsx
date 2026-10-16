import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';
import { ProductionItem } from '@/src/types/production';
import { formatCurrency, formatDate } from '@/src/utils/formatters';

export interface BakerRecentProductionsCardProps {
  productions: ProductionItem[];
  isLoading?: boolean;
  onViewAllPress: () => void;
}

export function BakerRecentProductionsCard({
  productions,
  isLoading = false,
  onViewAllPress,
}: BakerRecentProductionsCardProps) {
  const { theme } = useThemeMode();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const recentProductions = useMemo(() => productions.slice(0, 3), [productions]);
  const hasProductions = recentProductions.length > 0;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onViewAllPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel="Últimas produções, ver todas"
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleGroup}>
          <MaterialCommunityIcons name="pot-steam-outline" size={20} color={theme.colors.primary} />
          <Text style={styles.headerTitle}>Últimas Produções</Text>
        </View>

        {hasProductions ? (
          <View style={styles.viewAllBtn}>
            <Text style={styles.viewAllText}>Ver todas</Text>
          </View>
        ) : null}
      </View>

      {/* Content */}
      {hasProductions ? (
        <View style={styles.list}>
          {recentProductions.map((production, index) => {
            const isLast = index === recentProductions.length - 1;
            const recipeTitle = production.recipe?.title || 'Produção de Receita';
            const unit = production.recipe?.yieldUnit || 'un';
            const isCanceled = Boolean(production.canceledAt);

            return (
              <View
                key={production.id}
                style={[styles.productionRow, !isLast && styles.productionRowBorder]}
              >
                <View style={styles.iconBox}>
                  <MaterialCommunityIcons
                    name={isCanceled ? 'close-circle-outline' : 'check-circle-outline'}
                    size={20}
                    color={isCanceled ? theme.colors.error : theme.colors.tertiary}
                  />
                </View>

                <View style={styles.infoCol}>
                  <Text style={styles.itemTitle} numberOfLines={1}>
                    {recipeTitle}
                  </Text>
                  <Text style={styles.itemMeta}>
                    {formatDate(production.productionDate)} • {production.yieldProduced} {unit}
                  </Text>
                </View>

                <View style={styles.costCol}>
                  <Text style={styles.costText}>{formatCurrency(production.totalCost)}</Text>
                  {isCanceled ? (
                    <Text style={styles.canceledBadge}>Cancelado</Text>
                  ) : (
                    <Text style={styles.completedBadge}>Concluído</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {isLoading
              ? 'Carregando histórico...'
              : 'Nenhum lote de produção registrado recentemente.'}
          </Text>
          <View style={styles.emptyButton}>
            <Text style={styles.emptyButtonText}>Abrir Produções</Text>
          </View>
        </View>
      )}
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
      borderColor: theme.colors.outlineVariant,
      padding: theme.spacing.space4,
      ...theme.shadows.soft,
      gap: theme.spacing.space3,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerTitleGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.space2,
    },
    headerTitle: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.espressoDark,
      letterSpacing: 0.2,
    },
    viewAllBtn: {
      paddingVertical: 4,
      paddingHorizontal: 8,
      justifyContent: 'center',
    },
    viewAllText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    list: {
      backgroundColor: theme.colors.surfaceContainerLow,
      borderRadius: theme.rounded.md,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      overflow: 'hidden',
    },
    productionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.space3,
      gap: theme.spacing.space3,
      minHeight: 56,
    },
    productionRowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
    },
    iconBox: {
      width: 36,
      height: 36,
      borderRadius: theme.rounded.sm,
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },
    infoCol: {
      flex: 1,
      gap: 2,
    },
    itemTitle: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.espressoDark,
    },
    itemMeta: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    costCol: {
      alignItems: 'flex-end',
      gap: 2,
    },
    costText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.espressoDark,
    },
    completedBadge: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 10,
      fontWeight: '600',
      color: theme.colors.tertiary,
      textTransform: 'uppercase',
    },
    canceledBadge: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 10,
      fontWeight: '600',
      color: theme.colors.error,
      textTransform: 'uppercase',
    },
    emptyContainer: {
      backgroundColor: theme.colors.surfaceContainerLow,
      borderRadius: theme.rounded.md,
      padding: theme.spacing.space4,
      alignItems: 'center',
      gap: theme.spacing.space3,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    emptyText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
    },
    emptyButton: {
      paddingHorizontal: theme.spacing.space4,
      paddingVertical: theme.spacing.space2,
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.rounded.full,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      minHeight: 48,
      justifyContent: 'center',
    },
    emptyButtonText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.primary,
    },
  });
