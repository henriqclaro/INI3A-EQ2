import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Image } from 'expo-image';

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
  onPress: () => void;
}

export const RecipeView = ({ title, coverUrl, tags, onPress }: RecipeViewProps) => {
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
    <TouchableOpacity style={styles.container} onPress={onPress}>
      {coverUrl ? (
        <Image source={{ uri: coverUrl }} style={styles.image} contentFit="cover" />
      ) : (
        <View style={[styles.image, styles.placeholder]} />
      )}

      <Text style={styles.title}>{title}</Text>

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
    </TouchableOpacity>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.pitchBackground,
      borderRadius: 16,
      padding: 16,
      width: 180,
    },
    image: {
      width: '100%',
      height: 150,
      borderRadius: 24,
      marginBottom: 12,
    },
    placeholder: {
      backgroundColor: theme.colors.placeholder,
    },
    title: {
      fontSize: 22,
      fontWeight: '400',
      color: theme.colors.text,
      marginBottom: 12,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      // justifyContent: 'center',
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
  });
