import { memo, useEffect, useMemo, useState } from 'react';
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

import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';
import { UserSavedRecipeItem } from '@/src/types/saved-recipe';
import { getStorageUrl } from '@/src/utils/image';
import { getTagColors } from '@/src/utils/tag';

interface SavedRecipeCardProps {
  item: UserSavedRecipeItem;
  onPress: () => void;
  onRemove: () => void;
  isRemoving?: boolean;
}

export const SavedRecipeCard = memo(function SavedRecipeCard({
  item,
  onPress,
  onRemove,
  isRemoving = false,
}: SavedRecipeCardProps) {
  const { theme } = useThemeMode();
  const [hasImageError, setHasImageError] = useState(false);

  const styles = useMemo(() => createStyles(theme), [theme]);

  const recipeCoverUrl = item.recipe.coverUrl;
  const recipeUpdatedAt = (item.recipe as { updatedAt?: string | Date }).updatedAt || item.savedAt;

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
      const date = new Date(item.savedAt);
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
  }, [item.savedAt]);

  const styledTags = useMemo(() => {
    if (!Array.isArray(item.recipe.tags)) return [];
    return item.recipe.tags.map((t) => {
      const tagColors = getTagColors(t?.tag?.type, theme);
      return {
        ...t,
        backgroundColor: tagColors.backgroundColor,
        textColor: tagColors.textColor,
        borderColor: tagColors.borderColor,
      };
    });
  }, [item.recipe.tags, theme]);

  const handleRemovePress = (e: GestureResponderEvent) => {
    e.stopPropagation();
    onRemove();
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityLabel={`Receita salva: ${item.recipe.title}`}
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

        {styledTags.length > 0 && (
          <View style={styles.tagsContainer}>
            {styledTags.slice(0, 3).map((tagObj) => (
              <View
                key={tagObj?.tag?.id || tagObj?.tag?.name}
                style={[
                  styles.tagBadge,
                  {
                    backgroundColor: tagObj.backgroundColor,
                    borderColor: tagObj.borderColor,
                  },
                ]}
              >
                <Text style={[styles.tagText, { color: tagObj.textColor }]}>
                  {tagObj?.tag?.name}
                </Text>
              </View>
            ))}
            {styledTags.length > 3 && (
              <Text style={styles.tagMoreText}>+{styledTags.length - 3}</Text>
            )}
          </View>
        )}

        <View style={styles.footerRow}>
          <View style={styles.metaContainer}>
            {item.recipe.prepTimeMinutes > 0 && (
              <View style={styles.prepTimeBadge}>
                <MaterialCommunityIcons
                  name="timer-outline"
                  size={14}
                  color={theme.colors.onSurfaceVariant}
                />
                <Text style={styles.metaText}>{item.recipe.prepTimeMinutes} min</Text>
              </View>
            )}

            {Boolean(formattedDate) && (
              <View style={styles.dateBadge}>
                <MaterialCommunityIcons
                  name="bookmark-check"
                  size={14}
                  color={theme.colors.primary}
                />
                <Text style={styles.dateText}>Salva em {formattedDate}</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.removeBtn}
            onPress={handleRemovePress}
            disabled={isRemoving}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Remover ${item.recipe.title} dos salvos`}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {isRemoving ? (
              <ActivityIndicator size="small" color={theme.colors.error} />
            ) : (
              <>
                <MaterialCommunityIcons
                  name="bookmark-remove-outline"
                  size={18}
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
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
      alignItems: 'center',
    },
    tagBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: theme.rounded.full,
      borderWidth: 1,
    },
    tagText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 10,
      fontWeight: '600',
    },
    tagMoreText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 10,
      color: theme.colors.placeholder,
    },
    footerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 2,
    },
    metaContainer: {
      flexDirection: 'column',
      gap: 4,
    },
    prepTimeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    metaText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
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
