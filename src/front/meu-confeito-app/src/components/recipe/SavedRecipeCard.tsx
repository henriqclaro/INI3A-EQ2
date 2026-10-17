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

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';
import { UserSavedRecipeItem } from '@/src/types/saved-recipe';
import { getStorageUrl } from '@/src/utils/image';
import { getTagColors } from '@/src/utils/tag';

export interface SavedRecipeCardProps {
  item: UserSavedRecipeItem;
  onPress: () => void;
  onRemove: () => void;
  isRemoving?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const SavedRecipeCard = memo(function SavedRecipeCard({
  item,
  onPress,
  onRemove,
  isRemoving = false,
  style,
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
    <View style={[styles.card, style]}>
      <TouchableOpacity
        style={styles.mainTouchable}
        onPress={onPress}
        activeOpacity={0.85}
        accessibilityRole="button"
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
                size={34}
                color={theme.colors.primary}
              />
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
                <MaterialCommunityIcons
                  name="alert-octagon-outline"
                  size={12}
                  color={theme.colors.error}
                />
                <Text style={styles.suspendedBadgeText}>Suspensa</Text>
              </View>
            )}
          </View>

          {/* Slot 2: Middle / Tags (fixed height: 22) */}
          <View style={styles.tagsContainer}>
            {styledTags.length > 0 ? (
              <>
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
                    <Text style={[styles.tagText, { color: tagObj.textColor }]} numberOfLines={1}>
                      {tagObj?.tag?.name}
                    </Text>
                  </View>
                ))}
                {styledTags.length > 3 && (
                  <Text style={styles.tagMoreText}>+{styledTags.length - 3}</Text>
                )}
              </>
            ) : (
              <View style={styles.emptyTagBadge}>
                <Text style={styles.emptyTagText}>Sem categorias</Text>
              </View>
            )}
          </View>

          {/* Slot 3: Footer / Meta (fixed height: 36) */}
          <View style={styles.footerRow}>
            <View style={styles.metaContainer}>
              {item.recipe.prepTimeMinutes > 0 && (
                <View style={styles.prepTimeBadge}>
                  <MaterialCommunityIcons
                    name="timer-outline"
                    size={13}
                    color={theme.colors.onSurfaceVariant}
                  />
                  <Text style={styles.metaText}>{item.recipe.prepTimeMinutes} min</Text>
                </View>
              )}

              {Boolean(formattedDate) && (
                <View style={styles.dateBadge}>
                  <MaterialCommunityIcons
                    name="bookmark-check"
                    size={13}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.dateText} numberOfLines={1}>
                    Salva em {formattedDate}
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
        accessibilityLabel={`Remover ${item.recipe.title} dos salvos`}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        {isRemoving ? (
          <ActivityIndicator size="small" color={theme.colors.error} />
        ) : (
          <>
            <MaterialCommunityIcons
              name="bookmark-remove-outline"
              size={15}
              color={theme.colors.error}
            />
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
    tagsContainer: {
      height: 22,
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'nowrap',
      gap: 4,
      minWidth: 0,
      overflow: 'hidden',
    },
    tagBadge: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: theme.rounded.full,
      borderWidth: 1,
      maxWidth: 100,
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
    emptyTagBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: theme.rounded.full,
      backgroundColor: theme.colors.surfaceContainerLow,
    },
    emptyTagText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 10,
      color: theme.colors.placeholder,
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
    prepTimeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      minWidth: 0,
    },
    metaText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 10.5,
      color: theme.colors.onSurfaceVariant,
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
