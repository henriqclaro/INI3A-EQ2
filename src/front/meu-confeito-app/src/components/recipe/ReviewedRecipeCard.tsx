import { memo, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  GestureResponderEvent,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

import { Image } from 'expo-image';

import { MaterialSymbol } from '@/src/components/common';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';
import { UserReviewItem } from '@/src/types/review';
import { getStorageUrl } from '@/src/utils/image';

export interface ReviewedRecipeCardProps {
  item: UserReviewItem;
  onPress: () => void;
  onRemove: () => void;
  isRemoving?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const ReviewedRecipeCard = memo(function ReviewedRecipeCard({
  item,
  onPress,
  onRemove,
  isRemoving = false,
  style,
}: ReviewedRecipeCardProps) {
  const { theme } = useThemeMode();
  const [hasImageError, setHasImageError] = useState(false);

  const styles = useMemo(() => createStyles(theme), [theme]);

  const recipeCoverUrl = item.recipe.coverUrl;
  const recipeUpdatedAt =
    (item.recipe as { updatedAt?: string | Date }).updatedAt || item.updatedAt || item.createdAt;

  const resolvedCoverUrl = useMemo(
    () => getStorageUrl(recipeCoverUrl, recipeUpdatedAt),
    [recipeCoverUrl, recipeUpdatedAt],
  );

  useEffect(() => {
    setHasImageError(false);
  }, [resolvedCoverUrl]);

  const hasValidCover = Boolean(
    resolvedCoverUrl && resolvedCoverUrl.trim().length > 0 && !hasImageError,
  );

  const formattedDate = useMemo(() => {
    try {
      const rawDate = item.updatedAt || item.createdAt;
      const date = new Date(rawDate);
      return isNaN(date.getTime())
        ? ''
        : date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          });
    } catch {
      return '';
    }
  }, [item.createdAt, item.updatedAt]);

  const formattedAverage = useMemo(() => {
    const avg = Number(item.recipe.averageRating);
    return isNaN(avg) || avg === 0 ? '0.0' : avg.toFixed(1);
  }, [item.recipe.averageRating]);

  const handleRemovePress = (e: GestureResponderEvent) => {
    e.stopPropagation();
    onRemove();
  };

  return (
    <View style={[styles.card, style]}>
      <TouchableOpacity
        style={styles.mainTouchable}
        onPress={onPress}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={`Receita avaliada: ${item.recipe.title}`}
      >
        <View style={styles.imageWrapper}>
          {hasValidCover ? (
            <Image
              source={{ uri: resolvedCoverUrl }}
              style={styles.image}
              contentFit="cover"
              cachePolicy="memory-disk"
              recyclingKey={resolvedCoverUrl}
              transition={150}
              onError={() => setHasImageError(true)}
            />
          ) : (
            <View style={styles.placeholder}>
              <MaterialSymbol name="cake" size={34} color={theme.colors.primary} />
            </View>
          )}
        </View>

        <View style={styles.content}>
          {/* Slot 1: Header / Title (fixed height: 38) */}
          <View style={styles.headerRow}>
            <Text style={styles.title} numberOfLines={2}>
              {item.recipe.title}
            </Text>
            {item.recipe.status === 'SUSPENDED' && (
              <View style={styles.suspendedBadge}>
                <MaterialSymbol name="report" size={12} color={theme.colors.error} />
                <Text style={styles.suspendedBadgeText}>Suspensa</Text>
              </View>
            )}
          </View>

          {/* Slot 2: Middle / Rating Badges (fixed height: 22) */}
          <View style={styles.ratingRow}>
            <View style={styles.userRatingBadge}>
              <MaterialSymbol name="star" size={13} color={theme.colors.onPrimaryContainer} />
              <Text style={styles.userRatingText}>Sua nota: {item.rating} / 5</Text>
            </View>

            <View style={styles.communityRatingBadge}>
              <MaterialSymbol name="star" size={12} color={theme.colors.onSurfaceVariant} />
              <Text style={styles.communityRatingText} numberOfLines={1}>
                Média {formattedAverage} ({item.recipe.totalReviews || 0})
              </Text>
            </View>
          </View>

          {/* Slot 3: Footer / Meta (fixed height: 36) */}
          <View style={styles.footerRow}>
            <View style={styles.metaContainer}>
              {Boolean(formattedDate) && (
                <View style={styles.dateBadge}>
                  <MaterialSymbol name="event_available" size={13} color={theme.colors.primary} />
                  <Text style={styles.dateText} numberOfLines={1}>
                    Avaliada em {formattedDate}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {/* Sibling Remove Button: Absolutely positioned in footer area to avoid nested button on Web */}
      <TouchableOpacity
        style={styles.removeBtn}
        onPress={handleRemovePress}
        disabled={isRemoving}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Remover avaliação de ${item.recipe.title}`}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        {isRemoving ? (
          <ActivityIndicator size="small" color={theme.colors.error} />
        ) : (
          <>
            <MaterialSymbol name="delete" size={15} color={theme.colors.error} />
            <Text style={styles.removeBtnText}>Remover</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
});

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    card: {
      width: '100%',
      height: 132,
      position: 'relative',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.lg,
      ...theme.shadows.soft,
    },
    mainTouchable: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.space3,
      gap: theme.spacing.space3,
    },
    imageWrapper: {
      width: 92,
      height: 92,
      borderRadius: theme.rounded.default,
      overflow: 'hidden',
      flexShrink: 0,
    },
    image: {
      width: '100%',
      height: '100%',
    },
    placeholder: {
      width: '100%',
      height: '100%',
      backgroundColor: theme.colors.surfaceContainerLow,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.default,
    },
    content: {
      flex: 1,
      height: 108,
      minWidth: 0,
      justifyContent: 'space-between',
    },
    headerRow: {
      height: 38,
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      minWidth: 0,
    },
    title: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 15.5,
      lineHeight: 19,
      maxHeight: 38,
      fontWeight: '600',
      color: theme.colors.espressoDark,
      flex: 1,
      minWidth: 0,
    },
    suspendedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: theme.colors.errorContainer,
      borderColor: theme.colors.error,
      borderWidth: 1,
      borderRadius: theme.rounded.full,
      paddingVertical: 2,
      paddingHorizontal: 7,
      gap: 3,
      marginLeft: 6,
    },
    suspendedBadgeText: {
      fontSize: 10,
      fontFamily: theme.typography.labelSm.fontFamily,
      fontWeight: '700',
      color: theme.colors.error,
    },
    ratingRow: {
      height: 22,
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'nowrap',
      gap: 4,
      minWidth: 0,
      overflow: 'hidden',
    },
    userRatingBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: theme.colors.primaryContainer,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: theme.rounded.full,
    },
    userRatingText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 10,
      fontWeight: '600',
      color: theme.colors.onPrimaryContainer,
    },
    communityRatingBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: theme.rounded.full,
      maxWidth: 130,
    },
    communityRatingText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 10,
      color: theme.colors.onSurfaceVariant,
    },
    footerRow: {
      height: 36,
      flexDirection: 'row',
      alignItems: 'center',
      minWidth: 0,
      paddingRight: 84, // ensures meta content never overlaps with absolute removeBtn
    },
    metaContainer: {
      flex: 1,
      minWidth: 0,
      height: 36,
      flexDirection: 'column',
      justifyContent: 'center',
      gap: 2,
    },
    dateBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      minWidth: 0,
    },
    dateText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 10.5,
      color: theme.colors.onSurfaceVariant,
      flexShrink: 1,
    },
    removeBtn: {
      position: 'absolute',
      bottom: theme.spacing.space3,
      right: theme.spacing.space3,
      height: 36,
      minHeight: 36,
      minWidth: 44,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      gap: 4,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.default,
      backgroundColor: theme.colors.surfaceContainerLow,
      zIndex: 10,
    },
    removeBtnText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11.5,
      fontWeight: '600',
      color: theme.colors.error,
    },
  });
