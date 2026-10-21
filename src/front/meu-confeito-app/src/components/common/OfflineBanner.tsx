import { useMemo } from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';

import { MaterialSymbol } from './MaterialSymbol';

export interface OfflineBannerProps {
  isVisible?: boolean;
  message?: string;
  onRetry?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function OfflineBanner({
  isVisible = true,
  message = 'Você está no modo offline. Exibindo dados salvos no seu dispositivo.',
  onRetry,
  style,
}: OfflineBannerProps) {
  const { theme } = useThemeMode();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (!isVisible) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconWrapper}>
        <MaterialSymbol name="cloud_off" size={20} color={theme.colors.secondary} />
      </View>
      <View style={styles.textWrapper}>
        <Text style={styles.message}>{message}</Text>
      </View>
      {Boolean(onRetry) && (
        <TouchableOpacity
          style={styles.retryButton}
          onPress={onRetry}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Tentar reconectar à internet"
        >
          <MaterialSymbol name="refresh" size={16} color={theme.colors.primary} />
          <Text style={styles.retryText}>Atualizar</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.md,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginBottom: 12,
      width: '100%',
      ...theme.shadows.soft,
    },
    iconWrapper: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    textWrapper: {
      flex: 1,
    },
    message: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 18,
    },
    retryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 8,
      minHeight: theme.spacing.touchable,
      borderRadius: theme.rounded.sm,
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    retryText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.primary,
    },
  });
