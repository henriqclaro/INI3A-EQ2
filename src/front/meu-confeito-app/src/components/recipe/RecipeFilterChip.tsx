import { memo, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';

export interface RecipeFilterChipProps {
  label: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  trailingIcon?: keyof typeof MaterialCommunityIcons.glyphMap;
  isSelected: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
  count?: number;
}

export const RecipeFilterChip = memo(function RecipeFilterChip({
  label,
  icon,
  trailingIcon,
  isSelected,
  onPress,
  accessibilityLabel,
  count,
}: RecipeFilterChipProps) {
  const { theme } = useThemeMode();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const hasCount = typeof count === 'number' && count >= 0;
  const chipAccessibilityLabel = accessibilityLabel || `${label}${hasCount ? ` (${count})` : ''}`;

  return (
    <TouchableOpacity
      style={[styles.chip, isSelected && styles.chipSelected]}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={chipAccessibilityLabel}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
    >
      {icon ? (
        <MaterialCommunityIcons
          name={icon}
          size={16}
          color={isSelected ? theme.colors.onPrimary : theme.colors.primary}
          style={styles.icon}
        />
      ) : null}

      <Text style={[styles.label, isSelected && styles.labelSelected]}>{label}</Text>

      {hasCount ? (
        <View style={[styles.countBadge, isSelected && styles.countBadgeSelected]}>
          <Text style={[styles.countText, isSelected && styles.countTextSelected]}>{count}</Text>
        </View>
      ) : null}

      {trailingIcon ? (
        <MaterialCommunityIcons
          name={trailingIcon}
          size={16}
          color={isSelected ? theme.colors.onPrimary : theme.colors.espressoDark}
          style={styles.trailingIcon}
        />
      ) : null}
    </TouchableOpacity>
  );
});

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: theme.rounded.full,
      minHeight: 48,
      gap: 8,
      ...theme.shadows.soft,
    },
    chipSelected: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
      ...theme.shadows.glow,
    },
    icon: {
      marginRight: -2,
    },
    trailingIcon: {
      marginLeft: -2,
    },
    label: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.espressoDark,
    },
    labelSelected: {
      color: theme.colors.onPrimary,
      fontWeight: '700',
    },
    countBadge: {
      backgroundColor: theme.colors.surfaceContainerHigh,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: theme.rounded.full,
      minWidth: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    countBadgeSelected: {
      backgroundColor: theme.colors.primaryContainer,
    },
    countText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.espressoDark,
    },
    countTextSelected: {
      color: theme.colors.onPrimaryContainer,
    },
  });
