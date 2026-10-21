import { useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

import { router } from 'expo-router';

import { MaterialSymbol, MenuOptionButton, ThemeSwitch } from '@/src/components/common';
import { useOnboarding } from '@/src/contexts/OnboardingContext';
import { useSettings } from '@/src/contexts/SettingsContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';

export function AccessibilityTopic() {
  const { theme, isHighContrast } = useThemeMode();
  const {
    isSwipeNavigationEnabled,
    isHapticsEnabled,
    isRoutePersistenceEnabled,
    toggleSwipeNavigation,
    toggleHaptics,
    toggleRoutePersistence,
    triggerHaptic,
  } = useSettings();
  const { dismissAllCards, resetAllCards, hasDismissedAllCards } = useOnboarding();

  const { width } = useWindowDimensions();
  const isSmallScreen = width < theme.breakpoints.sm;
  const isDesktop = Platform.OS === 'web' && width >= theme.breakpoints.md;
  const styles = useMemo(() => createStyles(theme, isSmallScreen), [theme, isSmallScreen]);

  const [hasTestedHaptic, setHasTestedHaptic] = useState(false);

  const handleTestHaptic = () => {
    triggerHaptic('medium');
    setHasTestedHaptic(true);
    setTimeout(() => {
      setHasTestedHaptic(false);
    }, 1200);
  };

  const handlePromptDismissAllCards = () => {
    triggerHaptic('medium');
    Alert.alert(
      'Ocultar Todos os Cards?',
      'Todos os cards de dicas e incentivo ao aprendizado serão ocultados das telas do aplicativo no seu dispositivo.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Ocultar Todos',
          style: 'destructive',
          onPress: async () => {
            await dismissAllCards();
            triggerHaptic('selection');
            Alert.alert(
              'Cards Ocultados',
              'Todos os cards de ajuda e descoberta foram ocultados das telas.',
            );
          },
        },
      ],
    );
  };

  const handlePromptResetAllCards = () => {
    triggerHaptic('medium');
    Alert.alert(
      'Restaurar Cards de Ajuda?',
      'Todos os cards de aprendizado, atalhos de funcionalidades e dicas voltarão a ser exibidos nas telas correspondentes.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restaurar Cards',
          onPress: async () => {
            await resetAllCards();
            triggerHaptic('success');
            Alert.alert(
              'Cards Restaurados',
              'Os cards informativos foram restaurados e voltarão a aparecer nas telas.',
            );
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      {/* Container 1: Gestos e Retorno Tátil */}
      <View style={styles.card}>
        {!isDesktop ? (
          <>
            {/* Setting: Swipe Navigation */}
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <View style={styles.iconCircle}>
                  <MaterialSymbol name="swipe" size={22} color={theme.colors.primary} />
                </View>
                <View style={styles.textColumn}>
                  <View style={styles.titleWithBadge}>
                    <Text style={styles.title}>Navegação por Gesto</Text>
                    <View
                      style={isSwipeNavigationEnabled ? styles.activeBadge : styles.inactiveBadge}
                    >
                      <Text
                        style={
                          isSwipeNavigationEnabled
                            ? styles.activeBadgeText
                            : styles.inactiveBadgeText
                        }
                      >
                        {isSwipeNavigationEnabled ? 'Ativado' : 'Desativado'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.subtitle}>
                    Arraste horizontalmente para alternar entre as abas principais com fluidez
                  </Text>
                </View>
              </View>

              <ThemeSwitch
                value={isSwipeNavigationEnabled}
                onValueChange={toggleSwipeNavigation}
                accessibilityLabel="Ativar ou desativar navegação por gesto de deslize"
              />
            </View>

            <View style={styles.divider} />

            {/* Setting: Global Haptic Feedback */}
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <View style={styles.iconCircle}>
                  <MaterialSymbol name="mobile_vibrate" size={22} color={theme.colors.primary} />
                </View>
                <View style={styles.textColumn}>
                  <View style={styles.titleWithBadge}>
                    <Text style={styles.title}>Retorno Tátil Global</Text>
                    <View style={isHapticsEnabled ? styles.activeBadge : styles.inactiveBadge}>
                      <Text
                        style={isHapticsEnabled ? styles.activeBadgeText : styles.inactiveBadgeText}
                      >
                        {isHapticsEnabled ? 'Ativado' : 'Desativado'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.subtitle}>
                    Vibrações sutis ao mudar de aba, alternar opções e confirmar ações no celular
                  </Text>
                </View>
              </View>

              <ThemeSwitch
                value={isHapticsEnabled}
                onValueChange={toggleHaptics}
                hasHapticFeedback={false}
                accessibilityLabel="Ativar ou desativar retorno tátil global no aplicativo"
              />
            </View>

            {/* Test Haptic Feedback Button */}
            {isHapticsEnabled ? (
              <View style={styles.testContainer}>
                <TouchableOpacity
                  style={[styles.testButton, hasTestedHaptic && styles.testButtonSuccess]}
                  onPress={handleTestHaptic}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Testar vibração no aparelho"
                >
                  <MaterialSymbol
                    name={hasTestedHaptic ? 'check_circle' : 'cell_tower'}
                    size={18}
                    color={hasTestedHaptic ? theme.colors.onPrimary : theme.colors.primary}
                  />
                  <Text
                    style={[styles.testButtonText, hasTestedHaptic && styles.testButtonTextSuccess]}
                  >
                    {hasTestedHaptic ? 'Vibração disparada!' : 'Testar vibração no aparelho'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <View style={styles.divider} />
          </>
        ) : null}

        {/* Setting: Route Persistence */}
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <View style={styles.iconCircle}>
              <MaterialSymbol name="history" size={22} color={theme.colors.primary} />
            </View>
            <View style={styles.textColumn}>
              <View style={styles.titleWithBadge}>
                <Text style={styles.title}>Retomar Última Tela</Text>
                <View style={isRoutePersistenceEnabled ? styles.activeBadge : styles.inactiveBadge}>
                  <Text
                    style={
                      isRoutePersistenceEnabled ? styles.activeBadgeText : styles.inactiveBadgeText
                    }
                  >
                    {isRoutePersistenceEnabled ? 'Ativado' : 'Desativado'}
                  </Text>
                </View>
              </View>
              <Text style={styles.subtitle}>
                Retoma automaticamente a última receita ou tela aberta após fechar ou reiniciar o
                app
              </Text>
            </View>
          </View>

          <ThemeSwitch
            value={isRoutePersistenceEnabled}
            onValueChange={toggleRoutePersistence}
            accessibilityLabel="Ativar ou desativar persistência de rota ao reabrir o app"
          />
        </View>

        {/* Info Callout */}
        <View style={styles.infoCallout}>
          <MaterialSymbol
            name="info"
            size={18}
            color={theme.colors.primary}
            style={styles.infoIcon}
          />
          <Text style={styles.infoText}>
            Essas preferências de acessibilidade e interação são salvas no seu dispositivo e têm
            efeito imediato em toda a navegação do aplicativo.
          </Text>
        </View>
      </View>

      {/* Container 2: Cards de Ajuda & Descoberta (container próprio) */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Cards de Ajuda & Descoberta</Text>
          <Text style={styles.sectionSubtitle}>
            Dicas e atalhos exibidos nas telas para incentivar a interação e o aprendizado das
            funcionalidades.
          </Text>
        </View>

        <View style={styles.cardsActionContainer}>
          {/* Button to remove all cards */}
          <TouchableOpacity
            style={[styles.cardActionButton, styles.dismissAllButton]}
            onPress={handlePromptDismissAllCards}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Ocultar todos os cards de ajuda da aplicação"
          >
            <MaterialSymbol name="visibility_off" size={18} color={theme.colors.error} />
            <Text style={styles.dismissAllButtonText}>
              {hasDismissedAllCards ? 'Cards Ocultados' : 'Ocultar Todos os Cards'}
            </Text>
          </TouchableOpacity>

          {/* Button to reset cards so they show up again */}
          <TouchableOpacity
            style={[styles.cardActionButton, styles.resetButton]}
            onPress={handlePromptResetAllCards}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Restaurar cards de ajuda para que apareçam novamente"
          >
            <MaterialSymbol name="settings_backup_restore" size={18} color={theme.colors.primary} />
            <Text style={styles.resetButtonText}>Restaurar Cards</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Outside container: Shortcut to High Contrast mode (same pattern as AboutAppTopic.tsx) */}
      <View style={styles.supportSection}>
        <Text style={styles.supportSectionTitle}>Aparência e Contraste</Text>
        <MenuOptionButton
          title="Modo Alto Contraste"
          subtitle="Ajuste nitidez de bordas e contraste reforçado na tela de Aparência"
          icon="contrast"
          badge={isHighContrast ? 'Ativado' : undefined}
          onPress={() => router.push('/settings?topic=appearance')}
        />
      </View>
    </View>
  );
}

// Backward-compatible alias exports
export const InteractionSettingsCard = AccessibilityTopic;
export const AccessibilitySettingsCard = AccessibilityTopic;

const createStyles = (theme: AppTheme, isSmallScreen: boolean) =>
  StyleSheet.create({
    container: {
      width: '100%',
      gap: theme.spacing.space6,
    },
    card: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.lg,
      padding: theme.spacing.space5,
      width: '100%',
      gap: theme.spacing.space3,
      ...theme.shadows.soft,
    },
    sectionHeader: {
      gap: 4,
      marginBottom: 4,
    },
    sectionTitle: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.espressoDark,
      letterSpacing: 0.3,
    },
    sectionSubtitle: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 18,
    },
    cardsActionContainer: {
      flexDirection: isSmallScreen ? 'column' : 'row',
      alignItems: isSmallScreen ? 'stretch' : 'center',
      gap: theme.spacing.space3,
      marginTop: 4,
    },
    cardActionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      minHeight: 48,
      paddingHorizontal: theme.spacing.space4,
      paddingVertical: theme.spacing.space2,
      borderRadius: theme.rounded.default,
      borderWidth: 1,
      flex: isSmallScreen ? undefined : 1,
    },
    dismissAllButton: {
      backgroundColor: theme.colors.errorContainer,
      borderColor: theme.colors.errorContainer,
    },
    dismissAllButtonText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.onErrorContainer,
    },
    resetButton: {
      backgroundColor: theme.colors.surfaceContainerLow,
      borderColor: theme.colors.outlineVariant,
    },
    resetButtonText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    supportSection: {
      gap: theme.spacing.space3,
    },
    supportSectionTitle: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.espressoDark,
      letterSpacing: 0.4,
      marginLeft: theme.spacing.space1,
      marginBottom: 2,
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.space3,
      minHeight: 48,
    },
    settingInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
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
    titleWithBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
    },
    title: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.espressoDark,
      lineHeight: 20,
    },
    subtitle: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 16,
    },
    activeBadge: {
      backgroundColor: theme.colors.chips.success.background,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: theme.rounded.full,
    },
    activeBadgeText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.chips.success.text,
    },
    inactiveBadge: {
      backgroundColor: theme.colors.surfaceContainerHigh,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: theme.rounded.full,
    },
    inactiveBadgeText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
    },
    testContainer: {
      paddingLeft: 40 + theme.spacing.space3,
      marginTop: -4,
    },
    testButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: theme.spacing.space2,
      paddingHorizontal: theme.spacing.space3,
      borderRadius: theme.rounded.default,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surfaceContainerLow,
      alignSelf: 'flex-start',
      minHeight: 44,
    },
    testButtonSuccess: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    testButtonText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    testButtonTextSuccess: {
      color: theme.colors.onPrimary,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.outlineVariant,
      width: '100%',
      marginVertical: 4,
    },
    infoCallout: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.default,
      padding: theme.spacing.space3,
      marginTop: 4,
    },
    infoIcon: {
      marginTop: 1,
    },
    infoText: {
      flex: 1,
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      lineHeight: 17,
      color: theme.colors.onSurfaceVariant,
    },
  });
