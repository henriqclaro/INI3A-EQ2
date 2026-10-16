import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';

export interface BakerOverviewBannerProps {
  recipesCount: number;
  stockCount: number;
  productionsCount: number;
  savedCount: number;
  onRecipesPress?: () => void;
  onStockPress?: () => void;
  onProductionsPress?: () => void;
  onSavedPress?: () => void;
}

export function BakerOverviewBanner({
  recipesCount,
  stockCount,
  productionsCount,
  savedCount,
  onRecipesPress,
  onStockPress,
  onProductionsPress,
  onSavedPress,
}: BakerOverviewBannerProps) {
  const { theme } = useThemeMode();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const metrics = [
    {
      id: 'recipes',
      label: 'Receitas',
      value: recipesCount,
      icon: 'book-open-variant-outline' as const,
      onPress: onRecipesPress,
    },
    {
      id: 'stock',
      label: 'Insumos',
      value: stockCount,
      icon: 'package-variant-closed' as const,
      onPress: onStockPress,
    },
    {
      id: 'productions',
      label: 'Lotes',
      value: productionsCount,
      icon: 'pot-steam-outline' as const,
      onPress: onProductionsPress,
    },
    {
      id: 'saved',
      label: 'Salvas',
      value: savedCount,
      icon: 'bookmark-outline' as const,
      onPress: onSavedPress,
    },
  ];

  return (
    <View style={styles.container}>
      {metrics.map((item, index) => {
        const isLast = index === metrics.length - 1;
        return (
          <TouchableOpacity
            key={item.id}
            style={[styles.statBox, !isLast && styles.statBoxBorder]}
            onPress={item.onPress}
            activeOpacity={0.7}
            disabled={!item.onPress}
            accessibilityRole="button"
            accessibilityLabel={`${item.label}: ${item.value}`}
          >
            <View style={styles.topRow}>
              <MaterialCommunityIcons name={item.icon} size={16} color={theme.colors.primary} />
              <Text style={styles.statValue}>{item.value}</Text>
            </View>
            <Text style={styles.statLabel} numberOfLines={1}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      width: '100%',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.rounded.lg,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.space3,
      paddingHorizontal: theme.spacing.space2,
      ...theme.shadows.soft,
    },
    statBox: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.space1,
      minHeight: 48,
      gap: 2,
    },
    statBoxBorder: {
      borderRightWidth: 1,
      borderRightColor: theme.colors.outlineVariant,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    statValue: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.espressoDark,
    },
    statLabel: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
    },
  });
