import { ReactNode, useMemo, useState } from 'react';
import {
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';

import { MaterialSymbol } from './MaterialSymbol';

interface InputProps extends TextInputProps {
  containerStyle?: StyleProp<ViewStyle>;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  isClearable?: boolean;
  onClear?: () => void;
}

export const Input = ({
  value,
  onChangeText,
  style,
  containerStyle,
  leftIcon,
  rightIcon,
  isClearable,
  onClear,
  onFocus,
  onBlur,
  ...rest
}: InputProps) => {
  const { theme } = useThemeMode();

  const [internalValue, setInternalValue] = useState(rest.defaultValue?.toString() || '');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const isControlled = value !== undefined;
  const currentValue = isControlled ? value?.toString() || '' : internalValue;

  const handleTextChange = (text: string) => {
    if (!isControlled) {
      setInternalValue(text);
    }

    if (onChangeText) {
      onChangeText(text);
    }
  };

  const handleClear = () => {
    handleTextChange('');
    if (onClear) {
      onClear();
    }
  };

  const handleFocus = (event: Parameters<NonNullable<TextInputProps['onFocus']>>[0]) => {
    setIsFocused(true);
    if (onFocus) {
      onFocus(event);
    }
  };

  const handleBlur = (event: Parameters<NonNullable<TextInputProps['onBlur']>>[0]) => {
    setIsFocused(false);
    if (onBlur) {
      onBlur(event);
    }
  };

  const styles = useMemo(() => createStyles(theme, isFocused), [theme, isFocused]);

  const hasClearButton = Boolean(isClearable && currentValue.length > 0 && !rest.secureTextEntry);

  return (
    <View style={[styles.container, containerStyle]}>
      {leftIcon && <View style={styles.iconSlot}>{leftIcon}</View>}

      <TextInput
        value={currentValue}
        onChangeText={handleTextChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={[styles.input, style]}
        placeholderTextColor={rest.placeholderTextColor || theme.colors.placeholder}
        {...rest}
        secureTextEntry={rest.secureTextEntry && !isPasswordVisible}
      />

      {rest.secureTextEntry && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setIsPasswordVisible(!isPasswordVisible)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel={isPasswordVisible ? 'Ocultar senha' : 'Exibir senha'}
        >
          <MaterialSymbol
            name={isPasswordVisible ? 'visibility_off' : 'visibility'}
            size={22}
            color={theme.colors.onSurfaceVariant}
          />
        </TouchableOpacity>
      )}

      {hasClearButton && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleClear}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Limpar texto"
        >
          <MaterialSymbol name="cancel" size={20} color={theme.colors.placeholder} />
        </TouchableOpacity>
      )}

      {Boolean(rightIcon && !rest.secureTextEntry && !hasClearButton) && (
        <View style={styles.iconSlot}>{rightIcon}</View>
      )}
    </View>
  );
};

const createStyles = (theme: AppTheme, isFocused: boolean) =>
  StyleSheet.create({
    container: {
      width: 275,
      minHeight: theme.spacing.touchable,
      height: 48,
      borderWidth: 1,
      borderColor: isFocused ? theme.colors.primary : theme.colors.outlineVariant,
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.rounded.default,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.space3,
      margin: theme.spacing.space3,
    },
    input: {
      flex: 1,
      height: '100%',
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 15,
      color: theme.colors.onSurface,
      paddingVertical: 0,
    },
    iconSlot: {
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.space2,
    },
    actionButton: {
      alignSelf: 'stretch',
      justifyContent: 'center',
      alignItems: 'center',
      paddingLeft: theme.spacing.space2,
    },
  });
