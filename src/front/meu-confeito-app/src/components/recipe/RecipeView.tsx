import { memo, useEffect, useMemo, useState } from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

import { Image } from 'expo-image';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';
import { PartialTag, RecipeStatus } from '@/src/types';
import { getStorageUrl } from '@/src/utils/image';
import { getTagColors } from '@/src/utils/tag';

interface TagData {
  tag: PartialTag;
}

interface RecipeViewProps {
  title: string;
  coverUrl: string | null;
  updatedAt?: string | Date | null;
  tags?: TagData[];
  prepTimeMinutes?: number;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  maxTagRows?: 1 | 2;
  isCustomized?: boolean;
  hasParent?: boolean;
  rating?: number | string | null;
  totalReviews?: number;
  status?: RecipeStatus | string;
  isDownloaded?: boolean;
}

export const RecipeView = memo(function RecipeView({
  title,
  coverUrl,
  updatedAt,
  tags = [],
  prepTimeMinutes = 0,
  onPress,
  style,
  maxTagRows = 1,
  isCustomized = false,
  hasParent = false,
  rating,
  totalReviews,
  status,
  isDownloaded = false,
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

  const formattedRating = useMemo(() => {
    if (rating === undefined || rating === null) return null;
    const num = typeof rating === 'number' ? rating : parseFloat(String(rating));
    if (isNaN(num)) return null;
    return num > 0 ? num.toFixed(1) : '0.0';
  }, [rating]);

  const totalReviewsCount = typeof totalReviews === 'number' ? totalReviews : 0;
  const resolvedCoverUrl = useMemo(() => getStorageUrl(coverUrl, updatedAt), [coverUrl, updatedAt]);

  useEffect(() => {
    setHasImageError(false);
  }, [resolvedCoverUrl]);

  const hasValidCover = Boolean(resolvedCoverUrl && !hasImageError);
  const maxTags = maxTagRows === 2 ? 4 : 2;
  const visibleTags = styledTags.slice(0, maxTags);
  const remainingTagsCount = styledTags.length - maxTags;
  const hasTopBadges =
    isCustomized ||
    hasParent ||
    status === 'DRAFT' ||
    status === 'ARCHIVED' ||
    status === 'SUSPENDED' ||
    isDownloaded;

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
          source={{ uri: resolvedCoverUrl }}
          style={styles.image}
          contentFit="cover"
          cachePolicy="memory-disk"
          recyclingKey={resolvedCoverUrl}
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
        {hasTopBadges && (
          <View style={styles.topBadgesRow}>
            {isDownloaded && (
              <View style={styles.downloadedBadge}>
                <MaterialCommunityIcons
                  name="cloud-check-outline"
                  size={12}
                  color={theme.colors.primary}
                />
                <Text style={styles.downloadedBadgeText}>Baixada</Text>
              </View>
            )}
            {(isCustomized || hasParent) && (
              <View style={styles.customizedBadge}>
                <MaterialCommunityIcons
                  name="source-fork"
                  size={12}
                  color={theme.colors.secondary}
                />
                <Text style={styles.customizedBadgeText}>Adaptada</Text>
              </View>
            )}
            {status === 'DRAFT' && (
              <View style={styles.draftBadge}>
                <MaterialCommunityIcons
                  name="file-document-edit-outline"
                  size={12}
                  color={theme.colors.onSurfaceVariant}
                />
                <Text style={styles.draftBadgeText}>Rascunho</Text>
              </View>
            )}
            {status === 'ARCHIVED' && (
              <View style={styles.archivedBadge}>
                <MaterialCommunityIcons
                  name="archive-outline"
                  size={12}
                  color={theme.colors.onSurfaceVariant}
                />
                <Text style={styles.archivedBadgeText}>Arquivada</Text>
              </View>
            )}
            {status === 'SUSPENDED' && (
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

          <View style={styles.metaRow}>
            {prepTimeMinutes > 0 ? (
              <View style={styles.timeBadge}>
                <MaterialCommunityIcons
                  name="timer-outline"
                  size={15}
                  color={theme.colors.onSurfaceVariant}
                />
                <Text style={styles.timeText}>{prepTimeMinutes} min</Text>
              </View>
            ) : (
              <View />
            )}

            {formattedRating !== null ? (
              <View style={styles.ratingSection}>
                <View style={styles.ratingBadge}>
                  <MaterialCommunityIcons name="star" size={13} color="#D97706" />
                  <Text style={styles.ratingText}>{formattedRating}</Text>
                </View>
                <Text style={styles.reviewsLabel}>
                  {totalReviewsCount} {totalReviewsCount === 1 ? 'avaliação' : 'avaliações'}
                </Text>
              </View>
            ) : null}
          </View>
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
    topBadgesRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 6,
    },
    downloadedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: theme.colors.surfaceContainerLow,
      borderColor: theme.colors.outlineVariant,
      borderWidth: 1,
      borderRadius: theme.rounded.full,
      paddingVertical: 2,
      paddingHorizontal: 8,
      gap: 4,
    },
    downloadedBadgeText: {
      fontSize: 11,
      fontFamily: theme.typography.labelSm.fontFamily,
      fontWeight: '600',
      color: theme.colors.primary,
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
    },
    customizedBadgeText: {
      fontSize: 11,
      fontFamily: theme.typography.labelSm.fontFamily,
      fontWeight: '600',
      color: theme.colors.secondary,
    },
    draftBadge: {
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
    },
    draftBadgeText: {
      fontSize: 11,
      fontFamily: theme.typography.labelSm.fontFamily,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
    },
    archivedBadge: {
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
    },
    archivedBadgeText: {
      fontSize: 11,
      fontFamily: theme.typography.labelSm.fontFamily,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
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
      paddingHorizontal: 8,
      gap: 4,
    },
    suspendedBadgeText: {
      fontSize: 11,
      fontFamily: theme.typography.labelSm.fontFamily,
      fontWeight: '700',
      color: theme.colors.error,
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
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 8,
      minHeight: 28,
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
    ratingSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    ratingBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: theme.rounded.full,
      gap: 4,
      minHeight: 28,
    },
    ratingText: {
      fontSize: 12,
      fontFamily: theme.typography.labelSm.fontFamily,
      fontWeight: '700',
      color: theme.colors.espressoDark,
    },
    reviewsLabel: {
      fontSize: 11,
      fontFamily: theme.typography.bodySm.fontFamily,
      color: theme.colors.onSurfaceVariant,
    },
  });
