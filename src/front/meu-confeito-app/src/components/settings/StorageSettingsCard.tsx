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
import { useAllDownloadedRecipes } from '@/src/hooks/useDownloadedRecipes';
import { AppTheme } from '@/src/theme/themes';
import { clearAppCache } from '@/src/utils/cache';
import { clearAllFormDrafts } from '@/src/utils/drafts';

export function StorageSettingsCard() {
  const { theme } = useThemeMode();
  const { triggerHaptic } = useSettings();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < theme.breakpoints.sm;
  const { count: downloadedCount, clearAll: clearAllDownloads } = useAllDownloadedRecipes();

  const [isClearingCache, setIsClearingCache] = useState(false);
  const [hasClearedCache, setHasClearedCache] = useState(false);
  const [isClearingDrafts, setIsClearingDrafts] = useState(false);
  const [hasClearedDrafts, setHasClearedDrafts] = useState(false);
  const [isClearingDownloads, setIsClearingDownloads] = useState(false);
  const [hasClearedDownloads, setHasClearedDownloads] = useState(false);

  const styles = useMemo(() => createStyles(theme, isSmallScreen), [theme, isSmallScreen]);

  const executeClearCache = async () => {
    setIsClearingCache(true);
    try {
      const result = await clearAppCache();
      if (result.isSuccess) {
        setHasClearedCache(true);
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
      setIsClearingCache(false);
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

  const executeClearDrafts = () => {
    setIsClearingDrafts(true);
    try {
      const result = clearAllFormDrafts();
      if (result.isSuccess) {
        setHasClearedDrafts(true);
        triggerHaptic('success');
        Alert.alert(
          'Rascunhos Removidos',
          result.clearedCount > 0
            ? `${result.clearedCount} rascunho(s) não salvo(s) foram excluídos com sucesso.`
            : 'Todos os rascunhos salvos da aplicação foram removidos com sucesso.',
        );
      } else {
        triggerHaptic('error');
        Alert.alert(
          'Falha ao Remover',
          'Não foi possível remover os rascunhos. Tente novamente mais tarde.',
        );
      }
    } catch {
      triggerHaptic('error');
      Alert.alert(
        'Falha ao Remover',
        'Ocorreu um erro inesperado ao remover os rascunhos. Tente novamente.',
      );
    } finally {
      setIsClearingDrafts(false);
    }
  };

  const handlePromptClearDrafts = () => {
    triggerHaptic('medium');
    Alert.alert(
      'Remover Rascunhos Salvos',
      'Esta ação apagará todos os rascunhos de receitas e formulários em andamento salvos no dispositivo. Suas receitas cadastradas não serão afetadas.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Remover Rascunhos',
          style: 'destructive',
          onPress: executeClearDrafts,
        },
      ],
    );
  };

  const executeClearDownloads = async () => {
    setIsClearingDownloads(true);
    try {
      const result = await clearAllDownloads();
      if (result.isSuccess) {
        setHasClearedDownloads(true);
        triggerHaptic('success');
        Alert.alert(
          'Armazenamento Liberado',
          result.clearedCount > 0
            ? `${result.clearedCount} receita(s) baixada(s) foram removida(s) com sucesso.`
            : 'Todas as receitas baixadas foram removidas com sucesso.',
        );
      } else {
        triggerHaptic('error');
        Alert.alert(
          'Falha ao Remover',
          'Não foi possível remover as receitas baixadas. Tente novamente mais tarde.',
        );
      }
    } catch {
      triggerHaptic('error');
      Alert.alert(
        'Falha ao Remover',
        'Ocorreu um erro inesperado ao remover as receitas baixadas. Tente novamente.',
      );
    } finally {
      setIsClearingDownloads(false);
    }
  };

  const handlePromptClearDownloads = () => {
    triggerHaptic('medium');
    if (downloadedCount === 0) {
      Alert.alert(
        'Nenhuma Receita Baixada',
        'Você não possui receitas salvas localmente no dispositivo para acesso offline.',
      );
      return;
    }

    Alert.alert(
      'Remover Receitas Baixadas',
      `Esta ação removerá todas as ${downloadedCount} receita(s) salva(s) localmente no dispositivo. O acesso offline a elas será desativado até serem baixadas novamente. Suas receitas no servidor não serão afetadas.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Remover Todas',
          style: 'destructive',
          onPress: executeClearDownloads,
        },
      ],
    );
  };

  return (
    <View style={styles.card}>
      {/* Option Row 1: Clear App Cache */}
      <View style={styles.actionRow}>
        <View style={styles.infoWrapper}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="cached" size={22} color={theme.colors.primary} />
          </View>
          <View style={styles.textColumn}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Limpar Cache da Aplicação</Text>
              {hasClearedCache && (
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
          style={[styles.clearButton, isClearingCache && styles.clearButtonDisabled]}
          onPress={handlePromptClearCache}
          disabled={isClearingCache}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Limpar cache da aplicação"
        >
          {isClearingCache ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <MaterialCommunityIcons name="broom" size={18} color={theme.colors.primary} />
          )}
          <Text style={styles.clearButtonText}>{isClearingCache ? 'Limpando...' : 'Limpar'}</Text>
        </TouchableOpacity>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Option Row 2: Clear Form Drafts */}
      <View style={styles.actionRow}>
        <View style={styles.infoWrapper}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons
              name="file-document-remove-outline"
              size={22}
              color={theme.colors.primary}
            />
          </View>
          <View style={styles.textColumn}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Remover Rascunhos Salvos</Text>
              {hasClearedDrafts && (
                <View style={styles.successBadge}>
                  <MaterialCommunityIcons name="check" size={12} color={theme.colors.onTertiary} />
                  <Text style={styles.successBadgeText}>Removidos</Text>
                </View>
              )}
            </View>
            <Text style={styles.subtitle}>
              Exclui dados automáticos de receitas e formulários em andamento que ainda não foram
              salvos.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.clearButton, isClearingDrafts && styles.clearButtonDisabled]}
          onPress={handlePromptClearDrafts}
          disabled={isClearingDrafts}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Remover todos os rascunhos salvos da aplicação"
        >
          {isClearingDrafts ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <MaterialCommunityIcons
              name="delete-sweep-outline"
              size={18}
              color={theme.colors.primary}
            />
          )}
          <Text style={styles.clearButtonText}>
            {isClearingDrafts ? 'Removendo...' : 'Remover'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Option Row 3: Clear Downloaded Recipes */}
      <View style={styles.actionRow}>
        <View style={styles.infoWrapper}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons
              name="cloud-remove-outline"
              size={22}
              color={theme.colors.primary}
            />
          </View>
          <View style={styles.textColumn}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Remover Receitas Baixadas</Text>
              {hasClearedDownloads && (
                <View style={styles.successBadge}>
                  <MaterialCommunityIcons name="check" size={12} color={theme.colors.onTertiary} />
                  <Text style={styles.successBadgeText}>Removidas</Text>
                </View>
              )}
            </View>
            <Text style={styles.subtitle}>
              {downloadedCount > 0
                ? `${downloadedCount} receita(s) salva(s) para acesso offline. Exclui as cópias locais para liberar espaço de armazenamento.`
                : 'Exclui todas as cópias de receitas salvas localmente para uso sem internet, liberando armazenamento.'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.clearButton, isClearingDownloads && styles.clearButtonDisabled]}
          onPress={handlePromptClearDownloads}
          disabled={isClearingDownloads}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Remover todas as receitas baixadas do dispositivo"
        >
          {isClearingDownloads ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <MaterialCommunityIcons
              name="delete-sweep-outline"
              size={18}
              color={theme.colors.primary}
            />
          )}
          <Text style={styles.clearButtonText}>
            {isClearingDownloads ? 'Removendo...' : 'Remover'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Info Callout */}
      <View style={styles.calloutContainer}>
        <MaterialCommunityIcons
          name="information-outline"
          size={18}
          color={theme.colors.onSurfaceVariant}
          style={styles.calloutIcon}
        />
        <Text style={styles.calloutText}>
          O armazenamento local guarda cópias de segurança em segundo plano para prevenir perda de
          dados ao fechar janelas acidentalmente.
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
    divider: {
      height: 1,
      backgroundColor: theme.colors.outlineVariant,
      width: '100%',
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
