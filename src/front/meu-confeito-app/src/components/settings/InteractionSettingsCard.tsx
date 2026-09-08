import { useMemo, useState } from 'react';
import {
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useSettings } from '@/src/contexts/SettingsContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';

export function InteractionSettingsCard() {
  const { theme } = useThemeMode();
  const {
    isSwipeNavigationEnabled,
    isHapticsEnabled,
    toggleSwipeNavigation,
    toggleHaptics,
    triggerHaptic,
  } = useSettings();

  const { width } = useWindowDimensions();
  const isSmallScreen = width < theme.breakpoints.sm;
  const styles = useMemo(() => createStyles(theme, isSmallScreen), [theme, isSmallScreen]);

  const [hasTestedHaptic, setHasTestedHaptic] = useState(false);

  const handleTestHaptic = () => {
    triggerHaptic('medium');
    setHasTestedHaptic(true);
    setTimeout(() => {
      setHasTestedHaptic(false);
    }, 1200);
  };

  return (
    <View style={styles.card}>
      {/* Setting 1: Swipe Navigation */}
      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons
              name="gesture-swipe-horizontal"
              size={22}
              color={theme.colors.primary}
            />
          </View>
          <View style={styles.textColumn}>
            <View style={styles.titleWithBadge}>
              <Text style={styles.title}>Navegação por Gesto</Text>
              <View style={isSwipeNavigationEnabled ? styles.activeBadge : styles.inactiveBadge}>
                <Text
                  style={
                    isSwipeNavigationEnabled ? styles.activeBadgeText : styles.inactiveBadgeText
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

        <Switch
          value={isSwipeNavigationEnabled}
          onValueChange={toggleSwipeNavigation}
          thumbColor={
            isSwipeNavigationEnabled ? theme.colors.primary : theme.colors.surfaceContainerHighest
          }
          trackColor={{
            false: theme.colors.outlineVariant,
            true: theme.colors.primaryContainer,
          }}
          accessibilityRole="switch"
          accessibilityLabel="Ativar ou desativar navegação por gesto de deslize"
        />
      </View>

      <View style={styles.divider} />

      {/* Setting 2: Global Haptic Feedback */}
      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="vibrate" size={22} color={theme.colors.primary} />
          </View>
          <View style={styles.textColumn}>
            <View style={styles.titleWithBadge}>
              <Text style={styles.title}>Retorno Tátil Global</Text>
              <View style={isHapticsEnabled ? styles.activeBadge : styles.inactiveBadge}>
                <Text style={isHapticsEnabled ? styles.activeBadgeText : styles.inactiveBadgeText}>
                  {isHapticsEnabled ? 'Ativado' : 'Desativado'}
                </Text>
              </View>
            </View>
            <Text style={styles.subtitle}>
              Vibrações sutis ao mudar de aba, alternar opções e confirmar ações em todo o app
            </Text>
          </View>
        </View>

        <Switch
          value={isHapticsEnabled}
          onValueChange={toggleHaptics}
          thumbColor={
            isHapticsEnabled ? theme.colors.primary : theme.colors.surfaceContainerHighest
          }
          trackColor={{
            false: theme.colors.outlineVariant,
            true: theme.colors.primaryContainer,
          }}
          accessibilityRole="switch"
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
            <MaterialCommunityIcons
              name={hasTestedHaptic ? 'check-circle-outline' : 'cellphone-wireless'}
              size={18}
              color={hasTestedHaptic ? theme.colors.onPrimary : theme.colors.primary}
            />
            <Text style={[styles.testButtonText, hasTestedHaptic && styles.testButtonTextSuccess]}>
              {hasTestedHaptic ? 'Vibração disparada!' : 'Testar vibração no aparelho'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Info Callout */}
      <View style={styles.infoCallout}>
        <MaterialCommunityIcons
          name="information-outline"
          size={18}
          color={theme.colors.primary}
          style={styles.infoIcon}
        />
        <Text style={styles.infoText}>
          Essas preferências são salvas de forma segura no seu dispositivo e têm efeito imediato em
          toda a navegação e controles interativos.
        </Text>
      </View>
    </View>
  );
}

const createStyles = (theme: AppTheme, _isSmallScreen: boolean) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.lg,
      padding: theme.spacing.space5,
      width: '100%',
      ...theme.shadows.soft,
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
      width: 44,
      height: 44,
      borderRadius: theme.rounded.default,
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
      gap: theme.spacing.space2,
    },
    title: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.espressoDark,
    },
    activeBadge: {
      backgroundColor: theme.colors.chips.primary.background,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: theme.rounded.full,
    },
    activeBadgeText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.chips.primary.text,
    },
    inactiveBadge: {
      backgroundColor: theme.colors.chips.secondary.background,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: theme.rounded.full,
    },
    inactiveBadgeText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.chips.secondary.text,
    },
    subtitle: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 18,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.outlineVariant,
      marginVertical: theme.spacing.space4,
    },
    testContainer: {
      marginTop: theme.spacing.space3,
      alignItems: 'flex-start',
    },
    testButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.space2,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.full,
      paddingHorizontal: theme.spacing.space4,
      paddingVertical: theme.spacing.space2,
      minHeight: 48,
    },
    testButtonSuccess: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    testButtonText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    testButtonTextSuccess: {
      color: theme.colors.onPrimary,
    },
    infoCallout: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.default,
      padding: theme.spacing.space3,
      marginTop: theme.spacing.space4,
      gap: theme.spacing.space3,
    },
    infoIcon: {
      marginTop: 2,
    },
    infoText: {
      flex: 1,
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      lineHeight: 18,
      color: theme.colors.onSurfaceVariant,
    },
  });
