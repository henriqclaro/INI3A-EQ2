import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';
import { formatDate } from '@/src/utils/formatters';

export interface DraftRecoveryBannerProps {
  isVisible: boolean;
  draftTimestamp?: Date | null;
  onRestore: () => void;
  onDiscard: () => void;
  title?: string;
  subtitle?: string;
}

export function DraftRecoveryBanner({
  isVisible,
  draftTimestamp,
  onRestore,
  onDiscard,
  title = 'Rascunho não salvo encontrado',
  subtitle,
}: DraftRecoveryBannerProps) {
  const { theme } = useThemeMode();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (!isVisible) {
    return null;
  }

  const formattedTime = draftTimestamp
    ? `${formatDate(draftTimestamp)} às ${draftTimestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
    : null;

  const resolvedSubtitle =
    subtitle ||
    (formattedTime
      ? `Salvo automaticamente em ${formattedTime}. Deseja restaurar suas alterações?`
      : 'Deseja restaurar as informações não salvas da última sessão?');

  return (
    <View style={styles.container}>
      <View style={styles.iconWrapper}>
        <MaterialCommunityIcons name="history" size={24} color={theme.colors.primary} />
      </View>

      <View style={styles.textColumn}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{resolvedSubtitle}</Text>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={onRestore}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Restaurar rascunho salvo"
          >
            <MaterialCommunityIcons
              name="restore"
              size={16}
              color={theme.colors.onPrimary}
              style={styles.btnIcon}
            />
            <Text style={styles.restoreButtonText}>Restaurar Rascunho</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.discardButton}
            onPress={onDiscard}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Descartar rascunho salvo"
          >
            <MaterialCommunityIcons
              name="trash-can-outline"
              size={16}
              color={theme.colors.onSurfaceVariant}
              style={styles.btnIcon}
            />
            <Text style={styles.discardButtonText}>Descartar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.lg,
      padding: 16,
      marginHorizontal: 16,
      marginBottom: 16,
      gap: 12,
      ...theme.shadows.soft,
    },
    iconWrapper: {
      width: 40,
      height: 40,
      borderRadius: theme.rounded.md,
      backgroundColor: theme.colors.surfaceContainer,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      marginTop: 2,
    },
    textColumn: {
      flex: 1,
      gap: 4,
    },
    title: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.espressoDark,
    },
    subtitle: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      lineHeight: 18,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 6,
    },
    actionsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      alignItems: 'center',
      marginTop: 4,
    },
    restoreButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: theme.rounded.default,
      minHeight: 48,
    },
    restoreButtonText: {
      color: theme.colors.onPrimary,
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
    },
    discardButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceContainerHighest,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: theme.rounded.default,
      minHeight: 48,
    },
    discardButtonText: {
      color: theme.colors.onSurfaceVariant,
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
    },
    btnIcon: {
      marginRight: 6,
    },
  });
