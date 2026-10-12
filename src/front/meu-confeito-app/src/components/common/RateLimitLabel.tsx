import { useMemo } from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';
import { formatRemainingTime } from '@/src/utils/rateLimit';

export interface RateLimitLabelProps {
  message: string;
  retryAfterSeconds?: number;
  onDismiss?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function RateLimitLabel({
  message,
  retryAfterSeconds,
  onDismiss,
  style,
}: RateLimitLabelProps) {
  const { theme } = useThemeMode();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const hasRetryTime = retryAfterSeconds !== undefined && retryAfterSeconds > 0;

  return (
    <View style={[styles.container, style]} accessibilityRole="alert">
      <View style={styles.iconCircle}>
        <MaterialCommunityIcons name="clock-alert-outline" size={20} color={theme.colors.error} />
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.title}>Limite Excedido</Text>
        <Text style={styles.message}>{message}</Text>
        {hasRetryTime && (
          <Text style={styles.retryNote}>
            Tente novamente em {formatRemainingTime(retryAfterSeconds!)}
          </Text>
        )}
      </View>

      {onDismiss && (
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={onDismiss}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Fechar aviso de limite"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons name="close" size={18} color={theme.colors.onSurfaceVariant} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: theme.colors.errorContainer,
      borderRadius: theme.rounded.default,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: 12,
      gap: 10,
      marginVertical: 8,
    },
    iconCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.surfaceContainerLowest,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      marginTop: 2,
    },
    textContainer: {
      flex: 1,
      gap: 2,
    },
    title: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.onErrorContainer,
    },
    message: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      lineHeight: 16,
      color: theme.colors.onErrorContainer,
    },
    retryNote: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.onErrorContainer,
      marginTop: 2,
    },
    dismissButton: {
      minWidth: 48,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: -8,
      marginRight: -8,
    },
  });
