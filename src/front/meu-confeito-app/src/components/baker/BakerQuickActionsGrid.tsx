import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';

export interface BakerQuickActionsGridProps {
  stockCount: number;
  hasStockAlert?: boolean;
  savedCount: number;
  productionCount: number;
  onStockPress: () => void;
  onSavedRecipesPress: () => void;
  onPublicRecipesPress: () => void;
  onProductionsPress?: () => void;
  onOperationsPress?: () => void;
}

export function BakerQuickActionsGrid({
  stockCount,
  hasStockAlert = false,
  savedCount,
  productionCount,
  onStockPress,
  onSavedRecipesPress,
  onPublicRecipesPress,
  onProductionsPress,
  onOperationsPress,
}: BakerQuickActionsGridProps) {
  const { theme } = useThemeMode();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const handleOperationsPress = onOperationsPress ?? onProductionsPress ?? (() => {});

  const stockSubtitle = hasStockAlert
    ? 'Atenção necessária'
    : `${stockCount} ${stockCount === 1 ? 'insumo' : 'insumos'}`;

  const savedSubtitle =
    savedCount === 0
      ? 'Caderno de ideias'
      : `${savedCount} ${savedCount === 1 ? 'salva' : 'salvas'}`;

  const productionsSubtitle =
    productionCount === 0
      ? 'Registro de lotes'
      : `${productionCount} ${productionCount === 1 ? 'lote' : 'lotes'}`;

  return (
    <View style={styles.container}>
      {/* Row 1: Stock & Saved Recipes */}
      <View style={styles.row}>
        {/* Button 1: Estoque */}
        <TouchableOpacity
          style={styles.actionCard}
          onPress={onStockPress}
          activeOpacity={0.82}
          accessibilityRole="button"
          accessibilityLabel={`Estoque, ${stockSubtitle}`}
        >
          <View style={styles.cardTopRow}>
            <View style={[styles.iconCircle, styles.stockIconBg]}>
              <MaterialCommunityIcons
                name="package-variant-closed"
                size={24}
                color={theme.colors.primary}
              />
            </View>

            {hasStockAlert ? (
              <View style={styles.alertBadge}>
                <MaterialCommunityIcons name="alert-circle" size={14} color={theme.colors.error} />
                <Text style={styles.alertBadgeText}>Alerta</Text>
              </View>
            ) : (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{stockCount}</Text>
              </View>
            )}
          </View>

          <View style={styles.cardBottom}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              Estoque
            </Text>
            <Text
              style={[styles.cardSubtitle, hasStockAlert && styles.cardSubtitleAlert]}
              numberOfLines={1}
            >
              {stockSubtitle}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Button 2: Receitas Salvas */}
        <TouchableOpacity
          style={styles.actionCard}
          onPress={onSavedRecipesPress}
          activeOpacity={0.82}
          accessibilityRole="button"
          accessibilityLabel={`Receitas Salvas, ${savedSubtitle}`}
        >
          <View style={styles.cardTopRow}>
            <View style={[styles.iconCircle, styles.savedIconBg]}>
              <MaterialCommunityIcons
                name="bookmark-multiple-outline"
                size={24}
                color={theme.colors.primary}
              />
            </View>

            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{savedCount}</Text>
            </View>
          </View>

          <View style={styles.cardBottom}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              Receitas Salvas
            </Text>
            <Text style={styles.cardSubtitle} numberOfLines={1}>
              {savedSubtitle}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Row 2: Public Recipes & Production History */}
      <View style={styles.row}>
        {/* Button 3: Receitas Públicas */}
        <TouchableOpacity
          style={styles.actionCard}
          onPress={onPublicRecipesPress}
          activeOpacity={0.82}
          accessibilityRole="button"
          accessibilityLabel="Receitas Públicas, Explorar comunidade"
        >
          <View style={styles.cardTopRow}>
            <View style={[styles.iconCircle, styles.publicIconBg]}>
              <MaterialCommunityIcons
                name="book-search-outline"
                size={24}
                color={theme.colors.primary}
              />
            </View>

            <View style={styles.exploreBadge}>
              <Text style={styles.exploreBadgeText}>Explorar</Text>
            </View>
          </View>

          <View style={styles.cardBottom}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              Receitas Públicas
            </Text>
            <Text style={styles.cardSubtitle} numberOfLines={1}>
              Comunidade
            </Text>
          </View>
        </TouchableOpacity>

        {/* Button 4: Histórico Operacional */}
        <TouchableOpacity
          style={styles.actionCard}
          onPress={handleOperationsPress}
          activeOpacity={0.82}
          accessibilityRole="button"
          accessibilityLabel={`Histórico Operacional, ${productionsSubtitle}`}
        >
          <View style={styles.cardTopRow}>
            <View style={[styles.iconCircle, styles.productionIconBg]}>
              <MaterialCommunityIcons
                name="clipboard-text-clock-outline"
                size={24}
                color={theme.colors.primary}
              />
            </View>

            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{productionCount}</Text>
            </View>
          </View>

          <View style={styles.cardBottom}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              Operações
            </Text>
            <Text style={styles.cardSubtitle} numberOfLines={1}>
              {productionsSubtitle}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      width: '100%',
      gap: theme.spacing.space3,
    },
    row: {
      flexDirection: 'row',
      gap: theme.spacing.space3,
      width: '100%',
    },
    actionCard: {
      flex: 1,
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.lg,
      padding: theme.spacing.space4,
      minHeight: 110,
      justifyContent: 'space-between',
      ...theme.shadows.soft,
    },
    cardTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.space2,
    },
    iconCircle: {
      width: 44,
      height: 44,
      borderRadius: theme.rounded.md,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    stockIconBg: {
      backgroundColor: theme.colors.surfaceContainerLow,
    },
    savedIconBg: {
      backgroundColor: theme.colors.surfaceContainerLow,
    },
    publicIconBg: {
      backgroundColor: theme.colors.surfaceContainerLow,
    },
    productionIconBg: {
      backgroundColor: theme.colors.surfaceContainerLow,
    },
    countBadge: {
      backgroundColor: theme.colors.surfaceContainerHigh,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: theme.rounded.full,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    countBadgeText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.espressoDark,
    },
    alertBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: theme.colors.chips.accent.background,
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: theme.rounded.full,
    },
    alertBadgeText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 10,
      fontWeight: '700',
      color: theme.colors.error,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    exploreBadge: {
      backgroundColor: theme.colors.chips.secondary.background,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: theme.rounded.full,
    },
    exploreBadgeText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 10,
      fontWeight: '700',
      color: theme.colors.chips.secondary.text,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    cardBottom: {
      gap: 2,
    },
    cardTitle: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.espressoDark,
      letterSpacing: 0.2,
    },
    cardSubtitle: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    cardSubtitleAlert: {
      color: theme.colors.error,
      fontWeight: '600',
    },
  });
