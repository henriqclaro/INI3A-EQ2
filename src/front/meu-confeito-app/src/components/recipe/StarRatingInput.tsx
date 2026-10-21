import { memo, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { MaterialSymbol } from '@/src/components/common';

import { useThemeMode } from '../../contexts/ThemeContext';
import { AppTheme } from '../../theme/themes';

export interface StarRatingInputProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  isReadOnly?: boolean;
  size?: number;
  activeColor?: string;
  inactiveColor?: string;
  showLabel?: boolean;
}

const RATING_LABELS: Record<number, string> = {
  1: 'Muito Ruim',
  2: 'Ruim',
  3: 'Regular',
  4: 'Muito Boa',
  5: 'Excelente',
};

export const StarRatingInput = memo(function StarRatingInput({
  rating,
  onRatingChange,
  isReadOnly = false,
  size = 32,
  activeColor,
  inactiveColor,
  showLabel = false,
}: StarRatingInputProps) {
  const { theme } = useThemeMode();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const filledColor = activeColor || theme.colors.primary;
  const emptyColor = inactiveColor || theme.colors.outlineVariant;

  const currentLabel = RATING_LABELS[rating] || 'Selecione uma nota';

  return (
    <View style={styles.container}>
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((starValue) => {
          const isFilled = starValue <= rating;

          return (
            <TouchableOpacity
              key={starValue}
              onPress={() => {
                if (!isReadOnly && onRatingChange) {
                  onRatingChange(starValue);
                }
              }}
              disabled={isReadOnly}
              activeOpacity={0.7}
              style={styles.starButton}
              accessibilityRole={isReadOnly ? 'none' : 'button'}
              accessibilityLabel={`${starValue} de 5 estrelas`}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            >
              <MaterialSymbol
                name={isFilled ? 'star' : 'star'}
                size={size}
                color={isFilled ? filledColor : emptyColor}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      {showLabel && !isReadOnly && (
        <Text style={[styles.labelText, Boolean(rating) && styles.labelTextSelected]}>
          {currentLabel}
        </Text>
      )}
    </View>
  );
});

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    starsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.space1,
    },
    starButton: {
      minWidth: 48,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    labelText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
      marginTop: 4,
    },
    labelTextSelected: {
      color: theme.colors.primary,
    },
  });
