import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';

export interface SettingsTopicHeaderProps {
  title: string;
  description: string;
  onBack?: () => void;
  isMobile?: boolean;
}

export function SettingsTopicHeader({
  title,
  description,
  onBack,
  isMobile = false,
}: SettingsTopicHeaderProps) {
  const { theme } = useThemeMode();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.headerContainer}>
      {isMobile && onBack && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Voltar para todas as configurações"
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color={theme.colors.primary} />
          <Text style={styles.backButtonText}>Todas as Configurações</Text>
        </TouchableOpacity>
      )}

      <View style={styles.titleWrapper}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    headerContainer: {
      marginBottom: theme.spacing.space4,
      gap: theme.spacing.space2,
      width: '100%',
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.space1,
      alignSelf: 'flex-start',
      minHeight: 48,
      paddingVertical: theme.spacing.space1,
      paddingHorizontal: theme.spacing.space1,
    },
    backButtonText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    titleWrapper: {
      gap: 4,
    },
    title: {
      fontFamily: theme.typography.headlineLg.fontFamily,
      fontSize: 24,
      color: theme.colors.espressoDark,
      letterSpacing: 0.5,
    },
    description: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 20,
    },
  });
