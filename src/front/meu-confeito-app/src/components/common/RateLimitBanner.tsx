import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';
import { RateLimitNoticeState, formatRemainingTime, rateLimitManager } from '@/src/utils/rateLimit';

export function RateLimitBanner() {
  const { theme } = useThemeMode();
  const insets = useSafeAreaInsets();
  const [noticeState, setNoticeState] = useState<RateLimitNoticeState>(() =>
    rateLimitManager.getState(),
  );
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);

  useEffect(() => {
    const unsubscribe = rateLimitManager.subscribe((newState) => {
      setNoticeState(newState);
      if (newState.resetAt) {
        const remaining = Math.max(0, Math.ceil((newState.resetAt - Date.now()) / 1000));
        setRemainingSeconds(remaining);
      } else {
        setRemainingSeconds(newState.retryAfterSeconds ?? 0);
      }
    });

    return unsubscribe;
  }, []);

  // Countdown timer tick effect
  useEffect(() => {
    if (!noticeState.isVisible || !noticeState.resetAt) {
      return;
    }

    const intervalId = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((noticeState.resetAt! - Date.now()) / 1000));
      setRemainingSeconds(remaining);

      if (remaining <= 0) {
        clearInterval(intervalId);
        rateLimitManager.hide();
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [noticeState.isVisible, noticeState.resetAt]);

  const styles = useMemo(() => createStyles(theme, insets.top), [theme, insets.top]);

  if (!noticeState.isVisible) {
    return null;
  }

  const { title, message, isAuthLimit } = noticeState;
  const isTimeAvailable = remainingSeconds > 0;

  return (
    <View style={styles.floatingContainer} accessibilityRole="alert">
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons
            name={isAuthLimit ? 'shield-alert-outline' : 'clock-alert-outline'}
            size={24}
            color={theme.colors.primary}
          />
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          {isTimeAvailable && (
            <View style={styles.timerBadge}>
              <MaterialCommunityIcons
                name="timer-sand"
                size={14}
                color={theme.colors.onPrimaryFixed}
              />
              <Text style={styles.timerText}>Aguarde {formatRemainingTime(remainingSeconds)}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => rateLimitManager.hide()}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Fechar aviso de limite"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons name="close" size={20} color={theme.colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (theme: AppTheme, topInset: number) =>
  StyleSheet.create({
    floatingContainer: {
      position: 'absolute',
      top: Math.max(topInset + 8, 16),
      left: 16,
      right: 16,
      zIndex: 9999,
      alignItems: 'center',
    },
    card: {
      width: '100%',
      maxWidth: 520,
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.rounded.md,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      ...theme.shadows.modal,
    },
    iconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.primaryFixed,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      marginTop: 2,
    },
    content: {
      flex: 1,
      gap: 4,
    },
    title: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.espressoDark,
    },
    message: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 13,
      lineHeight: 18,
      color: theme.colors.onSurfaceVariant,
    },
    timerBadge: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.colors.primaryFixed,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: theme.rounded.sm,
      marginTop: 4,
    },
    timerText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.onPrimaryFixed,
    },
    closeButton: {
      minWidth: 48,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 4,
    },
  });
