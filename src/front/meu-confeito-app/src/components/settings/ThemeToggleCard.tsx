import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { ThemeSwitch } from '@/src/components/ThemeSwitch';
import { useSettings } from '@/src/contexts/SettingsContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme, colors, darkColors } from '@/src/theme/themes';

export function ThemeToggleCard() {
  const {
    theme,
    currentMode,
    isDarkMode,
    isHighContrast,
    isPureBlack,
    isPureBlackAvailable,
    setMode,
    toggleHighContrast,
    togglePureBlack,
  } = useThemeMode();
  const { triggerHaptic } = useSettings();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < theme.breakpoints.sm;

  const styles = useMemo(
    () => createStyles(theme, isSmallScreen, isPureBlack && isPureBlackAvailable),
    [theme, isSmallScreen, isPureBlack, isPureBlackAvailable],
  );

  const isLightSelected = currentMode === 'light';
  const isDarkSelected = currentMode === 'dark';

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

  return (
    <View style={styles.card}>
      {/* Visual Theme Selector Tiles */}
      <Text style={styles.selectorLabel}>Escolha visual preferida:</Text>

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
              name="weather-night"
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
                  {!isPureBlackAvailable ? 'Indisponível' : isPureBlack ? 'Ativado' : 'Desativado'}
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
  });
