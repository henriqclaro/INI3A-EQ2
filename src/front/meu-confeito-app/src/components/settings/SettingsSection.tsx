import { ReactNode, useMemo } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';

export interface SettingsSectionProps {
  title: string;
  description?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function SettingsSection({
  title,
  description,
  icon,
  children,
  style,
}: SettingsSectionProps) {
  const { theme } = useThemeMode();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[styles.sectionContainer, style]}>
      <View style={styles.sectionHeader}>
        {icon ? (
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name={icon} size={18} color={theme.colors.primary} />
          </View>
        ) : null}
        <View style={styles.headerTextWrapper}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {description ? <Text style={styles.sectionDescription}>{description}</Text> : null}
        </View>
      </View>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    sectionContainer: {
      width: '100%',
      gap: theme.spacing.space3,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.space3,
      paddingHorizontal: theme.spacing.space1,
    },
    iconCircle: {
      width: 32,
      height: 32,
      borderRadius: theme.rounded.full,
      backgroundColor: theme.colors.surfaceContainerHigh,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    headerTextWrapper: {
      flex: 1,
    },
    sectionTitle: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.espressoDark,
      letterSpacing: 0.3,
    },
    sectionDescription: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
      lineHeight: 18,
    },
    sectionContent: {
      width: '100%',
      gap: theme.spacing.space3,
    },
  });
