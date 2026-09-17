import { useMemo } from 'react';
import { StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { ThemeSwitch } from '@/src/components/ThemeSwitch';
import { useSettings } from '@/src/contexts/SettingsContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';

interface PreferenceItemConfig {
  id: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  subtitle: string;
  unit: string;
  placeholder: string;
  hint: string;
  isEnabled: boolean;
  value: string;
  suggestedDefault: string;
  onToggle: (isEnabled: boolean) => void;
  onChangeValue: (value: string) => void;
}

export function OperationalPreferencesCard() {
  const { theme } = useThemeMode();
  const {
    isDefaultOverheadEnabled,
    defaultOverhead,
    setIsDefaultOverheadEnabled,
    setDefaultOverhead,
    isDefaultProfitMarginEnabled,
    defaultProfitMargin,
    setIsDefaultProfitMarginEnabled,
    setDefaultProfitMargin,
    isDefaultHourlyLaborEnabled,
    defaultHourlyLabor,
    setIsDefaultHourlyLaborEnabled,
    setDefaultHourlyLabor,
    isDefaultPackagingCostEnabled,
    defaultPackagingCost,
    setIsDefaultPackagingCostEnabled,
    setDefaultPackagingCost,
  } = useSettings();

  const { width } = useWindowDimensions();
  const isSmallScreen = width < theme.breakpoints.sm;
  const styles = useMemo(() => createStyles(theme, isSmallScreen), [theme, isSmallScreen]);

  const preferences: PreferenceItemConfig[] = useMemo(
    () => [
      {
        id: 'overhead',
        icon: 'calculator-variant-outline',
        title: 'Custos Fixos (Overhead)',
        subtitle: 'Percentual para cobrir despesas indiretas (água, luz, gás, aluguel)',
        unit: '%',
        placeholder: 'Ex: 10',
        hint: 'Sugerido no campo "Custos Fixos (%)" em novas receitas.',
        isEnabled: isDefaultOverheadEnabled,
        value: defaultOverhead,
        suggestedDefault: '10',
        onToggle: (isEnabled) => {
          setIsDefaultOverheadEnabled(isEnabled);
          if (isEnabled && !defaultOverhead) {
            setDefaultOverhead('10');
          }
        },
        onChangeValue: setDefaultOverhead,
      },
      {
        id: 'profitMargin',
        icon: 'trending-up',
        title: 'Margem de Lucro',
        subtitle: 'Percentual de lucro pretendido sobre os custos totais da receita',
        unit: '%',
        placeholder: 'Ex: 30',
        hint: 'Sugerido no campo "Margem de Lucro (%)" em novas receitas.',
        isEnabled: isDefaultProfitMarginEnabled,
        value: defaultProfitMargin,
        suggestedDefault: '30',
        onToggle: (isEnabled) => {
          setIsDefaultProfitMarginEnabled(isEnabled);
          if (isEnabled && !defaultProfitMargin) {
            setDefaultProfitMargin('30');
          }
        },
        onChangeValue: setDefaultProfitMargin,
      },
      {
        id: 'hourlyLabor',
        icon: 'account-clock-outline',
        title: 'Mão de Obra por Hora',
        subtitle: 'Valor da hora de trabalho para precificar o tempo de preparo',
        unit: 'R$',
        placeholder: 'Ex: 20.00',
        hint: 'Sugerido no campo "Mão de Obra / Hora (R$)" em novas receitas.',
        isEnabled: isDefaultHourlyLaborEnabled,
        value: defaultHourlyLabor,
        suggestedDefault: '20.00',
        onToggle: (isEnabled) => {
          setIsDefaultHourlyLaborEnabled(isEnabled);
          if (isEnabled && !defaultHourlyLabor) {
            setDefaultHourlyLabor('20.00');
          }
        },
        onChangeValue: setDefaultHourlyLabor,
      },
      {
        id: 'packagingCost',
        icon: 'package-variant-closed',
        title: 'Custo de Embalagem',
        subtitle: 'Valor estimado gasto com caixas, fitas, sacolas e forminhas por receita',
        unit: 'R$',
        placeholder: 'Ex: 2.50',
        hint: 'Sugerido no campo "Custo de Embalagem (R$)" em novas receitas.',
        isEnabled: isDefaultPackagingCostEnabled,
        value: defaultPackagingCost,
        suggestedDefault: '2.50',
        onToggle: (isEnabled) => {
          setIsDefaultPackagingCostEnabled(isEnabled);
          if (isEnabled && !defaultPackagingCost) {
            setDefaultPackagingCost('2.50');
          }
        },
        onChangeValue: setDefaultPackagingCost,
      },
    ],
    [
      isDefaultOverheadEnabled,
      defaultOverhead,
      setIsDefaultOverheadEnabled,
      setDefaultOverhead,
      isDefaultProfitMarginEnabled,
      defaultProfitMargin,
      setIsDefaultProfitMarginEnabled,
      setDefaultProfitMargin,
      isDefaultHourlyLaborEnabled,
      defaultHourlyLabor,
      setIsDefaultHourlyLaborEnabled,
      setDefaultHourlyLabor,
      isDefaultPackagingCostEnabled,
      defaultPackagingCost,
      setIsDefaultPackagingCostEnabled,
      setDefaultPackagingCost,
    ],
  );

  return (
    <View style={styles.card}>
      {preferences.map((pref, index) => {
        const isLastItem = index === preferences.length - 1;

        return (
          <View key={pref.id}>
            <View style={styles.itemContainer}>
              {/* Header Row: Icon, Title/Subtitle, Switch */}
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <View style={styles.iconCircle}>
                    <MaterialCommunityIcons
                      name={pref.icon}
                      size={22}
                      color={theme.colors.primary}
                    />
                  </View>
                  <View style={styles.textColumn}>
                    <View style={styles.titleWithBadge}>
                      <Text style={styles.title}>{pref.title}</Text>
                      <View style={pref.isEnabled ? styles.activeBadge : styles.inactiveBadge}>
                        <Text
                          style={pref.isEnabled ? styles.activeBadgeText : styles.inactiveBadgeText}
                        >
                          {pref.isEnabled ? 'Ativado' : 'Desativado'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.subtitle}>{pref.subtitle}</Text>
                  </View>
                </View>

                <ThemeSwitch
                  value={pref.isEnabled}
                  onValueChange={pref.onToggle}
                  accessibilityLabel={`Ativar ou desativar valor padrão para ${pref.title}`}
                />
              </View>

              {/* Conditional Input Field when Toggled On */}
              {pref.isEnabled && (
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Valor padrão sugerido</Text>
                  <View style={styles.inputFieldRow}>
                    <View style={styles.unitBadge}>
                      <Text style={styles.unitBadgeText}>{pref.unit}</Text>
                    </View>
                    <TextInput
                      style={styles.textInput}
                      value={pref.value}
                      onChangeText={pref.onChangeValue}
                      placeholder={pref.placeholder}
                      placeholderTextColor={theme.colors.placeholder}
                      keyboardType="numeric"
                      accessibilityRole="none"
                      accessibilityLabel={`Valor padrão para ${pref.title}`}
                    />
                  </View>
                  <Text style={styles.inputHint}>{pref.hint}</Text>
                </View>
              )}
            </View>

            {!isLastItem && <View style={styles.divider} />}
          </View>
        );
      })}

      {/* Info Callout */}
      <View style={styles.infoCallout}>
        <MaterialCommunityIcons
          name="information-outline"
          size={18}
          color={theme.colors.primary}
          style={styles.infoIcon}
        />
        <Text style={styles.infoText}>
          Quando ativados, esses valores serão inseridos como padrão ao criar novas receitas. Se uma
          opção estiver desativada, o campo correspondente ficará vazio na ficha técnica.
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
    itemContainer: {
      gap: theme.spacing.space3,
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
      flexWrap: 'wrap',
    },
    title: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 15,
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
    inputContainer: {
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.md,
      padding: theme.spacing.space3,
      marginTop: theme.spacing.space1,
      width: '100%',
      gap: theme.spacing.space2,
    },
    inputLabel: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
    },
    inputFieldRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.sm,
      overflow: 'hidden',
      height: 48,
    },
    unitBadge: {
      backgroundColor: theme.colors.surfaceContainerHigh,
      height: '100%',
      paddingHorizontal: theme.spacing.space3,
      justifyContent: 'center',
      alignItems: 'center',
      borderRightWidth: 1,
      borderRightColor: theme.colors.outlineVariant,
      minWidth: 44,
    },
    unitBadgeText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.espressoDark,
    },
    textInput: {
      flex: 1,
      height: '100%',
      paddingHorizontal: theme.spacing.space3,
      fontSize: 15,
      color: theme.colors.onSurface,
      fontFamily: theme.typography.bodyMd.fontFamily,
      paddingVertical: 0,
    },
    inputHint: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
      fontStyle: 'italic',
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
