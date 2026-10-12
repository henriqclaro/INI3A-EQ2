import { useEffect, useMemo, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';
import { DesktopAlertState, desktopAlertManager, initDesktopAlert } from '@/src/utils/desktopAlert';

export function DesktopAlert() {
  const { theme } = useThemeMode();
  const [alertState, setAlertState] = useState<DesktopAlertState>(() =>
    desktopAlertManager.getState(),
  );

  useEffect(() => {
    initDesktopAlert();
    const unsubscribe = desktopAlertManager.subscribe((newState) => {
      setAlertState(newState);
    });
    return unsubscribe;
  }, []);

  const styles = useMemo(() => createStyles(theme), [theme]);

  // Exclusive for desktop/web non-mobile platform
  if (Platform.OS !== 'web') {
    return null;
  }

  const { isOpen, title, message, buttons = [], options } = alertState;

  if (!isOpen) {
    return null;
  }

  const hasDestructiveAction = buttons.some((btn) => btn.style === 'destructive');
  const isCancelable = options?.cancelable ?? true;

  // Determine modal icon
  let iconName: keyof typeof MaterialCommunityIcons.glyphMap = 'information-outline';
  let iconColor = theme.colors.primary;
  let iconBgColor = theme.colors.secondaryContainer;

  const lowerTitle = (title || '').toLowerCase();
  if (
    hasDestructiveAction ||
    lowerTitle.includes('sair') ||
    lowerTitle.includes('cancelar') ||
    lowerTitle.includes('excluir')
  ) {
    iconName = lowerTitle.includes('sair') ? 'logout' : 'alert-circle-outline';
    iconColor = theme.colors.error;
    iconBgColor = theme.colors.errorContainer;
  } else if (lowerTitle.includes('sucesso') || lowerTitle.includes('salvo')) {
    iconName = 'check-circle-outline';
    iconColor = theme.colors.tertiary;
    iconBgColor = theme.colors.chips.success.background;
  } else if (lowerTitle.includes('erro') || lowerTitle.includes('falha')) {
    iconName = 'alert-outline';
    iconColor = theme.colors.error;
    iconBgColor = theme.colors.errorContainer;
  } else if (lowerTitle.includes('limite')) {
    iconName = 'clock-alert-outline';
    iconColor = theme.colors.error;
    iconBgColor = theme.colors.errorContainer;
  }

  const handleBackdropPress = () => {
    if (isCancelable) {
      desktopAlertManager.hide();
      options?.onDismiss?.();
    }
  };

  const handleButtonPress = (onPressCallback?: () => void) => {
    desktopAlertManager.hide();
    onPressCallback?.();
  };

  return (
    <Modal
      transparent={true}
      visible={isOpen}
      animationType="fade"
      onRequestClose={handleBackdropPress}
    >
      <View style={styles.overlay}>
        <Pressable
          style={styles.backdrop}
          onPress={handleBackdropPress}
          accessibilityRole="button"
          accessibilityLabel="Fechar alerta"
        />

        <View style={styles.card} accessibilityRole="alert">
          <View style={[styles.iconCircle, { backgroundColor: iconBgColor }]}>
            <MaterialCommunityIcons name={iconName} size={28} color={iconColor} />
          </View>

          <View style={styles.textBlock}>
            <Text style={styles.title}>{title}</Text>
            {message ? <Text style={styles.message}>{message}</Text> : null}
          </View>

          <View style={styles.buttonsRow}>
            {buttons.map((btn, index) => {
              const isDestructive = btn.style === 'destructive';
              const isCancel = btn.style === 'cancel';

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.actionButton,
                    isCancel
                      ? styles.cancelButton
                      : isDestructive
                        ? styles.destructiveButton
                        : styles.primaryButton,
                  ]}
                  onPress={() => handleButtonPress(btn.onPress)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={btn.text || 'OK'}
                >
                  <Text
                    style={[
                      styles.actionButtonText,
                      isCancel
                        ? styles.cancelButtonText
                        : isDestructive
                          ? styles.destructiveButtonText
                          : styles.primaryButtonText,
                    ]}
                  >
                    {btn.text || 'OK'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    backdrop: {
      ...StyleSheet.absoluteFill,
      backgroundColor: theme.colors.backdrop,
      zIndex: 1,
    },
    card: {
      width: '100%',
      maxWidth: 440,
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.rounded.lg,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: 24,
      alignItems: 'center',
      zIndex: 2,
      gap: 16,
      ...theme.shadows.modal,
    },
    iconCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    textBlock: {
      alignItems: 'center',
      gap: 8,
      width: '100%',
    },
    title: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.espressoDark,
      textAlign: 'center',
    },
    message: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 14,
      lineHeight: 22,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
    },
    buttonsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 12,
      width: '100%',
      marginTop: 8,
    },
    actionButton: {
      flex: 1,
      minHeight: 48,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: theme.rounded.default,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionButtonText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 14,
      fontWeight: '600',
    },
    primaryButton: {
      backgroundColor: theme.colors.primary,
      ...theme.shadows.glow,
    },
    primaryButtonText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.onPrimary,
    },
    cancelButton: {
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    cancelButtonText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    destructiveButton: {
      backgroundColor: theme.colors.error,
      ...theme.shadows.soft,
    },
    destructiveButtonText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.onError,
    },
  });
