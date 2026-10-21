import { memo, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { router } from 'expo-router';

import { MaterialSymbol } from '@/src/components/common';
import { UserAvatar } from '@/src/components/common/UserAvatar';
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

  const displayName = baker.publicName?.trim() || baker.name;
  const hasCustomPublicName = Boolean(
    baker.publicName?.trim() && baker.publicName.trim() !== baker.name,
  );

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`Confeitaria ${displayName}${formattedDistance ? `, a ${formattedDistance}` : ''}`}
    >
      <UserAvatar
        url={baker.pfpUrl}
        updatedAt={baker.updatedAt}
        name={displayName}
        size={52}
        fallbackType="icon"
        fallbackIcon="cake"
        fallbackIconColor={theme.colors.primary}
        fallbackBackgroundColor={theme.colors.surfaceContainerLow}
        borderColor={theme.colors.outlineVariant}
        borderWidth={1}
      />

      <View style={styles.infoCol}>
        <View style={styles.headerRow}>
          <Text style={styles.bakerName} numberOfLines={1}>
            {displayName}
          </Text>
          {formattedDistance ? (
            <View style={styles.distanceBadge}>
              <MaterialSymbol name="near_me" size={12} color={theme.colors.chips.success.text} />
              <Text style={styles.distanceText}>{formattedDistance}</Text>
            </View>
          ) : null}
        </View>

        {hasCustomPublicName ? (
          <Text style={styles.accountSubtext} numberOfLines={1}>
            Por {baker.name}
          </Text>
        ) : null}

        <View style={styles.locationRow}>
          <MaterialSymbol name="place" size={14} color={theme.colors.onSurfaceVariant} />
          <Text style={styles.locationText} numberOfLines={1}>
            {locationText}
          </Text>
        </View>
      </View>

      <View style={styles.arrowCol}>
        <MaterialSymbol name="chevron_right" size={22} color={theme.colors.placeholder} />
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
    accountSubtext: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginTop: -2,
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
