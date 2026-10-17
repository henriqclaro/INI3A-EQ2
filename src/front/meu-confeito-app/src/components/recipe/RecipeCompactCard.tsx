import { memo, useEffect, useMemo, useState } from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

import { Image } from 'expo-image';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';
import { RecipeStatus } from '@/src/types/recipe';
import { getStorageUrl } from '@/src/utils/image';

export interface RecipeCompactCardProps {
  title: string;
  coverUrl?: string | null;
  updatedAt?: string | Date | null;
  status?: RecipeStatus | string;
  rating?: number | string | null;
  isRatingVisible?: boolean;
  onPress?: () => void;
  isExpandable?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export const RecipeCompactCard = memo(function RecipeCompactCard({
  title,
  coverUrl,
  updatedAt,
  status,
  rating,
  isRatingVisible = false,
  onPress,
  isExpandable = false,
  isExpanded = false,
  onToggleExpand,
  actions,
  children,
  style,
  accessibilityLabel,
}: RecipeCompactCardProps) {
  const { theme } = useThemeMode();
  const [hasImageError, setHasImageError] = useState(false);

  const styles = useMemo(() => createStyles(theme), [theme]);

  const resolvedCoverUrl = useMemo(() => getStorageUrl(coverUrl, updatedAt), [coverUrl, updatedAt]);

  useEffect(() => {
    setHasImageError(false);
  }, [resolvedCoverUrl]);

  const hasValidCover = Boolean(
    resolvedCoverUrl && resolvedCoverUrl.trim().length > 0 && !hasImageError,
  );

  const formattedRating = useMemo(() => {
    if (!isRatingVisible || rating === undefined || rating === null) return null;
    const num = typeof rating === 'number' ? rating : parseFloat(String(rating));
    if (isNaN(num)) return null;
    return num > 0 ? num.toFixed(1) : '0.0';
  }, [isRatingVisible, rating]);

  const statusBadgeInfo = useMemo(() => {
    if (!status) return null;
    switch (status) {
      case 'SUSPENDED':
        return {
          label: 'Suspensa',
          icon: 'alert-octagon-outline' as const,
          color: theme.colors.onErrorContainer,
          bgColor: theme.colors.errorContainer,
          borderColor: theme.colors.error,
        };
      case 'PUBLISHED':
        return {
          label: 'Pública',
          icon: 'earth' as const,
          color: theme.colors.onSecondaryContainer,
          bgColor: theme.colors.secondaryContainer,
          borderColor: theme.colors.outlineVariant,
        };
      case 'ARCHIVED':
        return {
          label: 'Arquivada',
          icon: 'archive-outline' as const,
          color: theme.colors.onSurfaceVariant,
          bgColor: theme.colors.surfaceContainerHigh,
          borderColor: theme.colors.outlineVariant,
        };
      case 'DRAFT':
      default:
        return {
          label: 'Rascunho',
          icon: 'file-document-edit-outline' as const,
          color: theme.colors.onSurfaceVariant,
          bgColor: theme.colors.surfaceContainerLow,
          borderColor: theme.colors.outlineVariant,
        };
    }
  }, [status, theme]);

  const headerContent = (
    <>
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
          <MaterialCommunityIcons
            name="cake-variant-outline"
            size={24}
            color={theme.colors.primary}
          />
        </View>
      )}

      <View style={styles.infoCol}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>

        <View style={styles.badgesRow}>
          {statusBadgeInfo && (
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: statusBadgeInfo.bgColor,
                  borderColor: statusBadgeInfo.borderColor,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={statusBadgeInfo.icon}
                size={12}
                color={statusBadgeInfo.color}
              />
              <Text style={[styles.badgeText, { color: statusBadgeInfo.color }]}>
                {statusBadgeInfo.label}
              </Text>
            </View>
          )}

          {formattedRating !== null && (
            <View style={styles.ratingBadge}>
              <MaterialCommunityIcons name="star" size={13} color="#D97706" />
              <Text style={styles.ratingText}>{formattedRating}</Text>
            </View>
          )}
        </View>
      </View>

      {isExpandable ? (
        <MaterialCommunityIcons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={24}
          color={theme.colors.onSurfaceVariant}
          style={styles.chevron}
        />
      ) : onPress ? (
        <MaterialCommunityIcons
          name="chevron-right"
          size={20}
          color={theme.colors.outline}
          style={styles.chevron}
        />
      ) : null}
    </>
  );

  return (
    <View style={[styles.container, style]}>
      {isExpandable ? (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={onToggleExpand}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel || `Receita: ${title}`}
        >
          {headerContent}
        </TouchableOpacity>
      ) : onPress ? (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={onPress}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel || `Receita: ${title}`}
        >
          {headerContent}
        </TouchableOpacity>
      ) : (
        <View
          style={styles.headerButton}
          accessibilityRole="text"
          accessibilityLabel={accessibilityLabel || `Receita: ${title}`}
        >
          {headerContent}
        </View>
      )}

      {isExpandable && isExpanded && (
        <View style={styles.expandedContent}>
          {children}
          {actions}
        </View>
      )}
    </View>
  );
});

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.rounded.md,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      overflow: 'hidden',
      width: '100%',
      ...theme.shadows.soft,
    },
    headerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      minHeight: 64,
      gap: 12,
      width: '100%',
    },
    image: {
      width: 56,
      height: 56,
      borderRadius: theme.rounded.sm,
    },
    placeholder: {
      backgroundColor: theme.colors.surfaceContainerLow,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    infoCol: {
      flex: 1,
      justifyContent: 'center',
      gap: 4,
    },
    title: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.espressoDark,
      lineHeight: 20,
    },
    badgesRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 6,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: theme.rounded.sm,
      borderWidth: 1,
    },
    badgeText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      fontWeight: '600',
    },
    ratingBadge: {
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 2,
      paddingHorizontal: 6,
      borderRadius: theme.rounded.sm,
      gap: 3,
    },
    ratingText: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.espressoDark,
      fontFamily: theme.typography.labelSm.fontFamily,
    },
    chevron: {
      marginLeft: 4,
    },
    expandedContent: {
      backgroundColor: theme.colors.surfaceContainerLow,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
      padding: 14,
      gap: 12,
    },
  });
