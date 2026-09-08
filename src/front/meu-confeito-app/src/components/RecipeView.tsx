import { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Image } from 'expo-image';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useThemeMode } from '../contexts/ThemeContext';
import { AppTheme } from '../theme/themes';
import { PartialTag } from '../types';

interface TagData {
  tag: PartialTag;
}

interface RecipeViewProps {
  title: string;
  coverUrl: string | null;
  tags?: TagData[];
  prepTimeMinutes?: number;
  onPress: () => void;
}

export const RecipeView = ({
  title,
  coverUrl,
  tags = [],
  prepTimeMinutes = 0,
  onPress,
}: RecipeViewProps) => {
  const { theme } = useThemeMode();
  const [hasImageError, setHasImageError] = useState(false);

  const styles = useMemo(() => createStyles(theme), [theme]);

  const styledTags = useMemo(() => {
    if (!Array.isArray(tags)) return [];
    return tags.map((item) => {
      const tagType = (item?.tag?.type || '').toLowerCase();
      let backgroundColor: string = theme.colors.chips.secondary.background;
      let textColor: string = theme.colors.chips.secondary.text;

      if (tagType === 'product') {
        backgroundColor = theme.colors.chips.primary.background;
        textColor = theme.colors.chips.primary.text;
      } else if (tagType === 'variety') {
        backgroundColor = theme.colors.chips.accent.background;
        textColor = theme.colors.chips.accent.text;
      } else if (tagType === 'attribute') {
        backgroundColor = theme.colors.chips.secondary.background;
        textColor = theme.colors.chips.secondary.text;
      }

      return {
        ...item,
        backgroundColor,
        textColor,
      };
    });
  }, [tags, theme]);

  const hasValidCover = Boolean(coverUrl && coverUrl.trim().length > 0 && !hasImageError);

  return (
    <TouchableOpacity
      style={styles.container}
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
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>

        {styledTags.length > 0 && (
          <View style={styles.tagsContainer}>
            {styledTags.map((item) => (
              <View
                key={item?.tag?.id || item?.tag?.name}
                style={[styles.tagBadge, { backgroundColor: item.backgroundColor }]}
              >
                <Text style={[styles.tagText, { color: item.textColor }]}>{item?.tag?.name}</Text>
              </View>
            ))}
          </View>
        )}

        {prepTimeMinutes > 0 && (
          <View style={styles.timeBadge}>
            <MaterialCommunityIcons
              name="timer-outline"
              size={16}
              color={theme.colors.onSurfaceVariant}
            />
            <Text style={styles.timeText}>{prepTimeMinutes} min</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (theme: AppTheme) =>
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
      padding: theme.spacing.space4,
    },
    title: {
      fontSize: 19,
      lineHeight: 25,
      fontWeight: '600',
      fontFamily: theme.typography.headlineMd.fontFamily,
      color: theme.colors.espressoDark,
      marginBottom: theme.spacing.space2,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    tagBadge: {
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: theme.rounded.full,
    },
    tagText: {
      fontSize: 12,
      fontFamily: theme.typography.labelSm.fontFamily,
      fontWeight: '600',
    },
    timeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      marginTop: theme.spacing.space2,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: theme.rounded.full,
      gap: 5,
    },
    timeText: {
      fontSize: 12,
      fontFamily: theme.typography.labelSm.fontFamily,
      fontWeight: '600',
      color: theme.colors.espressoDark,
    },
  });
