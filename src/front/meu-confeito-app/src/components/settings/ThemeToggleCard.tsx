import { useMemo } from 'react';
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
import { AppTheme, colors, darkColors } from '@/src/theme/themes';

export function ThemeToggleCard() {
  const { theme, currentMode, isDarkMode, setMode, toggleTheme } = useThemeMode();
  const { triggerHaptic } = useSettings();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < theme.breakpoints.sm;

  const styles = useMemo(() => createStyles(theme, isSmallScreen), [theme, isSmallScreen]);

  const isLightSelected = currentMode === 'light';
  const isDarkSelected = currentMode === 'dark';

  const handleToggleTheme = () => {
    triggerHaptic('selection');
    toggleTheme();
  };

  const handleSetMode = (mode: 'light' | 'dark') => {
    triggerHaptic('selection');
    setMode(mode);
  };

  return (
    <View style={styles.card}>
      {/* Quick Switch Row */}
      <View style={styles.switchRow}>
        <View style={styles.switchInfo}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons
              name={isDarkMode ? 'weather-night' : 'weather-sunny'}
              size={22}
              color={theme.colors.primary}
            />
          </View>
          <View style={styles.textColumn}>
            <View style={styles.titleWithBadge}>
              <Text style={styles.title}>Modo Noturno</Text>
              <View style={isDarkMode ? styles.darkActiveBadge : styles.lightActiveBadge}>
                <Text style={isDarkMode ? styles.darkActiveBadgeText : styles.lightActiveBadgeText}>
                  {isDarkMode ? 'Ativado' : 'Desativado'}
                </Text>
              </View>
            </View>
            <Text style={styles.subtitle}>
              {isDarkMode
                ? 'Paleta espresso escura com contrastes em calda rosa'
                : 'Paleta blush-cream artesanal com detalhes em pergaminho'}
            </Text>
          </View>
        </View>

        <Switch
          value={isDarkMode}
          onValueChange={handleToggleTheme}
          thumbColor={isDarkMode ? theme.colors.primary : theme.colors.surfaceContainerHighest}
          trackColor={{
            false: theme.colors.outlineVariant,
            true: theme.colors.primaryContainer,
          }}
          accessibilityRole="switch"
          accessibilityLabel="Alternar entre modo claro e modo escuro"
        />
      </View>

      <View style={styles.divider} />

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

      {/* Info Callout */}
      <View style={styles.infoCallout}>
        <MaterialCommunityIcons
          name="information-outline"
          size={18}
          color={theme.colors.primary}
          style={styles.infoIcon}
        />
        <Text style={styles.infoText}>
          Sua preferência de tema é salva com segurança no dispositivo e aplicada automaticamente em
          todas as fichas técnicas, tabelas e menus.
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
      padding: theme.spacing.space5,
      width: '100%',
      ...theme.shadows.soft,
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.space3,
      minHeight: 48,
    },
    switchInfo: {
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
    lightActiveBadge: {
      backgroundColor: theme.colors.chips.secondary.background,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: theme.rounded.full,
    },
    lightActiveBadgeText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.chips.secondary.text,
    },
    darkActiveBadge: {
      backgroundColor: theme.colors.chips.primary.background,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: theme.rounded.full,
    },
    darkActiveBadgeText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.chips.primary.text,
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
      backgroundColor: darkColors.background,
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
