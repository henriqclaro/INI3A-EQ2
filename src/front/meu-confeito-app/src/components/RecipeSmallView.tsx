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
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.rounded.lg,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: theme.spacing.space3,
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      ...theme.shadows.soft,
    },
    image: {
      width: 72,
      height: 72,
      borderRadius: theme.rounded.md,
      marginRight: theme.spacing.space3,
    },
    placeholder: {
      backgroundColor: theme.colors.surfaceContainerLow,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    title: {
      flex: 1,
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.espressoDark,
      fontFamily: theme.typography.bodyMd.fontFamily,
    },
    timeBadge: {
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: theme.spacing.space2,
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: theme.rounded.full,
      gap: 4,
    },
    timeText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.espressoDark,
      fontFamily: theme.typography.labelSm.fontFamily,
    },
  });
