import { useMemo } from 'react';
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

  const hasValidCover = Boolean(coverUrl && coverUrl.trim().length > 0);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.85}>
      {hasValidCover ? (
        <Image source={{ uri: coverUrl! }} style={styles.image} contentFit="cover" />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <MaterialCommunityIcons name="cupcake" size={44} color={theme.colors.placeholder} />
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
            <MaterialCommunityIcons name="timer-outline" size={18} color={theme.colors.text} />
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
      borderWidth: 0,
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
    },
    infoContainer: {
      padding: 16,
    },
    title: {
      fontSize: 20,
      lineHeight: 26,
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
      paddingHorizontal: 12,
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
