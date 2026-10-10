import { memo, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  GestureResponderEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Image } from 'expo-image';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useThemeMode } from '../../contexts/ThemeContext';
import { AppTheme } from '../../theme/themes';
import { UserReviewItem } from '../../types/review';

export interface ReviewedRecipeCardProps {
  item: UserReviewItem;
  onPress: () => void;
  onRemove: () => void;
  isRemoving?: boolean;
}

export const ReviewedRecipeCard = memo(function ReviewedRecipeCard({
  item,
  onPress,
  onRemove,
  isRemoving = false,
}: ReviewedRecipeCardProps) {
  const { theme } = useThemeMode();
  const [hasImageError, setHasImageError] = useState(false);

  const styles = useMemo(() => createStyles(theme), [theme]);

  const hasValidCover = Boolean(
    item.recipe.coverUrl && item.recipe.coverUrl.trim().length > 0 && !hasImageError,
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
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityLabel={`Receita avaliada: ${item.recipe.title}`}
    >
      <View style={styles.imageWrapper}>
        {hasValidCover ? (
          <Image
            source={{ uri: item.recipe.coverUrl! }}
            style={styles.image}
            contentFit="cover"
            cachePolicy="memory-disk"
            recyclingKey={item.recipe.coverUrl!}
            transition={150}
            onError={() => setHasImageError(true)}
          />
        ) : (
          <View style={styles.placeholder}>
            <MaterialCommunityIcons
              name="cake-variant-outline"
              size={32}
              color={theme.colors.primary}
            />
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={2}>
            {item.recipe.title}
          </Text>
        </View>

        {/* User Rating Badge */}
        <View style={styles.ratingRow}>
          <View style={styles.userRatingBadge}>
            <MaterialCommunityIcons name="star" size={15} color={theme.colors.onPrimaryContainer} />
            <Text style={styles.userRatingText}>Sua nota: {item.rating} / 5</Text>
          </View>

          <View style={styles.communityRatingBadge}>
            <MaterialCommunityIcons
              name="star-outline"
              size={13}
              color={theme.colors.onSurfaceVariant}
            />
            <Text style={styles.communityRatingText}>
              Média {formattedAverage} ({item.recipe.totalReviews || 0})
            </Text>
          </View>
        </View>

        <View style={styles.footerRow}>
          {Boolean(formattedDate) && (
            <View style={styles.dateBadge}>
              <MaterialCommunityIcons
                name="calendar-clock-outline"
                size={13}
                color={theme.colors.placeholder}
              />
              <Text style={styles.dateText}>Avaliada em {formattedDate}</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.removeBtn}
            onPress={handleRemovePress}
            disabled={isRemoving}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Remover avaliação de ${item.recipe.title}`}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {isRemoving ? (
              <ActivityIndicator size="small" color={theme.colors.error} />
            ) : (
              <>
                <MaterialCommunityIcons
                  name="trash-can-outline"
                  size={16}
                  color={theme.colors.error}
                />
                <Text style={styles.removeBtnText}>Remover</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.lg,
      padding: theme.spacing.space3,
      gap: theme.spacing.space3,
      alignItems: 'center',
      ...theme.shadows.soft,
    },
    imageWrapper: {
      width: 90,
      height: 90,
      borderRadius: theme.rounded.default,
      overflow: 'hidden',
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
      justifyContent: 'space-between',
      gap: 6,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    title: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.espressoDark,
      flex: 1,
    },
    ratingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 6,
    },
    userRatingBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: theme.colors.primaryContainer,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: theme.rounded.full,
    },
    userRatingText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
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
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: theme.rounded.full,
    },
    communityRatingText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
    },
    footerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 2,
    },
    dateBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    dateText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 11,
      color: theme.colors.placeholder,
    },
    removeBtn: {
      minHeight: 48,
      minWidth: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.space2,
      gap: 4,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.default,
      backgroundColor: theme.colors.surfaceContainerLow,
    },
    removeBtnText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.error,
    },
  });
