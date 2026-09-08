import { ReactNode, useMemo } from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useThemeMode } from '../contexts/ThemeContext';
import { AppTheme } from '../theme/themes';

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
              color={isDestructive ? theme.colors.danger : theme.colors.primary}
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
          size={22}
          color={isDestructive ? theme.colors.danger : theme.colors.text}
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
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: isDestructive ? theme.colors.danger : theme.colors.secBorder,
      borderRadius: 12,
      minHeight: 52,
      paddingVertical: 12,
      paddingHorizontal: 16,
      width: '100%',
    },
    leftContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: 8,
    },
    iconContainer: {
      marginRight: 12,
      width: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
    textContainer: {
      flex: 1,
      justifyContent: 'center',
    },
    title: {
      fontFamily: 'Inter',
      fontSize: 16,
      fontWeight: '600',
      color: isDestructive ? theme.colors.danger : theme.colors.text,
      lineHeight: 22,
    },
    subtitle: {
      fontFamily: 'Inter',
      fontSize: 12,
      color: theme.colors.mediumGray,
      marginTop: 2,
      lineHeight: 16,
    },
    rightContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    badge: {
      backgroundColor: theme.colors.pitchBackground,
      borderWidth: 1,
      borderColor: theme.colors.secBorder,
      borderRadius: 9999,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    badgeText: {
      fontFamily: 'Inter',
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    rightIcon: {
      color: isDestructive ? theme.colors.danger : theme.colors.darkGray,
    },
  });
