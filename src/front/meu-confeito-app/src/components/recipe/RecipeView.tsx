import { memo, useMemo, useState } from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

import { Image } from 'expo-image';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';
import { PartialTag } from '@/src/types';
import { getTagColors } from '@/src/utils/tag';

interface TagData {
  tag: PartialTag;
}

interface RecipeViewProps {
  title: string;
  coverUrl: string | null;
  tags?: TagData[];
  prepTimeMinutes?: number;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  maxTagRows?: 1 | 2;
  isCustomized?: boolean;
  hasParent?: boolean;
}

export const RecipeView = memo(function RecipeView({
  title,
  coverUrl,
  tags = [],
  prepTimeMinutes = 0,
  onPress,
  style,
  maxTagRows = 1,
  isCustomized = false,
  hasParent = false,
}: RecipeViewProps) {
  const { theme } = useThemeMode();
  const [hasImageError, setHasImageError] = useState(false);

  const styles = useMemo(() => createStyles(theme, maxTagRows), [theme, maxTagRows]);

  const styledTags = useMemo(() => {
    if (!Array.isArray(tags)) return [];
    return tags.map((item) => {
      const tagColors = getTagColors(item?.tag?.type, theme);
      return {
        ...item,
        backgroundColor: tagColors.backgroundColor,
        textColor: tagColors.textColor,
        borderColor: tagColors.borderColor,
      };
    });
  }, [tags, theme]);

  const hasValidCover = Boolean(coverUrl && coverUrl.trim().length > 0 && !hasImageError);
  const maxTags = maxTagRows === 2 ? 4 : 2;
  const visibleTags = styledTags.slice(0, maxTags);
  const remainingTagsCount = styledTags.length - maxTags;

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`Receita: ${title}`}
    >
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
          <View style={styles.placeholderIconBadge}>
            <MaterialCommunityIcons
              name="cake-variant-outline"
              size={36}
              color={theme.colors.primary}
            />
          </View>
          <Text style={styles.placeholderText}>Sem foto de capa</Text>
        </View>
      )}

      <View style={styles.infoContainer}>
        {(isCustomized || hasParent) && (
          <View style={styles.customizedBadge}>
            <MaterialCommunityIcons name="source-fork" size={12} color={theme.colors.secondary} />
            <Text style={styles.customizedBadgeText}>Adaptada</Text>
          </View>
        )}
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>

        <View style={styles.footerInfo}>
          <View style={styles.tagsContainer}>
            {styledTags.length > 0 ? (
              <>
                {visibleTags.map((item) => (
                  <View
                    key={item?.tag?.id || item?.tag?.name}
                    style={[
                      styles.tagBadge,
                      {
                        backgroundColor: item.backgroundColor,
                        borderColor: item.borderColor,
                      },
                    ]}
                  >
                    <Text style={[styles.tagText, { color: item.textColor }]} numberOfLines={1}>
                      {item?.tag?.name}
                    </Text>
                  </View>
                ))}
                {remainingTagsCount > 0 && (
                  <View style={styles.tagMoreBadge}>
                    <Text style={styles.tagMoreText}>+{remainingTagsCount}</Text>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.tagPlaceholder} />
            )}
          </View>

          {prepTimeMinutes > 0 ? (
            <View style={styles.timeBadge}>
              <MaterialCommunityIcons
                name="timer-outline"
                size={16}
                color={theme.colors.onSurfaceVariant}
              />
              <Text style={styles.timeText}>{prepTimeMinutes} min</Text>
            </View>
          ) : (
            <View style={[styles.timeBadge, styles.timeBadgePlaceholder]} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

const createStyles = (theme: AppTheme, maxTagRows: 1 | 2) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.rounded.lg,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      width: '100%',
      overflow: 'hidden',
      ...theme.shadows.soft,
    },
    image: {
      width: '100%',
      aspectRatio: 16 / 9,
    },
    placeholder: {
      backgroundColor: theme.colors.surfaceContainerLow,
      alignItems: 'center',
      justifyContent: 'center',
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
      gap: 6,
    },
    placeholderIconBadge: {
      width: 56,
      height: 56,
      borderRadius: theme.rounded.full,
      backgroundColor: theme.colors.surfaceContainer,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    placeholderText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      fontWeight: '500',
      color: theme.colors.onSurfaceVariant,
    },
    infoContainer: {
      paddingHorizontal: theme.spacing.space4,
      paddingTop: theme.spacing.space3,
      paddingBottom: theme.spacing.space4,
      flexGrow: 1,
      justifyContent: 'space-between',
    },
    customizedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: theme.colors.surfaceContainerHigh,
      borderColor: theme.colors.outlineVariant,
      borderWidth: 1,
      borderRadius: theme.rounded.full,
      paddingVertical: 2,
      paddingHorizontal: 8,
      gap: 4,
      marginBottom: 6,
    },
    customizedBadgeText: {
      fontSize: 11,
      fontFamily: theme.typography.labelSm.fontFamily,
      fontWeight: '600',
      color: theme.colors.secondary,
    },
    title: {
      fontSize: 18,
      lineHeight: 24,
      minHeight: 48,
      fontWeight: '600',
      fontFamily: theme.typography.headlineMd.fontFamily,
      color: theme.colors.espressoDark,
      marginBottom: theme.spacing.space2,
    },
    footerInfo: {
      gap: 10,
      justifyContent: 'flex-end',
      paddingBottom: 2,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 6,
      minHeight: maxTagRows === 2 ? 56 : 26,
    },
    tagBadge: {
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius: theme.rounded.full,
      borderWidth: 1,
      maxWidth: 130,
    },
    tagText: {
      fontSize: 11,
      fontFamily: theme.typography.labelSm.fontFamily,
      fontWeight: '600',
    },
    tagMoreBadge: {
      paddingVertical: 3,
      paddingHorizontal: 6,
      borderRadius: theme.rounded.full,
      backgroundColor: theme.colors.surfaceContainerHigh,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    tagMoreText: {
      fontSize: 11,
      fontFamily: theme.typography.labelSm.fontFamily,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
    },
    tagPlaceholder: {
      height: maxTagRows === 2 ? 56 : 26,
    },
    timeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: theme.rounded.full,
      gap: 5,
      minHeight: 28,
    },
    timeBadgePlaceholder: {
      opacity: 0,
      borderWidth: 0,
      minHeight: 28,
    },
    timeText: {
      fontSize: 12,
      fontFamily: theme.typography.labelSm.fontFamily,
      fontWeight: '600',
      color: theme.colors.espressoDark,
    },
  });
