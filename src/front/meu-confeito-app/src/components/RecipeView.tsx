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
      const backgroundColor =
        theme.colors.tags[tagType as keyof typeof theme.colors.tags] || theme.colors.secondary;

      return {
        ...item,
        backgroundColor,
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
                <Text style={styles.tagText}>{item?.tag?.name}</Text>
              </View>
            ))}
          </View>
        )}

        {prepTimeMinutes > 0 && (
          <View style={styles.timeBadge}>
            <MaterialCommunityIcons name="timer-outline" size={16} color={theme.colors.text} />
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
      backgroundColor: theme.colors.pitchBackground,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.secBorder,
      width: '100%',
      overflow: 'hidden',
    },
    image: {
      width: '100%',
      aspectRatio: 16 / 9,
    },
    placeholder: {
      backgroundColor: theme.colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.secBorder,
      gap: 6,
    },
    placeholderIconBadge: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.colors.secondary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    placeholderText: {
      fontFamily: 'Inter',
      fontSize: 12,
      fontWeight: '500',
      color: theme.colors.text,
      opacity: 0.7,
    },
    infoContainer: {
      padding: 16,
    },
    title: {
      fontSize: 19,
      lineHeight: 25,
      fontWeight: 'bold',
      fontFamily: 'Playfair Display SC',
      color: theme.colors.text,
      marginBottom: 10,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    tagBadge: {
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 9999,
    },
    tagText: {
      fontSize: 12,
      color: theme.colors.text,
      fontWeight: 'bold',
    },
    timeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      marginTop: 10,
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 9999,
      gap: 5,
    },
    timeText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.text,
    },
  });
