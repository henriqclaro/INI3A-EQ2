import { useMemo, useState } from 'react';
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
  const [hasImageError, setHasImageError] = useState(false);

  const styles = useMemo(() => createStyles(theme), [theme]);

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
          <MaterialCommunityIcons
            name="cake-variant-outline"
            size={28}
            color={theme.colors.primary}
          />
        </View>
      )}

      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>

      {prepTimeMinutes > 0 ? (
        <View style={styles.timeBadge}>
          <MaterialCommunityIcons name="timer-outline" size={16} color={theme.colors.text} />
          <Text style={styles.timeText}>{prepTimeMinutes} min</Text>
        </View>
      ) : null}
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
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
    },
    image: {
      width: 72,
      height: 72,
      borderRadius: 12,
      marginRight: 14,
    },
    placeholder: {
      backgroundColor: theme.colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    title: {
      flex: 1,
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      fontFamily: 'Inter',
    },
    timeBadge: {
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 10,
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 9999,
      gap: 4,
    },
    timeText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.text,
    },
  });
