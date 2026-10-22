import { useCallback, useMemo, useState } from 'react';
import {
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { DatePickerModal, pt, registerTranslation } from 'react-native-paper-dates';

import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';
import { formatDateForDisplay, parseDateSafely } from '@/src/utils/formatters';

// Initialize Portuguese translation once
registerTranslation('pt', pt);

export interface DateInputProps {
  label?: string;
  value?: Date | string | null;
  onChangeDate: (date: Date | null) => void;
  placeholder?: string;
  helperText?: string;
  errorText?: string;
  minDate?: Date;
  maxDate?: Date;
  isDisabled?: boolean;
  isRequired?: boolean;
  isClearable?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

export const DateInput = ({
  label,
  value,
  onChangeDate,
  placeholder = 'Selecionar data...',
  helperText,
  errorText,
  minDate,
  maxDate,
  isDisabled = false,
  isRequired = false,
  isClearable = true,
  containerStyle,
  testID = 'date-input',
}: DateInputProps) => {
  const { theme } = useThemeMode();

  const parsedDate = useMemo(() => parseDateSafely(value), [value]);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Validate range if date is provided
  const rangeError = useMemo(() => {
    if (!parsedDate) return null;

    if (minDate) {
      const minBound = new Date(
        minDate.getFullYear(),
        minDate.getMonth(),
        minDate.getDate(),
        0,
        0,
        0,
      );
      if (parsedDate < minBound) {
        return `A data deve ser a partir de ${formatDateForDisplay(minDate)}.`;
      }
    }

    if (maxDate) {
      const maxBound = new Date(
        maxDate.getFullYear(),
        maxDate.getMonth(),
        maxDate.getDate(),
        23,
        59,
        59,
      );
      if (parsedDate > maxBound) {
        return `A data não pode ultrapassar ${formatDateForDisplay(maxDate)}.`;
      }
    }

    return null;
  }, [parsedDate, minDate, maxDate]);

  const hasActiveError = Boolean(errorText || rangeError);
  const displayError = errorText || rangeError;
  const hasValue = Boolean(parsedDate);
  const formattedDisplay = formatDateForDisplay(parsedDate);

  const handleOpenPicker = useCallback(() => {
    if (!isDisabled) {
      setIsPickerOpen(true);
    }
  }, [isDisabled]);

  const handleClear = useCallback(
    (e?: { stopPropagation?: () => void }) => {
      e?.stopPropagation?.();
      onChangeDate(null);
    },
    [onChangeDate],
  );

  const handleModalConfirm = useCallback(
    ({ date }: { date: Date | undefined }) => {
      setIsPickerOpen(false);
      if (date) {
        const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
        onChangeDate(normalized);
      }
    },
    [onChangeDate],
  );

  const handleModalDismiss = useCallback(() => {
    setIsPickerOpen(false);
  }, []);

  const styles = useMemo(
    () => createStyles(theme, isFocused || isPickerOpen, hasActiveError, isDisabled, hasValue),
    [theme, isFocused, isPickerOpen, hasActiveError, isDisabled, hasValue],
  );

  const displayPlaceholder =
    placeholder === 'DD/MM/AAAA' ? 'Selecionar data (DD/MM/AAAA)...' : placeholder;

  return (
    <View style={[styles.container, containerStyle]}>
      {Boolean(label) && (
        <Text style={styles.label}>
          {label} {isRequired && <Text style={styles.required}>*</Text>}
        </Text>
      )}

      {/* Button-like date selector trigger */}
      <TouchableOpacity
        testID={testID}
        style={styles.buttonTrigger}
        onPress={handleOpenPicker}
        disabled={isDisabled}
        activeOpacity={0.78}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        accessibilityRole="button"
        accessibilityLabel={
          label
            ? `${label}: ${hasValue ? formattedDisplay : 'Nenhuma data selecionada'}`
            : 'Selecionar data no calendário'
        }
        accessibilityHint="Toque para abrir o calendário e escolher uma data precisa"
      >
        {/* Leading calendar icon indicator */}
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name={hasValue ? 'calendar-check-outline' : 'calendar-month-outline'}
            size={20}
            color={
              isDisabled
                ? theme.colors.placeholder
                : hasValue
                  ? theme.colors.primary
                  : theme.colors.onSurfaceVariant
            }
          />
        </View>

        {/* Selected date / placeholder text */}
        <View style={styles.textContainer}>
          {hasValue ? (
            <View style={styles.valueRow}>
              <Text style={styles.valueText}>{formattedDisplay}</Text>
              <Text style={styles.valueHintText}>Toque para alterar</Text>
            </View>
          ) : (
            <Text style={styles.placeholderText}>{displayPlaceholder}</Text>
          )}
        </View>

        {/* Right side controls: Clear button and Trigger chevron */}
        <View style={styles.actionsContainer}>
          {isClearable && hasValue && !isDisabled && (
            <TouchableOpacity
              style={styles.btnClear}
              onPress={handleClear}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Limpar data selecionada"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons
                name="close-circle-outline"
                size={18}
                color={theme.colors.onSurfaceVariant}
              />
            </TouchableOpacity>
          )}

          <View style={styles.chevronContainer}>
            <MaterialCommunityIcons
              name="chevron-down"
              size={18}
              color={isDisabled ? theme.colors.placeholder : theme.colors.outline}
            />
          </View>
        </View>
      </TouchableOpacity>

      {hasActiveError ? (
        <Text style={styles.errorText}>{displayError}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}

      <DatePickerModal
        locale="pt"
        mode="single"
        visible={isPickerOpen}
        onDismiss={handleModalDismiss}
        date={parsedDate ?? undefined}
        onConfirm={handleModalConfirm}
        validRange={{
          startDate: minDate,
          endDate: maxDate,
        }}
        saveLabel="Confirmar"
        label="Selecione a data"
        animationType="fade"
      />
    </View>
  );
};

const createStyles = (
  theme: AppTheme,
  isActive: boolean,
  hasError: boolean,
  isDisabled: boolean,
  hasValue: boolean,
) =>
  StyleSheet.create({
    container: {
      width: '100%',
    },
    label: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.espressoDark,
      marginBottom: 6,
    },
    required: {
      color: theme.colors.primary,
    },
    buttonTrigger: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 48,
      height: 48,
      backgroundColor: isDisabled
        ? theme.colors.surfaceContainerLow
        : theme.colors.surfaceContainerLowest,
      borderRadius: theme.rounded.default,
      borderWidth: 1,
      borderColor: hasError
        ? theme.colors.error
        : isActive
          ? theme.colors.primary
          : theme.colors.outlineVariant,
      paddingLeft: 8,
      paddingRight: 10,
      gap: 10,
      ...theme.shadows.soft,
      ...Platform.select({
        web: {
          cursor: isDisabled ? ('auto' as const) : ('pointer' as const),
        },
      }),
    },
    iconContainer: {
      width: 32,
      height: 32,
      borderRadius: theme.rounded.sm,
      backgroundColor: hasValue
        ? theme.colors.surfaceContainerLow
        : theme.colors.surfaceContainerLowest,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: hasValue ? theme.colors.outlineVariant : theme.colors.outlineVariant,
    },
    textContainer: {
      flex: 1,
      justifyContent: 'center',
    },
    valueRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 8,
    },
    valueText: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.espressoDark,
      fontFamily: theme.typography.bodyMd.fontFamily,
    },
    valueHintText: {
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
      fontFamily: theme.typography.bodySm.fontFamily,
    },
    placeholderText: {
      fontSize: 14,
      color: theme.colors.placeholder,
      fontFamily: theme.typography.bodyMd.fontFamily,
    },
    actionsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    btnClear: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
    },
    chevronContainer: {
      width: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    helperText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
      marginTop: 4,
      lineHeight: 15,
    },
    errorText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 11,
      color: theme.colors.error,
      marginTop: 4,
      fontWeight: '500',
      lineHeight: 15,
    },
  });
