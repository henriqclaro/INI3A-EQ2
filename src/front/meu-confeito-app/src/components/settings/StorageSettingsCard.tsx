import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useSettings } from '@/src/contexts/SettingsContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';
import { clearAppCache } from '@/src/utils/cache';

export function StorageSettingsCard() {
  const { theme } = useThemeMode();
  const { triggerHaptic } = useSettings();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < theme.breakpoints.sm;

  const [isClearing, setIsClearing] = useState(false);
  const [hasCleared, setHasCleared] = useState(false);

  const styles = useMemo(() => createStyles(theme, isSmallScreen), [theme, isSmallScreen]);

  const executeClearCache = async () => {
    setIsClearing(true);
    try {
      const result = await clearAppCache();
      if (result.isSuccess) {
        setHasCleared(true);
        triggerHaptic('success');
        Alert.alert(
          'Cache Liberado',
          'O cache de imagens e arquivos temporários foi limpo com sucesso.',
        );
      } else {
        triggerHaptic('error');
        Alert.alert(
          'Falha na Limpeza',
          'Não foi possível limpar todo o cache. Tente novamente mais tarde.',
        );
      }
    } catch {
      triggerHaptic('error');
      Alert.alert(
        'Falha na Limpeza',
        'Ocorreu um erro inesperado ao limpar o cache. Tente novamente.',
      );
    } finally {
      setIsClearing(false);
    }
  };

  const handlePromptClearCache = () => {
    triggerHaptic('medium');
    Alert.alert(
      'Limpar Cache da Aplicação',
      'Esta ação apagará as imagens e arquivos temporários armazenados na memória e no disco do aparelho. Suas receitas, fichas técnicas e configurações permanecerão salvas.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Limpar Cache',
          style: 'destructive',
          onPress: executeClearCache,
        },
      ],
    );
  };

  return (
    <View style={styles.card}>
      {/* Option Row: Clear App Cache */}
      <View style={styles.actionRow}>
        <View style={styles.infoWrapper}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="cached" size={22} color={theme.colors.primary} />
          </View>
          <View style={styles.textColumn}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Limpar Cache da Aplicação</Text>
              {hasCleared && (
                <View style={styles.successBadge}>
                  <MaterialCommunityIcons name="check" size={12} color={theme.colors.onTertiary} />
                  <Text style={styles.successBadgeText}>Limpo</Text>
                </View>
              )}
            </View>
            <Text style={styles.subtitle}>
              Libera armazenamento local removendo imagens salvas e arquivos temporários da memória
              e do disco.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.clearButton, isClearing && styles.clearButtonDisabled]}
          onPress={handlePromptClearCache}
          disabled={isClearing}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Limpar cache da aplicação"
        >
          {isClearing ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <MaterialCommunityIcons name="broom" size={18} color={theme.colors.primary} />
          )}
          <Text style={styles.clearButtonText}>{isClearing ? 'Limpando...' : 'Limpar'}</Text>
        </TouchableOpacity>
      </View>

      {/* Info Callout */}
      <View style={styles.calloutContainer}>
        <MaterialCommunityIcons
          name="information-outline"
          size={18}
          color={theme.colors.onSurfaceVariant}
          style={styles.calloutIcon}
        />
        <Text style={styles.calloutText}>
          O cache armazena imagens localmente para acelerar o carregamento e poupar dados móveis. A
          limpeza é recomendada caso queira liberar espaço ou atualizar fotos recém-alteradas.
        </Text>
      </View>
    </View>
  );
}

const createStyles = (theme: AppTheme, isSmallScreen: boolean) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.lg,
      padding: theme.spacing.space4,
      width: '100%',
      gap: theme.spacing.space4,
      ...theme.shadows.soft,
    },
    actionRow: {
      flexDirection: isSmallScreen ? 'column' : 'row',
      alignItems: isSmallScreen ? 'stretch' : 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.space3,
    },
    infoWrapper: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: theme.spacing.space3,
    },
    iconCircle: {
      width: 40,
      height: 40,
      borderRadius: theme.rounded.full,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },
    textColumn: {
      flex: 1,
      gap: 2,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: theme.spacing.space2,
    },
    title: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.espressoDark,
    },
    subtitle: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 18,
    },
    successBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: theme.colors.tertiary,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: theme.rounded.full,
    },
    successBadgeText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.onTertiary,
    },
    clearButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.space2,
      minHeight: 48,
      minWidth: isSmallScreen ? '100%' : 110,
      paddingHorizontal: theme.spacing.space4,
      paddingVertical: theme.spacing.space2,
      borderRadius: theme.rounded.md,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    clearButtonDisabled: {
      opacity: 0.6,
    },
    clearButtonText: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    calloutContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: theme.spacing.space2,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.md,
      padding: theme.spacing.space3,
    },
    calloutIcon: {
      marginTop: 1,
    },
    calloutText: {
      flex: 1,
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      lineHeight: 18,
      color: theme.colors.onSurfaceVariant,
    },
  });
