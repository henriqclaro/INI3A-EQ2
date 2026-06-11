import { useMemo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

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
}

export const RecipeView = ({ title, coverUrl, tags }: RecipeViewProps) => {
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
    <View style={styles.container}>
      {coverUrl ? (
        <Image source={{ uri: coverUrl }} style={styles.image} resizeMode="cover" />
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
    </View>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.pitchBackground,
      borderRadius: 16,
      padding: 16,
      width: 260,
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
      gap: 8,
    },
    tagBadge: {
      paddingVertical: 6,
      paddingHorizontal: 14,
      borderRadius: 20,
    },
    tagText: {
      fontSize: 14,
      color: theme.colors.text,
    },
  });
