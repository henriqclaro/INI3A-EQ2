import { memo, useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { MaterialSymbol } from '@/src/components/common';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';

export interface RecipeDateFilterModalProps {
  isVisible: boolean;
  selectedLimit?: number;
  onSelectLimit: (limit?: number) => void;
  onClose: () => void;
}

interface DateOption {
  label: string;
  description: string;
  value: number | undefined;
}

const DATE_OPTIONS: DateOption[] = [
  {
    label: 'Sem data (todos os tempos)',
    description: 'Exibe todas as receitas públicas sem filtro de data',
    value: undefined,
  },
  {
    label: 'Últimos 7 dias',
    description: 'Apenas receitas criadas na última semana',
    value: 7,
  },
  {
    label: 'Últimos 30 dias',
    description: 'Apenas receitas criadas no último mês',
    value: 30,
  },
];

export const RecipeDateFilterModal = memo(function RecipeDateFilterModal({
  isVisible,
  selectedLimit,
  onSelectLimit,
  onClose,
}: RecipeDateFilterModalProps) {
  const { theme } = useThemeMode();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleSelect = (val: number | undefined) => {
    onSelectLimit(val);
    onClose();
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityLabel="Fechar menu de filtro de período"
      >
        <Pressable
          style={styles.modalCard}
          onPress={(e) => e.stopPropagation()}
          accessibilityRole="none"
        >
          <View style={styles.header}>
            <View style={styles.headerIconCircle}>
              <MaterialSymbol name="event_upcoming" size={22} color={theme.colors.primary} />
            </View>
            <View style={styles.headerTextCol}>
              <Text style={styles.title}>Filtrar por Período</Text>
              <Text style={styles.subtitle}>
                Limite a busca às receitas publicadas mais recentes
              </Text>
            </View>
          </View>

          <View style={styles.optionsList}>
            {DATE_OPTIONS.map((opt) => {
              const isOptionSelected = opt.value === selectedLimit;
              return (
                <TouchableOpacity
                  key={opt.label}
                  style={[styles.optionItem, isOptionSelected && styles.optionItemSelected]}
                  onPress={() => handleSelect(opt.value)}
                  activeOpacity={0.75}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isOptionSelected }}
                  accessibilityLabel={opt.label}
                >
                  <MaterialSymbol
                    name={isOptionSelected ? 'radio_button_checked' : 'radio_button_unchecked'}
                    size={22}
                    color={isOptionSelected ? theme.colors.primary : theme.colors.onSurfaceVariant}
                  />
                  <View style={styles.optionTextCol}>
                    <Text
                      style={[styles.optionLabel, isOptionSelected && styles.optionLabelSelected]}
                    >
                      {opt.label}
                    </Text>
                    <Text style={styles.optionDescription}>{opt.description}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Fechar modal"
          >
            <Text style={styles.closeBtnText}>Fechar</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
});

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: theme.colors.backdrop,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    modalCard: {
      width: '100%',
      maxWidth: 420,
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.rounded.lg,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: 20,
      gap: 16,
      ...theme.shadows.soft,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.surfaceContainerLow,
      paddingBottom: 14,
    },
    headerIconCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.secondaryContainer,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    headerTextCol: {
      flex: 1,
      gap: 2,
    },
    title: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.espressoDark,
    },
    subtitle: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 16,
    },
    optionsList: {
      gap: 10,
    },
    optionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 52,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: theme.rounded.default,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surfaceContainerLowest,
      gap: 12,
    },
    optionItemSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.surfaceContainerLow,
    },
    optionTextCol: {
      flex: 1,
      gap: 2,
    },
    optionLabel: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.espressoDark,
    },
    optionLabelSelected: {
      color: theme.colors.primary,
    },
    optionDescription: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    closeBtn: {
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.default,
      marginTop: 4,
    },
    closeBtnText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
  });
