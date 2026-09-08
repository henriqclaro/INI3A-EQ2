import { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Image } from 'expo-image';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useThemeMode } from '../contexts/ThemeContext';
import { AppTheme } from '../theme/themes';
import { UserSavedRecipeItem } from '../types/saved-recipe';

interface SavedRecipeCardProps {
  item: UserSavedRecipeItem;
  onPress: () => void;
  onRemove: () => void;
  isRemoving?: boolean;
}

export const SavedRecipeCard = ({
  item,
  onPress,
  onRemove,
  isRemoving = false,
}: SavedRecipeCardProps) => {
  const { theme } = useThemeMode();
  const [hasImageError, setHasImageError] = useState(false);

  const styles = useMemo(() => createStyles(theme), [theme]);

  const hasValidCover = Boolean(
    item.recipe.coverUrl && item.recipe.coverUrl.trim().length > 0 && !hasImageError,
  );

  const formattedDate = useMemo(() => {
    try {
      const date = new Date(item.savedAt);
      return isNaN(date.getTime())
        ? ''
        : date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          });
    } catch {
      return '';
    }
  }, [item.savedAt]);

  const styledTags = useMemo(() => {
    if (!Array.isArray(item.recipe.tags)) return [];
    return item.recipe.tags.map((t) => {
      const tagType = (t?.tag?.type || '').toLowerCase();
      const backgroundColor =
        theme.colors.tags[tagType as keyof typeof theme.colors.tags] || theme.colors.secondary;
      return {
        ...t,
        backgroundColor,
      };
    });
  }, [item.recipe.tags, theme]);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`Receita salva: ${item.recipe.title}`}
    >
      <View style={styles.imageWrapper}>
        {hasValidCover ? (
          <Image
            source={{ uri: item.recipe.coverUrl! }}
            style={styles.image}
            contentFit="cover"
            onError={() => setHasImageError(true)}
          />
        ) : (
          <View style={styles.placeholder}>
            <MaterialCommunityIcons
              name="cake-variant-outline"
              size={32}
              color={theme.colors.primary}
            />
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={2}>
            {item.recipe.title}
          </Text>
        </View>

        {styledTags.length > 0 && (
          <View style={styles.tagsContainer}>
            {styledTags.slice(0, 3).map((tagObj) => (
              <View
                key={tagObj?.tag?.id || tagObj?.tag?.name}
                style={[styles.tagBadge, { backgroundColor: tagObj.backgroundColor }]}
              >
                <Text style={styles.tagText}>{tagObj?.tag?.name}</Text>
              </View>
            ))}
            {styledTags.length > 3 && (
              <Text style={styles.tagMoreText}>+{styledTags.length - 3}</Text>
            )}
          </View>
        )}

        <View style={styles.footerRow}>
          <View style={styles.metaContainer}>
            {item.recipe.prepTimeMinutes > 0 && (
              <View style={styles.prepTimeBadge}>
                <MaterialCommunityIcons name="timer-outline" size={14} color={theme.colors.text} />
                <Text style={styles.metaText}>{item.recipe.prepTimeMinutes} min</Text>
              </View>
            )}

            {Boolean(formattedDate) && (
              <View style={styles.dateBadge}>
                <MaterialCommunityIcons
                  name="bookmark-check"
                  size={14}
                  color={theme.colors.primary}
                />
                <Text style={styles.dateText}>Salva em {formattedDate}</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.removeBtn}
            onPress={onRemove}
            disabled={isRemoving}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Remover ${item.recipe.title} dos salvos`}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {isRemoving ? (
              <ActivityIndicator size="small" color={theme.colors.danger} />
            ) : (
              <>
                <MaterialCommunityIcons
                  name="bookmark-remove-outline"
                  size={18}
                  color={theme.colors.danger}
                />
                <Text style={styles.removeBtnText}>Remover</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      backgroundColor: theme.colors.pitchBackground,
      borderWidth: 1,
      borderColor: theme.colors.secBorder,
      borderRadius: 14,
      padding: 12,
      gap: 12,
      alignItems: 'center',
    },
    imageWrapper: {
      width: 90,
      height: 90,
      borderRadius: 10,
      overflow: 'hidden',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    placeholder: {
      width: '100%',
      height: '100%',
      backgroundColor: theme.colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.secBorder,
      borderRadius: 10,
    },
    content: {
      flex: 1,
      justifyContent: 'space-between',
      gap: 6,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    title: {
      fontFamily: 'Playfair Display SC',
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
      flex: 1,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
      alignItems: 'center',
    },
    tagBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    tagText: {
      fontFamily: 'Inter',
      fontSize: 10,
      fontWeight: '600',
      color: theme.colors.text,
    },
    tagMoreText: {
      fontFamily: 'Inter',
      fontSize: 10,
      color: theme.colors.placeholder,
    },
    footerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 2,
    },
    metaContainer: {
      flexDirection: 'column',
      gap: 4,
    },
    prepTimeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    metaText: {
      fontFamily: 'Inter',
      fontSize: 12,
      color: theme.colors.text,
      opacity: 0.85,
    },
    dateBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    dateText: {
      fontFamily: 'Inter',
      fontSize: 11,
      color: theme.colors.placeholder,
    },
    removeBtn: {
      minHeight: 48,
      minWidth: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 8,
      gap: 4,
      borderWidth: 1,
      borderColor: theme.colors.secBorder,
      borderRadius: 8,
      backgroundColor: theme.colors.background,
    },
    removeBtnText: {
      fontFamily: 'Inter',
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.danger,
    },
  });
