import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Image } from 'expo-image';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useThemeMode } from '../contexts/ThemeContext';
import { AppTheme } from '../theme/themes';

interface RecipeSmallViewProps {
  title: string;
  coverUrl: string | null;
  prepTimeMinutes: number;
  onPress: () => void;
}

export const RecipeSmallView = ({
  title,
  coverUrl,
  prepTimeMinutes,
  onPress,
}: RecipeSmallViewProps) => {
  const { theme } = useThemeMode();

  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      {coverUrl ? (
        <Image source={{ uri: coverUrl }} style={styles.image} contentFit="cover" />
      ) : (
        <View style={[styles.image, styles.placeholder]} />
      )}

      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>

      {prepTimeMinutes > 0 ? (
        <View style={styles.timeBadge}>
          <MaterialCommunityIcons name="timer-check-outline" size={24} />
          <Text>{prepTimeMinutes}min</Text>
        </View>
      ) : (
        ''
      )}
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
    timeBadge: {
      backgroundColor: theme.colors.lightGray,
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 12,
      paddingVertical: 4,
      paddingHorizontal: 12,
      borderRadius: 20,
      gap: 3,
    },
  });
