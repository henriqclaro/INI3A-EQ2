import { ReactNode, useMemo } from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';

export interface MenuOptionButtonProps {
  title: string;
  subtitle?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  rightIcon?: keyof typeof MaterialCommunityIcons.glyphMap;
  badge?: ReactNode | string;
  onPress: () => void | Promise<void>;
  style?: StyleProp<ViewStyle>;
  isDestructive?: boolean;
  testID?: string;
  accessibilityLabel?: string;
}

export const MenuOptionButton = ({
  title,
  subtitle,
  icon,
  rightIcon = 'chevron-right',
  badge,
  onPress,
  style,
  isDestructive = false,
  testID,
  accessibilityLabel,
}: MenuOptionButtonProps) => {
  const { theme } = useThemeMode();

  const styles = useMemo(() => createStyles(theme, isDestructive), [theme, isDestructive]);

  return (
    <TouchableOpacity
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.leftContent}>
        {icon ? (
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name={icon}
              size={22}
              color={isDestructive ? theme.colors.error : theme.colors.primary}
            />
          </View>
        ) : null}

        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.rightContent}>
        {badge ? (
          typeof badge === 'string' ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ) : (
            badge
          )
        ) : null}

        <MaterialCommunityIcons
          name={rightIcon}
          size={20}
          color={isDestructive ? theme.colors.error : theme.colors.placeholder}
          style={styles.rightIcon}
        />
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (theme: AppTheme, isDestructive: boolean) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: isDestructive ? theme.colors.errorContainer : theme.colors.outlineVariant,
      borderRadius: theme.rounded.md,
      minHeight: 56,
      paddingVertical: theme.spacing.space3,
      paddingHorizontal: theme.spacing.space4,
      width: '100%',
      ...theme.shadows.soft,
    },
    leftContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: theme.spacing.space2,
    },
    iconContainer: {
      marginRight: theme.spacing.space3,
      width: 38,
      height: 38,
      borderRadius: theme.rounded.default,
      backgroundColor: isDestructive
        ? theme.colors.errorContainer
        : theme.colors.surfaceContainerLow,
      alignItems: 'center',
      justifyContent: 'center',
    },
    textContainer: {
      flex: 1,
      justifyContent: 'center',
    },
    title: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 15,
      fontWeight: '600',
      color: isDestructive ? theme.colors.error : theme.colors.espressoDark,
      lineHeight: 20,
    },
    subtitle: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      fontWeight: '400',
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
      lineHeight: 16,
    },
    rightContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.space2,
    },
    badge: {
      backgroundColor: theme.colors.primaryFixed,
      borderRadius: theme.rounded.full,
      paddingHorizontal: theme.spacing.space2,
      paddingVertical: 2,
    },
    badgeText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.onPrimaryFixed,
    },
    rightIcon: {
      color: isDestructive ? theme.colors.error : theme.colors.placeholder,
    },
  });
