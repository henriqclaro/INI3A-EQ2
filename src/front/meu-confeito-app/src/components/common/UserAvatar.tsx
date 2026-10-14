import { memo, useEffect, useMemo, useState } from 'react';
import { Platform, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

import { Image, ImageStyle } from 'expo-image';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useThemeMode } from '@/src/contexts/ThemeContext';
import { getStorageUrl } from '@/src/utils/image';

export interface UserAvatarProps {
  url?: string | null;
  updatedAt?: string | Date | number | null;
  name?: string | null;
  size?: number;
  fallbackType?: 'initial' | 'icon';
  fallbackIcon?: keyof typeof MaterialCommunityIcons.glyphMap;
  fallbackIconColor?: string;
  fallbackBackgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  initialTextStyle?: StyleProp<TextStyle>;
  alt?: string;
  accessibilityLabel?: string;
}

export const UserAvatar = memo(function UserAvatar({
  url,
  updatedAt,
  name,
  size = 52,
  fallbackType = 'icon',
  fallbackIcon = 'account',
  fallbackIconColor,
  fallbackBackgroundColor,
  borderColor,
  borderWidth,
  style,
  imageStyle,
  initialTextStyle,
  alt,
  accessibilityLabel,
}: UserAvatarProps) {
  const { theme } = useThemeMode();
  const [hasImageError, setHasImageError] = useState(false);

  const resolvedUrl = useMemo(() => getStorageUrl(url, updatedAt), [url, updatedAt]);
  const hasValidImage = Boolean(resolvedUrl && resolvedUrl.trim().length > 0 && !hasImageError);

  useEffect(() => {
    setHasImageError(false);
  }, [resolvedUrl]);

  const displayName = name?.trim() || '';
  const initialChar = displayName ? displayName.charAt(0).toUpperCase() : 'U';
  const iconSize = Math.round(size * 0.52);

  const borderRadius = size / 2;
  const placeholderBorderWidth = borderWidth ?? 1;
  const placeholderBorder = borderColor || theme.colors.outlineVariant;

  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          width: size,
          height: size,
          borderRadius,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
          ...(borderWidth
            ? {
                borderWidth,
                borderColor: placeholderBorder,
              }
            : {}),
        },
        image: {
          width: size,
          height: size,
          borderRadius,
        },
        initialText: {
          fontFamily: theme.typography.labelMd.fontFamily,
          fontSize: Math.round(size * 0.42),
          fontWeight: '700',
          color: theme.colors.onPrimaryFixed,
        },
        fallbackInitialBg: {
          backgroundColor: fallbackBackgroundColor || theme.colors.primaryFixed,
          borderWidth: placeholderBorderWidth,
          borderColor: placeholderBorder,
        },
        fallbackIconBg: {
          backgroundColor: fallbackBackgroundColor || theme.colors.surfaceContainerLow,
          borderWidth: placeholderBorderWidth,
          borderColor: placeholderBorder,
        },
      }),
    [
      size,
      borderRadius,
      borderWidth,
      placeholderBorder,
      placeholderBorderWidth,
      fallbackBackgroundColor,
      theme,
    ],
  );

  if (hasValidImage) {
    return (
      <View style={[dynamicStyles.container, style]}>
        <Image
          source={{ uri: resolvedUrl }}
          alt={alt || displayName || 'Foto de Perfil'}
          accessibilityLabel={accessibilityLabel || alt || displayName || 'Foto de Perfil'}
          style={[dynamicStyles.image, imageStyle]}
          contentFit="cover"
          cachePolicy="memory-disk"
          recyclingKey={resolvedUrl}
          transition={Platform.OS === 'web' ? undefined : 150}
          onError={() => setHasImageError(true)}
        />
      </View>
    );
  }

  if (fallbackType === 'initial') {
    return (
      <View style={[dynamicStyles.container, dynamicStyles.fallbackInitialBg, style]}>
        <Text style={[dynamicStyles.initialText, initialTextStyle]}>{initialChar}</Text>
      </View>
    );
  }

  return (
    <View style={[dynamicStyles.container, dynamicStyles.fallbackIconBg, style]}>
      <MaterialCommunityIcons
        name={fallbackIcon}
        size={iconSize}
        color={fallbackIconColor || theme.colors.primary}
      />
    </View>
  );
});
