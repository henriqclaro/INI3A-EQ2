import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

import { MaterialSymbol, ThemeSwitch } from '@/src/components/common';
import { PriceDecimalPlaces, useSettings } from '@/src/contexts/SettingsContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';
import { MaterialSymbolName } from '@/src/types/materialSymbols';

interface PreferenceItemConfig {
  id: string;
  icon: MaterialSymbolName;
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

interface PrecisionOption {
  value: PriceDecimalPlaces;
  title: string;
  badge: string;
  subtitle: string;
  preview: string;
}

const PRECISION_OPTIONS: PrecisionOption[] = [
  {
    value: 2,
    title: '2 casas',
    badge: 'Comercial',
    subtitle: 'Formato padrão com centavos arredondados',
    preview: 'R$ 0,12',
  },
  {
    value: 3,
    title: '3 casas',
    badge: 'Intermediário',
    subtitle: 'Equilíbrio entre detalhe e visual limpo',
    preview: 'R$ 0,123',
  },
  {
    value: 4,
    title: '4 casas',
    badge: 'Alta Precisão (Padrão)',
    subtitle: 'Máxima exatidão para insumos fracionados',
    preview: 'R$ 0,1234',
  },
];

export interface OperationalPreferencesTopicProps {
  targetSection?: string;
  onScrollToSection?: (yOffset: number) => void;
}

export function OperationalPreferencesTopic({
  targetSection,
  onScrollToSection,
}: OperationalPreferencesTopicProps = {}) {
  const { theme } = useThemeMode();
  const {
    priceDecimalPlaces,
    setPriceDecimalPlaces,
    triggerHaptic,
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
        icon: 'calculate',
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
        icon: 'trending_up',
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
        icon: 'manage_accounts',
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
        icon: 'inventory_2',
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

  const handleSelectDecimalPlaces = (places: PriceDecimalPlaces) => {
    triggerHaptic('selection');
    setPriceDecimalPlaces(places);
  };

  const cardYRef = useRef(0);
  const precisionYRef = useRef(0);
  const hasTriggeredScrollRef = useRef(false);
  const [isHighlighted, setIsHighlighted] = useState(false);

  const checkAndScroll = useCallback(() => {
    if (
      (targetSection === 'decimals' || targetSection === 'price-precision') &&
      !hasTriggeredScrollRef.current &&
      onScrollToSection &&
      precisionYRef.current > 0
    ) {
      hasTriggeredScrollRef.current = true;
      setIsHighlighted(true);
      requestAnimationFrame(() => {
        const targetY = Math.max(0, cardYRef.current + precisionYRef.current - 24);
        onScrollToSection(targetY);
      });

      const timer = setTimeout(() => {
        setIsHighlighted(false);
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [targetSection, onScrollToSection]);

  useEffect(() => {
    if (targetSection === 'decimals' || targetSection === 'price-precision') {
      hasTriggeredScrollRef.current = false;
      const cleanup = checkAndScroll();
      return cleanup;
    }
  }, [targetSection, checkAndScroll]);

  return (
    <View
      style={styles.card}
      onLayout={(e) => {
        cardYRef.current = e.nativeEvent.layout.y;
        checkAndScroll();
      }}
    >
      {preferences.map((pref, index) => {
        const isLastItem = index === preferences.length - 1;

        return (
          <View key={pref.id}>
            <View style={styles.itemContainer}>
              {/* Header Row: Icon, Title/Subtitle, Switch */}
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <View style={styles.iconCircle}>
                    <MaterialSymbol name={pref.icon} size={22} color={theme.colors.primary} />
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
        <MaterialSymbol
          name="info"
          size={18}
          color={theme.colors.primary}
          style={styles.infoIcon}
        />
        <Text style={styles.infoText}>
          Quando ativados, esses valores serão inseridos como padrão ao criar novas receitas. Se uma
          opção estiver desativada, o campo correspondente ficará vazio na ficha técnica.
        </Text>
      </View>

      <View style={styles.sectionDivider} />

      {/* Pricing Display Decimal Places Section */}
      <View
        onLayout={(e) => {
          precisionYRef.current = e.nativeEvent.layout.y;
          checkAndScroll();
        }}
        style={[styles.precisionSection, isHighlighted && styles.precisionSectionHighlighted]}
      >
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <View style={styles.iconCircle}>
              <MaterialSymbol name="decimal_increase" size={22} color={theme.colors.primary} />
            </View>
            <View style={styles.textColumn}>
              <View style={styles.titleWithBadge}>
                <Text style={styles.title}>Casas Decimais em Precificações</Text>
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>{priceDecimalPlaces} casas</Text>
                </View>
                {isHighlighted && (
                  <View style={styles.highlightBadge}>
                    <Text style={styles.highlightBadgeText}>Em Destaque</Text>
                  </View>
                )}
              </View>
              <Text style={styles.subtitle}>
                Controle a quantidade de casas decimais na exibição de preços e custos unitários
                (especialmente no estoque).
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.selectorLabel}>Exibição visual de custos e preços:</Text>

        <View style={styles.precisionTilesContainer}>
          {PRECISION_OPTIONS.map((option) => {
            const isSelected = priceDecimalPlaces === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.precisionTile, isSelected && styles.precisionTileActive]}
                onPress={() => handleSelectDecimalPlaces(option.value)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${option.title} (${option.badge}): exemplo ${option.preview}`}
                activeOpacity={0.8}
              >
                <View style={styles.precisionTileHeader}>
                  <View style={styles.precisionTileTitleRow}>
                    <MaterialSymbol
                      name={isSelected ? 'radio_button_checked' : 'radio_button_unchecked'}
                      size={20}
                      color={isSelected ? theme.colors.primary : theme.colors.placeholder}
                    />
                    <Text
                      style={[
                        styles.precisionTileTitle,
                        isSelected && styles.precisionTileTitleActive,
                      ]}
                    >
                      {option.title}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.precisionOptionBadge,
                      isSelected && styles.precisionOptionBadgeActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.precisionOptionBadgeText,
                        isSelected && styles.precisionOptionBadgeTextActive,
                      ]}
                    >
                      {option.badge}
                    </Text>
                  </View>
                </View>

                <View style={styles.precisionPreviewContainer}>
                  <Text style={styles.precisionPreviewLabel}>Exemplo:</Text>
                  <Text
                    style={[
                      styles.precisionPreviewValue,
                      isSelected && styles.precisionPreviewValueActive,
                    ]}
                  >
                    {option.preview}
                  </Text>
                </View>

                <Text style={styles.precisionTileDescription}>{option.subtitle}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Visual-only reassurance callout */}
        <View style={styles.precisionCallout}>
          <MaterialSymbol
            name="verified_user"
            size={18}
            color={theme.colors.primary}
            style={styles.infoIcon}
          />
          <Text style={styles.precisionCalloutText}>
            <Text style={styles.precisionCalloutBold}>Aviso de precisão: </Text>
            Esta alteração é exclusivamente visual para facilitar a leitura. Todos os cálculos
            internos, custos médios de estoque e fichas técnicas continuam sendo processados e
            armazenados com alta precisão matemática no sistema.
          </Text>
        </View>
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
    sectionDivider: {
      height: 1,
      backgroundColor: theme.colors.outlineVariant,
      marginVertical: theme.spacing.space5,
    },
    precisionSection: {
      gap: theme.spacing.space3,
      borderRadius: theme.rounded.md,
      padding: 0,
    },
    precisionSectionHighlighted: {
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1.5,
      borderColor: theme.colors.primary,
      padding: theme.spacing.space3,
      borderRadius: theme.rounded.md,
      ...theme.shadows.glow,
    },
    highlightBadge: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: theme.rounded.full,
    },
    highlightBadgeText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 10,
      fontWeight: '700',
      color: theme.colors.onPrimary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    selectorLabel: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginTop: theme.spacing.space2,
    },
    precisionTilesContainer: {
      flexDirection: isSmallScreen ? 'column' : 'row',
      gap: theme.spacing.space3,
      width: '100%',
    },
    precisionTile: {
      flex: 1,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1.5,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.md,
      padding: theme.spacing.space3,
      minHeight: 48,
      justifyContent: 'space-between',
      gap: theme.spacing.space2,
      overflow: 'hidden',
    },
    precisionTileActive: {
      backgroundColor: theme.colors.surfaceContainer,
      borderColor: theme.colors.primary,
      ...theme.shadows.glow,
    },
    precisionTileHeader: {
      flexDirection: isSmallScreen ? 'row' : 'column',
      alignItems: isSmallScreen ? 'center' : 'flex-start',
      justifyContent: isSmallScreen ? 'space-between' : 'flex-start',
      gap: isSmallScreen ? theme.spacing.space1 : 6,
      flexWrap: isSmallScreen ? 'wrap' : 'nowrap',
      rowGap: isSmallScreen ? 4 : 0,
      minHeight: isSmallScreen ? undefined : 48,
    },
    precisionTileTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.space2,
    },
    precisionTileTitle: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.espressoDark,
    },
    precisionTileTitleActive: {
      color: theme.colors.primary,
      fontWeight: '700',
    },
    precisionOptionBadge: {
      backgroundColor: theme.colors.surfaceContainerHigh,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: theme.rounded.full,
      maxWidth: '100%',
      alignSelf: 'flex-start',
    },
    precisionOptionBadgeActive: {
      backgroundColor: theme.colors.chips.primary.background,
    },
    precisionOptionBadgeText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 10,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
    },
    precisionOptionBadgeTextActive: {
      color: theme.colors.chips.primary.text,
    },
    precisionPreviewContainer: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 6,
      backgroundColor: theme.colors.surfaceContainerLowest,
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: theme.rounded.sm,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    precisionPreviewLabel: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
    },
    precisionPreviewValue: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.espressoDark,
    },
    precisionPreviewValueActive: {
      color: theme.colors.primary,
    },
    precisionTileDescription: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 15,
    },
    precisionCallout: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.default,
      padding: theme.spacing.space3,
      marginTop: theme.spacing.space2,
      gap: theme.spacing.space3,
    },
    precisionCalloutText: {
      flex: 1,
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      lineHeight: 18,
      color: theme.colors.onSurfaceVariant,
    },
    precisionCalloutBold: {
      fontWeight: '700',
      color: theme.colors.espressoDark,
    },
  });

export const OperationalPreferencesCard = OperationalPreferencesTopic;
