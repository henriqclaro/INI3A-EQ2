import { useMemo } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

import { router } from 'expo-router';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { MenuOptionButton, ThemeSwitch } from '@/src/components/common';
import { useSettings } from '@/src/contexts/SettingsContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme, colors, darkColors } from '@/src/theme/themes';

export function AppearanceTopic() {
  const {
    theme,
    currentMode,
    isDarkMode,
    isFollowSystem,
    isHighContrast,
    isPureBlack,
    isPureBlackAvailable,
    isUseDeviceFont,
    setMode,
    toggleFollowSystem,
    toggleHighContrast,
    togglePureBlack,
    toggleUseDeviceFont,
  } = useThemeMode();
  const { triggerHaptic } = useSettings();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < theme.breakpoints.sm;
  const isMobileDevice = Platform.OS !== 'web' || width < theme.breakpoints.md;

  const styles = useMemo(
    () => createStyles(theme, isSmallScreen, isPureBlack && isPureBlackAvailable),
    [theme, isSmallScreen, isPureBlack, isPureBlackAvailable],
  );

  const isLightSelected = currentMode === 'light';
  const isDarkSelected = currentMode === 'dark';

  const handleToggleFollowSystem = () => {
    triggerHaptic('selection');
    toggleFollowSystem();
  };

  const handleSetMode = (mode: 'light' | 'dark') => {
    triggerHaptic('selection');
    setMode(mode);
  };

  const handleToggleHighContrast = () => {
    toggleHighContrast();
  };

  const handleTogglePureBlack = () => {
    if (isPureBlackAvailable) {
      togglePureBlack();
    }
  };

  const handleToggleUseDeviceFont = () => {
    triggerHaptic('selection');
    toggleUseDeviceFont();
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Option 1: Seguir o sistema (First option in Appearance section) */}
        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons
                name="lightbulb-auto-outline"
                size={22}
                color={theme.colors.primary}
              />
            </View>
            <View style={styles.textColumn}>
              <View style={styles.titleWithBadge}>
                <Text style={styles.title}>Seguir o Sistema</Text>
                <View style={isFollowSystem ? styles.activeBadge : styles.inactiveBadge}>
                  <Text style={isFollowSystem ? styles.activeBadgeText : styles.inactiveBadgeText}>
                    {isFollowSystem ? 'Ativado' : 'Desativado'}
                  </Text>
                </View>
              </View>
              <Text style={styles.subtitle}>
                Sincroniza automaticamente a aparência clara ou escura com o tema do seu dispositivo
              </Text>
            </View>
          </View>

          <ThemeSwitch
            value={isFollowSystem}
            onValueChange={handleToggleFollowSystem}
            accessibilityLabel="Alternar opção de seguir o sistema operacional"
          />
        </View>

        <View style={styles.divider} />

        {/* Visual Theme Selector Tiles */}
        <Text style={styles.selectorLabel}>
          {isFollowSystem ? 'Aparência ativa no sistema:' : 'Escolha visual preferida:'}
        </Text>

        <View style={styles.tilesContainer}>
          {/* Light Mode Tile */}
          <TouchableOpacity
            style={[styles.themeTile, isLightSelected && styles.themeTileActive]}
            onPress={() => handleSetMode('light')}
            accessibilityRole="radio"
            accessibilityState={{ selected: isLightSelected }}
            accessibilityLabel="Selecionar modo claro artesanal"
            activeOpacity={0.8}
          >
            <View style={styles.tileHeader}>
              <View style={[styles.tileIconCircle, isLightSelected && styles.tileIconCircleActive]}>
                <MaterialCommunityIcons
                  name="weather-sunny"
                  size={20}
                  color={isLightSelected ? theme.colors.onPrimary : theme.colors.primary}
                />
              </View>
              <MaterialCommunityIcons
                name={isLightSelected ? 'radiobox-marked' : 'radiobox-blank'}
                size={20}
                color={isLightSelected ? theme.colors.primary : theme.colors.placeholder}
              />
            </View>

            <Text style={styles.tileTitle}>Modo Claro</Text>
            <Text style={styles.tileDescription}>Blush-cream suave com pergaminho</Text>

            {/* Palette Swatches */}
            <View style={styles.swatchRow}>
              <View style={[styles.swatchDot, styles.swatchLight1]} />
              <View style={[styles.swatchDot, styles.swatchLight2]} />
              <View style={[styles.swatchDot, styles.swatchLight3]} />
            </View>
          </TouchableOpacity>

          {/* Dark Mode Tile */}
          <TouchableOpacity
            style={[styles.themeTile, isDarkSelected && styles.themeTileActive]}
            onPress={() => handleSetMode('dark')}
            accessibilityRole="radio"
            accessibilityState={{ selected: isDarkSelected }}
            accessibilityLabel="Selecionar modo escuro aconchegante"
            activeOpacity={0.8}
          >
            <View style={styles.tileHeader}>
              <View style={[styles.tileIconCircle, isDarkSelected && styles.tileIconCircleActive]}>
                <MaterialCommunityIcons
                  name="weather-night"
                  size={20}
                  color={isDarkSelected ? theme.colors.onPrimary : theme.colors.primary}
                />
              </View>
              <MaterialCommunityIcons
                name={isDarkSelected ? 'radiobox-marked' : 'radiobox-blank'}
                size={20}
                color={isDarkSelected ? theme.colors.primary : theme.colors.placeholder}
              />
            </View>

            <Text style={styles.tileTitle}>Modo Escuro</Text>
            <Text style={styles.tileDescription}>Espresso profundo com calda rosa</Text>

            {/* Palette Swatches */}
            <View style={styles.swatchRow}>
              <View style={[styles.swatchDot, styles.swatchDark1]} />
              <View style={[styles.swatchDot, styles.swatchDark2]} />
              <View style={[styles.swatchDot, styles.swatchDark3]} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* High Contrast Mode Toggle */}
        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="contrast-box" size={22} color={theme.colors.primary} />
            </View>
            <View style={styles.textColumn}>
              <View style={styles.titleWithBadge}>
                <Text style={styles.title}>Modo Alto Contraste</Text>
                <View style={isHighContrast ? styles.activeBadge : styles.inactiveBadge}>
                  <Text style={isHighContrast ? styles.activeBadgeText : styles.inactiveBadgeText}>
                    {isHighContrast ? 'Ativado' : 'Desativado'}
                  </Text>
                </View>
              </View>
              <Text style={styles.subtitle}>
                Reforça bordas e contraste visual para máxima legibilidade e acessibilidade
              </Text>
            </View>
          </View>

          <ThemeSwitch
            value={isHighContrast}
            onValueChange={handleToggleHighContrast}
            accessibilityLabel="Alternar modo de alto contraste"
          />
        </View>

        <View style={styles.divider} />

        {/* OLED / Pure Black Mode Toggle */}
        <View style={[styles.toggleRow, !isPureBlackAvailable && styles.toggleRowDisabled]}>
          <View style={styles.toggleInfo}>
            <View style={[styles.iconCircle, !isPureBlackAvailable && styles.iconCircleDisabled]}>
              <MaterialCommunityIcons
                name="lightbulb-night-outline"
                size={22}
                color={isPureBlackAvailable ? theme.colors.primary : theme.colors.placeholder}
              />
            </View>
            <View style={styles.textColumn}>
              <View style={styles.titleWithBadge}>
                <Text style={[styles.title, !isPureBlackAvailable && styles.titleDisabled]}>
                  Preto Puro (OLED)
                </Text>
                <View
                  style={
                    !isPureBlackAvailable
                      ? styles.unavailableBadge
                      : isPureBlack
                        ? styles.activeBadge
                        : styles.inactiveBadge
                  }
                >
                  <Text
                    style={
                      !isPureBlackAvailable
                        ? styles.unavailableBadgeText
                        : isPureBlack
                          ? styles.activeBadgeText
                          : styles.inactiveBadgeText
                    }
                  >
                    {!isPureBlackAvailable
                      ? 'Indisponível'
                      : isPureBlack
                        ? 'Ativado'
                        : 'Desativado'}
                  </Text>
                </View>
              </View>
              <Text style={[styles.subtitle, !isPureBlackAvailable && styles.subtitleDisabled]}>
                {!isDarkMode
                  ? 'Disponível apenas no Modo Escuro (economiza bateria em telas OLED)'
                  : isHighContrast
                    ? 'Indisponível enquanto o Modo Alto Contraste estiver ativado'
                    : 'Substitui o fundo espresso por preto puro (#000000) para economizar bateria em telas OLED'}
              </Text>
            </View>
          </View>

          <ThemeSwitch
            value={isPureBlack && isPureBlackAvailable}
            disabled={!isPureBlackAvailable}
            onValueChange={handleTogglePureBlack}
            accessibilityLabel="Alternar modo preto puro para economia de bateria em telas OLED"
          />
        </View>

        {/* Info Callout */}
        <View style={styles.infoCallout}>
          <MaterialCommunityIcons
            name="information-outline"
            size={18}
            color={theme.colors.primary}
            style={styles.infoIcon}
          />
          <Text style={styles.infoText}>
            Suas preferências visuais são salvas com segurança no dispositivo e aplicadas
            automaticamente em todas as fichas técnicas, tabelas e menus.
          </Text>
        </View>
      </View>

      {/* Device System Font Option (Mobile Only) */}
      {isMobileDevice && (
        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="format-font" size={22} color={theme.colors.primary} />
              </View>
              <View style={styles.textColumn}>
                <View style={styles.titleWithBadge}>
                  <Text style={styles.title}>Fonte do Dispositivo</Text>
                  <View style={isUseDeviceFont ? styles.activeBadge : styles.inactiveBadge}>
                    <Text
                      style={isUseDeviceFont ? styles.activeBadgeText : styles.inactiveBadgeText}
                    >
                      {isUseDeviceFont ? 'Ativado' : 'Desativado'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.subtitle}>
                  Substitui as fontes customizadas pela tipografia padrão do seu dispositivo
                </Text>
              </View>
            </View>

            <ThemeSwitch
              value={isUseDeviceFont}
              onValueChange={handleToggleUseDeviceFont}
              accessibilityLabel="Alternar uso da fonte padrão do dispositivo"
            />
          </View>
        </View>
      )}

      {/* Accessibility Shortcut (outside container, same as AboutAppTopic.tsx) */}
      <View style={styles.supportSection}>
        <Text style={styles.supportSectionTitle}>Acessibilidade</Text>
        <MenuOptionButton
          title="Central de Acessibilidade"
          subtitle="Gerencie cards de ajuda, retorno tátil e gestos de navegação"
          icon="wheelchair-accessibility"
          onPress={() => router.push('/settings?topic=accessibility')}
        />
      </View>
    </View>
  );
}

const createStyles = (theme: AppTheme, isSmallScreen: boolean, isOledActive: boolean) =>
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
    selectorLabel: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: theme.spacing.space3,
    },
    tilesContainer: {
      flexDirection: isSmallScreen ? 'column' : 'row',
      gap: theme.spacing.space3,
      width: '100%',
    },
    themeTile: {
      flex: 1,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1.5,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.md,
      padding: theme.spacing.space4,
      minHeight: 120,
      justifyContent: 'space-between',
    },
    themeTileActive: {
      backgroundColor: theme.colors.surfaceContainer,
      borderColor: theme.colors.primary,
      ...theme.shadows.glow,
    },
    tileHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.space2,
    },
    tileIconCircle: {
      width: 36,
      height: 36,
      borderRadius: theme.rounded.sm,
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tileIconCircleActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    tileTitle: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.espressoDark,
      marginTop: 2,
    },
    tileDescription: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
      lineHeight: 16,
    },
    swatchRow: {
      flexDirection: 'row',
      gap: 6,
      marginTop: theme.spacing.space3,
      alignItems: 'center',
    },
    swatchDot: {
      width: 18,
      height: 18,
      borderRadius: theme.rounded.full,
      borderWidth: 1,
    },
    swatchLight1: {
      backgroundColor: colors.background,
      borderColor: colors.outlineVariant,
    },
    swatchLight2: {
      backgroundColor: colors.primary,
      borderColor: colors.outlineVariant,
    },
    swatchLight3: {
      backgroundColor: colors.parchment,
      borderColor: colors.outlineVariant,
    },
    swatchDark1: {
      backgroundColor: isOledActive ? theme.colors.background : darkColors.background,
      borderColor: darkColors.outlineVariant,
    },
    swatchDark2: {
      backgroundColor: darkColors.primary,
      borderColor: darkColors.outlineVariant,
    },
    swatchDark3: {
      backgroundColor: darkColors.espressoDark,
      borderColor: darkColors.outlineVariant,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.outlineVariant,
      marginVertical: theme.spacing.space4,
    },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.space3,
      minHeight: 48,
    },
    toggleRowDisabled: {
      opacity: 0.6,
    },
    toggleInfo: {
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
    iconCircleDisabled: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderColor: theme.colors.outlineVariant,
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
    titleDisabled: {
      color: theme.colors.onSurfaceVariant,
    },
    subtitle: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 18,
    },
    subtitleDisabled: {
      color: theme.colors.placeholder,
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
    unavailableBadge: {
      backgroundColor: theme.colors.surfaceContainerHigh,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: theme.rounded.full,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    unavailableBadgeText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      fontWeight: '500',
      color: theme.colors.placeholder,
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
    container: {
      width: '100%',
      gap: theme.spacing.space6,
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
  });

export const ThemeToggleCard = AppearanceTopic;
