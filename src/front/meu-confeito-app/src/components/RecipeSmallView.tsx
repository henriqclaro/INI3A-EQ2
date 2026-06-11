import { useMemo } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useThemeMode } from '../contexts/ThemeContext';
import { AppTheme } from '../theme/themes';

interface RecipeSmallViewProps {
  title: string;
  coverUrl: string | null;
  onPress: () => void;
}

export const RecipeSmallView = ({ title, coverUrl, onPress }: RecipeSmallViewProps) => {
  const { theme } = useThemeMode();

  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      {coverUrl ? (
        <Image source={{ uri: coverUrl }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.image, styles.placeholder]} />
      )}

      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.pitchBackground,
      borderRadius: 16,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
    },
    image: {
      width: 80,
      height: 80,
      borderRadius: 16,
      marginRight: 16,
    },
    placeholder: {
      backgroundColor: theme.colors.placeholder,
    },
    title: {
      flex: 1,
      fontSize: 18,
      fontWeight: '400',
      color: theme.colors.text,
    },
  });
