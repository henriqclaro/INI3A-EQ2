import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { router } from 'expo-router';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';

export interface ProductionShortcutCardProps {
  isDesktop?: boolean;
}

export function ProductionShortcutCard({ isDesktop = false }: ProductionShortcutCardProps) {
  const { theme } = useThemeMode();
  const styles = useMemo(() => createStyles(theme, isDesktop), [theme, isDesktop]);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push('/operations-history')}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel="Abrir histórico operacional do ateliê"
    >
      <View style={styles.topRow}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name="clipboard-text-clock-outline"
            size={24}
            color={theme.colors.primary}
          />
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Operações & Estoque</Text>
        </View>
      </View>

      <View style={styles.textBox}>
        <Text style={styles.title}>Histórico Operacional</Text>
        <Text style={styles.subtitle}>
          Consulte os lotes fabricados, custos operacionais, compras, descartes e movimentações de
          estoque.
        </Text>
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.actionText}>Acessar histórico operacional</Text>
        <MaterialCommunityIcons name="arrow-right" size={20} color={theme.colors.primary} />
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (theme: AppTheme, isDesktop: boolean) =>
  StyleSheet.create({
    card: {
      width: '100%',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.lg,
      padding: isDesktop ? 20 : 16,
      gap: 12,
      minHeight: theme.spacing.touchable,
      ...theme.shadows.soft,
    },
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    iconContainer: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.secondaryContainer,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badge: {
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: theme.rounded.full,
    },
    badgeText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    textBox: {
      gap: 4,
    },
    title: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.espressoDark,
    },
    subtitle: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 18,
    },
    footerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
      minHeight: 36,
    },
    actionText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.primary,
    },
  });
