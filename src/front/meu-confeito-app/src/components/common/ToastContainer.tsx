import { useEffect, useMemo, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemeMode } from '@/src/contexts/ThemeContext';
import { useToast } from '@/src/contexts/ToastContext';
import { AppTheme } from '@/src/theme/themes';

import { MaterialSymbol } from './MaterialSymbol';

export function ToastContainer() {
  const { activeToast, hideToast } = useToast();
  const { theme } = useThemeMode();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [translateY] = useState(() => new Animated.Value(-80));
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (activeToast) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 4,
          speed: 14,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -80,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [activeToast, translateY, opacity]);

  if (!activeToast) {
    return null;
  }

  const { title, message, type = 'info', actionLabel, onAction } = activeToast;

  const typeConfig = {
    success: {
      icon: 'check_circle' as const,
      color: theme.colors.tertiary,
      bg: theme.colors.tertiaryFixed,
    },
    error: {
      icon: 'error' as const,
      color: theme.colors.error,
      bg: theme.colors.errorContainer,
    },
    warning: {
      icon: 'warning' as const,
      color: theme.colors.warning,
      bg: theme.colors.surfaceContainerHigh,
    },
    info: {
      icon: 'info' as const,
      color: theme.colors.primary,
      bg: theme.colors.primaryFixed,
    },
  }[type];

  const topInset = Math.max(insets.top + 8, Platform.OS === 'web' ? 16 : 44);

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          top: topInset,
          transform: [{ translateY }],
          opacity,
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.card}>
        <View style={[styles.iconCircle, { backgroundColor: typeConfig.bg }]}>
          <MaterialSymbol name={typeConfig.icon} size={20} color={typeConfig.color} />
        </View>

        <View style={styles.textCol}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          <Text style={styles.message} numberOfLines={3}>
            {message}
          </Text>
        </View>

        {actionLabel && onAction ? (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => {
              onAction();
              hideToast();
            }}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
          >
            <Text style={styles.actionBtnText}>{actionLabel}</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={styles.closeBtn}
          onPress={hideToast}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Fechar aviso"
        >
          <MaterialSymbol name="close" size={18} color={theme.colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    wrapper: {
      position: 'absolute',
      left: 16,
      right: 16,
      zIndex: 99999,
      alignItems: 'center',
    },
    card: {
      width: '100%',
      maxWidth: 520,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.lg,
      paddingVertical: 12,
      paddingHorizontal: 14,
      gap: 12,
      ...theme.shadows.modal,
    },
    iconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    textCol: {
      flex: 1,
      gap: 2,
    },
    title: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.espressoDark,
    },
    message: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      lineHeight: 18,
      color: theme.colors.onSurface,
    },
    actionBtn: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      backgroundColor: theme.colors.surfaceContainerHigh,
      borderRadius: theme.rounded.default,
      minHeight: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionBtnText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    closeBtn: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
