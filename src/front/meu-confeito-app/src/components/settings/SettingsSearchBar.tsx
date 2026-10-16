import { useMemo, useState } from 'react';
import { StyleProp, StyleSheet, TextInput, TouchableOpacity, View, ViewStyle } from 'react-native';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';

export interface SettingsSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  placeholder?: string;
  isAutoFocus?: boolean;
  isDisabled?: boolean;
  isDense?: boolean;
  hasShadow?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function SettingsSearchBar({
  value,
  onChangeText,
  onClear,
  placeholder = 'Buscar configurações (ex: senha, tema, cache)...',
  isAutoFocus = false,
  isDisabled = false,
  isDense = false,
  hasShadow = true,
  style,
}: SettingsSearchBarProps) {
  const { theme } = useThemeMode();
  const [isInputFocused, setIsInputFocused] = useState(false);
  const styles = useMemo(
    () => createStyles(theme, isDense, hasShadow),
    [theme, isDense, hasShadow],
  );

  const hasValue = value.length > 0;

  return (
    <View
      style={[
        styles.container,
        isInputFocused && styles.containerFocused,
        isDisabled && styles.containerDisabled,
        style,
      ]}
    >
      <MaterialCommunityIcons
        name="magnify"
        size={isDense ? 18 : 20}
        color={isInputFocused ? theme.colors.primary : theme.colors.onSurfaceVariant}
        style={styles.searchIcon}
      />

      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.placeholder}
        autoFocus={isAutoFocus}
        editable={!isDisabled}
        onFocus={() => setIsInputFocused(true)}
        onBlur={() => setIsInputFocused(false)}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        accessibilityLabel={placeholder}
      />

      {hasValue && !isDisabled && (
        <TouchableOpacity
          onPress={onClear}
          style={styles.clearButton}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Limpar campo de pesquisa"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons
            name="close-circle"
            size={isDense ? 16 : 18}
            color={theme.colors.placeholder}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const createStyles = (theme: AppTheme, isDense: boolean, hasShadow: boolean) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: isDense ? theme.rounded.md : theme.rounded.lg,
      paddingHorizontal: theme.spacing.space3,
      minHeight: isDense ? 44 : 48,
      height: isDense ? 44 : 50,
      width: '100%',
      ...(hasShadow ? theme.shadows.soft : {}),
    },
    containerFocused: {
      borderColor: theme.colors.primary,
    },
    containerDisabled: {
      opacity: 0.6,
      backgroundColor: theme.colors.surfaceContainerLow,
    },
    searchIcon: {
      marginRight: theme.spacing.space2,
    },
    input: {
      flex: 1,
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: isDense ? 13 : 14,
      color: theme.colors.onSurface,
      height: '100%',
      paddingVertical: 0,
    },
    clearButton: {
      minWidth: 32,
      minHeight: 32,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: theme.spacing.space1,
    },
  });
