import { memo, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Image } from 'expo-image';
import { router } from 'expo-router';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';
import { NearbyBakerItem } from '@/src/types/baker-profile';

export interface BakerCardProps {
  baker: NearbyBakerItem;
  onPress?: () => void;
}

export const BakerCard = memo(function BakerCard({ baker, onPress }: BakerCardProps) {
  const { theme } = useThemeMode();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const formattedDistance = useMemo(() => {
    if (baker.distance === undefined || baker.distance === null) return '';
    if (baker.distance < 1000) {
      return `${Math.round(baker.distance)} m`;
    }
    const inKm = baker.distance / 1000;
    return `${inKm.toFixed(1).replace('.', ',')} km`;
  }, [baker.distance]);

  const locationText = useMemo(() => {
    const parts = [baker.neighborhood, baker.city].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Localização não informada';
  }, [baker.city, baker.neighborhood]);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push({
        pathname: '/public-profile',
        params: { id: baker.userId },
      });
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`Confeitaria ${baker.name}, a ${formattedDistance}`}
    >
      <View style={styles.avatarContainer}>
        {baker.pfpUrl ? (
          <Image
            source={{ uri: baker.pfpUrl }}
            alt={baker.name}
            style={styles.avatar}
            contentFit="cover"
            cachePolicy="memory-disk"
            recyclingKey={baker.pfpUrl}
            transition={150}
          />
        ) : (
          <View style={[styles.avatar, styles.placeholderAvatar]}>
            <MaterialCommunityIcons
              name="cake-variant-outline"
              size={26}
              color={theme.colors.primary}
            />
          </View>
        )}
      </View>

      <View style={styles.infoCol}>
        <View style={styles.headerRow}>
          <Text style={styles.bakerName} numberOfLines={1}>
            {baker.name}
          </Text>
          {formattedDistance ? (
            <View style={styles.distanceBadge}>
              <MaterialCommunityIcons
                name="map-marker-distance"
                size={12}
                color={theme.colors.chips.success.text}
              />
              <Text style={styles.distanceText}>{formattedDistance}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.locationRow}>
          <MaterialCommunityIcons
            name="map-marker-outline"
            size={14}
            color={theme.colors.onSurfaceVariant}
          />
          <Text style={styles.locationText} numberOfLines={1}>
            {locationText}
          </Text>
        </View>
      </View>

      <View style={styles.arrowCol}>
        <MaterialCommunityIcons name="chevron-right" size={22} color={theme.colors.placeholder} />
      </View>
    </TouchableOpacity>
  );
});

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.lg,
      padding: theme.spacing.space4,
      minHeight: 76,
      width: '100%',
      gap: theme.spacing.space3,
      ...theme.shadows.soft,
    },
    avatarContainer: {
      width: 52,
      height: 52,
      borderRadius: theme.rounded.full,
      overflow: 'hidden',
    },
    avatar: {
      width: '100%',
      height: '100%',
      borderRadius: theme.rounded.full,
    },
    placeholderAvatar: {
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },
    infoCol: {
      flex: 1,
      gap: 4,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.space2,
    },
    bakerName: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.espressoDark,
      flex: 1,
    },
    distanceBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.chips.success.background,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: theme.rounded.full,
      gap: 4,
    },
    distanceText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.chips.success.text,
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    locationText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      flex: 1,
    },
    arrowCol: {
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 4,
    },
  });
