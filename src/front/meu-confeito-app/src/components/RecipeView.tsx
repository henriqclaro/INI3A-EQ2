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
  tags: TagData[];
  prepTimeMinutes: number;
  onPress: () => void;
}

export const RecipeView = ({
  title,
  coverUrl,
  tags,
  prepTimeMinutes,
  onPress,
}: RecipeViewProps) => {
  const { theme } = useThemeMode();

  const styles = useMemo(() => createStyles(theme), [theme]);

  const styledTags = useMemo(() => {
    return tags.map((item) => {
      const tagType = item.tag.type;
      const backgroundColor =
        theme.colors.tags[tagType.toLocaleLowerCase() as keyof typeof theme.colors.tags];

      return {
        ...item,
        backgroundColor,
      };
    });
  }, [tags, theme]);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      {coverUrl ? (
        <Image source={{ uri: coverUrl }} style={styles.image} contentFit="cover" />
      ) : (
        <View style={[styles.image, styles.placeholder]} />
      )}

      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={3}>
          {title}
        </Text>

        <View style={styles.tagsContainer}>
          {styledTags.map((item) => (
            <View
              key={item.tag.id}
              style={[styles.tagBadge, { backgroundColor: item.backgroundColor }]}
            >
              <Text style={styles.tagText}>{item.tag.name}</Text>
            </View>
          ))}
        </View>

        {prepTimeMinutes > 0 && (
          <View style={styles.timeBadge}>
            <MaterialCommunityIcons 
              name="timer-check-outline" 
              size={20} 
              color={theme.colors.text} 
            />
            <Text >{prepTimeMinutes}min</Text>
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
      borderRadius: 12,
      width: '100%',
      overflow: 'hidden',
    },
    image: {
      width: '100%',
      height: 220,
    },
    placeholder: {
      backgroundColor: theme.colors.placeholder,
    },
    infoContainer: {
      flexDirection: 'column',

      padding: 16,
    },
    title: {
      fontSize: 22,
      lineHeight: 28,
      height: 84,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 12,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 7,
    },
    tagBadge: {
      paddingVertical: 6,
      paddingHorizontal: 14,
      borderRadius: 20,
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
      marginTop: 12,
      paddingVertical: 5,
      gap: 4,
    },
  });