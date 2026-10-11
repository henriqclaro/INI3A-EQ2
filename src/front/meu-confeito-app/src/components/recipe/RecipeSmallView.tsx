import { memo, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Image } from 'expo-image';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';

export interface RecipeSmallViewProps {
  title: string;
  coverUrl: string | null;
  prepTimeMinutes?: number;
  rating?: number | string | null;
  totalReviews?: number;
  onPress?: () => void;
  isClickable?: boolean;
}

export const RecipeSmallView = memo(function RecipeSmallView({
  title,
  coverUrl,
  prepTimeMinutes,
  rating,
  totalReviews,
  onPress,
  isClickable,
}: RecipeSmallViewProps) {
  const { theme } = useThemeMode();
  const [hasImageError, setHasImageError] = useState(false);

  const styles = useMemo(() => createStyles(theme), [theme]);

  const hasValidCover = Boolean(coverUrl && coverUrl.trim().length > 0 && !hasImageError);
  const isInteractive = Boolean(isClickable !== undefined ? isClickable : onPress);
  const hasPrepTime = typeof prepTimeMinutes === 'number' && prepTimeMinutes > 0;

  const formattedRating = useMemo(() => {
    if (rating === undefined || rating === null) return null;
    const num = typeof rating === 'number' ? rating : parseFloat(String(rating));
    if (isNaN(num)) return null;
    return num > 0 ? num.toFixed(1) : '0.0';
  }, [rating]);

  const cardContent = (
    <>
      {hasValidCover ? (
        <Image
          source={{ uri: coverUrl! }}
          style={styles.image}
          contentFit="cover"
          cachePolicy="memory-disk"
          recyclingKey={coverUrl!}
          transition={150}
          onError={() => setHasImageError(true)}
        />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <MaterialCommunityIcons
            name="cake-variant-outline"
            size={28}
            color={theme.colors.primary}
          />
        </View>
      )}

      <View style={styles.infoWrapper}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>

        <View style={styles.badgesRow}>
          {hasPrepTime ? (
            <View style={styles.timeBadge}>
              <MaterialCommunityIcons
                name="timer-outline"
                size={13}
                color={theme.colors.onSurfaceVariant}
              />
              <Text style={styles.timeText}>{prepTimeMinutes} min</Text>
            </View>
          ) : null}

          {formattedRating !== null ? (
            <View style={styles.ratingBadge}>
              <MaterialCommunityIcons name="star" size={13} color="#D97706" />
              <Text style={styles.ratingText}>
                {formattedRating}
                {typeof totalReviews === 'number' && totalReviews > 0 ? ` (${totalReviews})` : ''}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {isInteractive && onPress ? (
        <MaterialCommunityIcons
          name="chevron-right"
          size={20}
          color={theme.colors.outline}
          style={styles.chevron}
        />
      ) : null}
    </>
  );

  if (isInteractive && onPress) {
    return (
      <TouchableOpacity
        style={styles.container}
        onPress={onPress}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={`Receita: ${title}`}
      >
        {cardContent}
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={styles.container}
      accessibilityRole="text"
      accessibilityLabel={`Receita: ${title}`}
    >
      {cardContent}
    </View>
  );
});

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.rounded.lg,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: theme.spacing.space3,
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      minHeight: 88,
      ...theme.shadows.soft,
    },
    image: {
      width: 72,
      height: 72,
      borderRadius: theme.rounded.md,
      marginRight: theme.spacing.space3,
    },
    placeholder: {
      backgroundColor: theme.colors.surfaceContainerLow,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    infoWrapper: {
      flex: 1,
      justifyContent: 'center',
      gap: 6,
    },
    title: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.espressoDark,
      fontFamily: theme.typography.bodyMd.fontFamily,
      lineHeight: 20,
    },
    badgesRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 6,
    },
    timeBadge: {
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius: theme.rounded.full,
      gap: 4,
    },
    timeText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.espressoDark,
      fontFamily: theme.typography.labelSm.fontFamily,
    },
    ratingBadge: {
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius: theme.rounded.full,
      gap: 4,
    },
    ratingText: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.espressoDark,
      fontFamily: theme.typography.labelSm.fontFamily,
    },
    chevron: {
      marginLeft: theme.spacing.space2,
    },
  });
