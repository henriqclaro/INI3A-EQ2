import { useCallback, useMemo, useState } from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
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
  placeholder = 'DD/MM/AAAA',
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
  const currentTimestamp = parsedDate?.getTime() ?? null;
  const [prevTimestamp, setPrevTimestamp] = useState<number | null>(currentTimestamp);
  const [textValue, setTextValue] = useState<string>(() => formatDateForDisplay(parsedDate));
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  // Synchronize internal text value during render when incoming parsed date changes externally
  if (currentTimestamp !== prevTimestamp) {
    setPrevTimestamp(currentTimestamp);
    setTextValue(formatDateForDisplay(parsedDate));
    setManualError(null);
  }

  const hasActiveError = Boolean(errorText || manualError);
  const displayError = errorText || manualError;
  const hasValue = Boolean(parsedDate || textValue.trim().length > 0);

  const handleTextChange = (text: string) => {
    // Only accept numeric digits and format with slashes (DD/MM/AAAA)
    const digits = text.replace(/\D/g, '').slice(0, 8);
    let formatted = digits;
    if (digits.length > 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    } else if (digits.length > 2) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }

    setTextValue(formatted);

    if (digits.length === 0) {
      setManualError(null);
      onChangeDate(null);
      return;
    }

    if (digits.length === 8) {
      const day = parseInt(digits.slice(0, 2), 10);
      const month = parseInt(digits.slice(2, 4), 10);
      const year = parseInt(digits.slice(4, 8), 10);

      if (month < 1 || month > 12) {
        setManualError('Mês inválido (01 a 12).');
        return;
      }

      const daysInMonth = new Date(year, month, 0).getDate();
      if (day < 1 || day > daysInMonth) {
        setManualError(`Dia inválido para este mês (01 a ${daysInMonth}).`);
        return;
      }

      if (year < 1900 || year > 2100) {
        setManualError('Ano inválido.');
        return;
      }

      const constructedDate = new Date(year, month - 1, day, 12, 0, 0);

      if (minDate) {
        const minBound = new Date(
          minDate.getFullYear(),
          minDate.getMonth(),
          minDate.getDate(),
          0,
          0,
          0,
        );
        if (constructedDate < minBound) {
          setManualError(`A data deve ser a partir de ${formatDateForDisplay(minDate)}.`);
          return;
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
        if (constructedDate > maxBound) {
          setManualError(`A data não pode ultrapassar ${formatDateForDisplay(maxDate)}.`);
          return;
        }
      }

      setManualError(null);
      onChangeDate(constructedDate);
    } else {
      // User is still typing
      setManualError(null);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    const digits = textValue.replace(/\D/g, '');
    if (digits.length > 0 && digits.length < 8) {
      setManualError('Data incompleta. Digite o formato DD/MM/AAAA.');
    }
  };

  const handleClear = useCallback(() => {
    setTextValue('');
    setManualError(null);
    onChangeDate(null);
  }, [onChangeDate]);

  const handleModalConfirm = useCallback(
    ({ date }: { date: Date | undefined }) => {
      setIsPickerOpen(false);
      if (date) {
        const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
        onChangeDate(normalized);
        setTextValue(formatDateForDisplay(normalized));
        setManualError(null);
      }
    },
    [onChangeDate],
  );

  const handleModalDismiss = useCallback(() => {
    setIsPickerOpen(false);
  }, []);

  const styles = useMemo(
    () => createStyles(theme, isFocused, hasActiveError, isDisabled),
    [theme, isFocused, hasActiveError, isDisabled],
  );

  return (
    <View style={[styles.container, containerStyle]}>
      {Boolean(label) && (
        <Text style={styles.label}>
          {label} {isRequired && <Text style={styles.required}>*</Text>}
        </Text>
      )}

      <View style={styles.inputWrapper}>
        <TextInput
          testID={testID}
          value={textValue}
          onChangeText={handleTextChange}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.placeholder}
          style={styles.textInput}
          editable={!isDisabled}
          keyboardType="numeric"
          maxLength={10}
          accessibilityLabel={label || 'Campo de data'}
        />

        {isClearable && hasValue && !isDisabled && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleClear}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Limpar data selecionada"
          >
            <MaterialCommunityIcons
              name="close-circle-outline"
              size={18}
              color={theme.colors.onSurfaceVariant}
            />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => !isDisabled && setIsPickerOpen(true)}
          activeOpacity={0.7}
          disabled={isDisabled}
          accessibilityRole="button"
          accessibilityLabel="Abrir calendário para selecionar data"
        >
          <MaterialCommunityIcons
            name="calendar-month-outline"
            size={22}
            color={isDisabled ? theme.colors.placeholder : theme.colors.primary}
          />
        </TouchableOpacity>
      </View>

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
        saveLabel="Salvar"
        label="Selecione a data"
        animationType="fade"
      />
    </View>
  );
};

const createStyles = (
  theme: AppTheme,
  isFocused: boolean,
  hasError: boolean,
  isDisabled: boolean,
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
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 48,
      height: 48,
      backgroundColor: isDisabled
        ? theme.colors.surfaceContainerLow
        : theme.colors.surfaceContainerLowest,
      borderRadius: theme.rounded.sm,
      borderWidth: 1,
      borderColor: hasError
        ? theme.colors.error
        : isFocused
          ? theme.colors.primary
          : theme.colors.outlineVariant,
      paddingLeft: 12,
      paddingRight: 4,
      ...theme.shadows.soft,
    },
    textInput: {
      flex: 1,
      height: 48,
      fontSize: 15,
      color: isDisabled ? theme.colors.placeholder : theme.colors.onSurface,
      fontFamily: theme.typography.bodyMd.fontFamily,
      paddingVertical: 0,
    },
    iconButton: {
      width: 48,
      height: 48,
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
