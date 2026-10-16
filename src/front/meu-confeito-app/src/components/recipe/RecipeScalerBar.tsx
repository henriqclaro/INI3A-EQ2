import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useSettings } from '@/src/contexts/SettingsContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';

export interface RecipeScalerBarProps {
  baseYield: number;
  yieldUnit: string;
  scaleFactor: number;
  onScaleChange: (newScale: number) => void;
}

const PRESET_SCALES = [0.5, 1, 1.5, 2, 3];

export function RecipeScalerBar({
  baseYield,
  yieldUnit,
  scaleFactor,
  onScaleChange,
}: RecipeScalerBarProps) {
  const { theme } = useThemeMode();
  const { triggerHaptic } = useSettings();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const calculatedYield = useMemo(() => {
    const raw = baseYield * scaleFactor;
    return Number.isInteger(raw) ? raw : parseFloat(raw.toFixed(1));
  }, [baseYield, scaleFactor]);

  const handleSelectScale = (scale: number) => {
    triggerHaptic('selection');
    onScaleChange(scale);
  };

  const handleStepScale = (delta: number) => {
    const next = Math.max(0.25, parseFloat((scaleFactor + delta).toFixed(2)));
    triggerHaptic('selection');
    onScaleChange(next);
  };

  const isCustomScale = !PRESET_SCALES.includes(scaleFactor);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <MaterialCommunityIcons name="scale" size={18} color={theme.colors.primary} />
          <Text style={styles.title}>Multiplicador de Receita</Text>
        </View>

        <View style={styles.yieldBadge}>
          <Text style={styles.yieldBadgeText}>
            Rende {calculatedYield} {yieldUnit || 'UN'} ({scaleFactor}x)
          </Text>
        </View>
      </View>

      <View style={styles.presetsRow}>
        {PRESET_SCALES.map((preset) => {
          const isSelected = scaleFactor === preset;
          return (
            <TouchableOpacity
              key={preset}
              style={[styles.presetChip, isSelected && styles.presetChipActive]}
              onPress={() => handleSelectScale(preset)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`Escalar receita para ${preset} vezes`}
            >
              <Text style={[styles.presetChipText, isSelected && styles.presetChipTextActive]}>
                {preset === 1 ? '1x (Padrão)' : `${preset}x`}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Fine Stepper for Custom Scaling */}
      <View style={styles.stepperRow}>
        <Text style={styles.stepperLabel}>
          Ajuste fino:
          {isCustomScale ? (
            <Text style={styles.customBadge}> {scaleFactor}x personalizado</Text>
          ) : null}
        </Text>

        <View style={styles.stepperControls}>
          <TouchableOpacity
            style={styles.stepBtn}
            onPress={() => handleStepScale(-0.25)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Diminuir rendimento em 0.25 vezes"
          >
            <MaterialCommunityIcons name="minus" size={18} color={theme.colors.onSurface} />
          </TouchableOpacity>

          <View style={styles.scaleDisplay}>
            <Text style={styles.scaleDisplayText}>{scaleFactor}x</Text>
          </View>

          <TouchableOpacity
            style={styles.stepBtn}
            onPress={() => handleStepScale(0.25)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Aumentar rendimento em 0.25 vezes"
          >
            <MaterialCommunityIcons name="plus" size={18} color={theme.colors.onSurface} />
          </TouchableOpacity>

          {scaleFactor !== 1 && (
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={() => handleSelectScale(1)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Redefinir para rendimento original"
            >
              <MaterialCommunityIcons name="refresh" size={16} color={theme.colors.primary} />
              <Text style={styles.resetBtnText}>Redefinir</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.lg,
      padding: 14,
      marginBottom: 16,
      gap: 12,
      ...theme.shadows.soft,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 8,
    },
    titleGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    title: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.espressoDark,
    },
    yieldBadge: {
      backgroundColor: theme.colors.primaryFixed,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: theme.rounded.full,
    },
    yieldBadgeText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.onPrimaryFixed,
    },
    presetsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    presetChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: theme.rounded.full,
      backgroundColor: theme.colors.surfaceContainer,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      minHeight: 48,
      justifyContent: 'center',
      alignItems: 'center',
    },
    presetChipActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    presetChipText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
    },
    presetChipTextActive: {
      color: theme.colors.onPrimary,
    },
    stepperRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 10,
      paddingTop: 4,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
    },
    stepperLabel: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
    customBadge: {
      fontWeight: '700',
      color: theme.colors.primary,
    },
    stepperControls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    stepBtn: {
      width: 48,
      height: 48,
      borderRadius: theme.rounded.default,
      backgroundColor: theme.colors.surfaceContainer,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scaleDisplay: {
      minWidth: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scaleDisplayText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.espressoDark,
    },
    resetBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      minHeight: 48,
      justifyContent: 'center',
    },
    resetBtnText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.primary,
    },
  });
