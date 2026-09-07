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

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useThemeMode } from '../contexts/ThemeContext';
import { AppTheme } from '../theme/themes';

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
  ...rest
}: InputProps) => {
  const { theme } = useThemeMode();

  const [internalValue, setInternalValue] = useState(rest.defaultValue?.toString() || '');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

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

  const styles = useMemo(() => createStyles(theme), [theme]);

  const hasClearButton = Boolean(isClearable && currentValue.length > 0 && !rest.secureTextEntry);

  return (
    <View style={[styles.container, containerStyle]}>
      {leftIcon && <View style={styles.iconSlot}>{leftIcon}</View>}

      <TextInput
        value={currentValue}
        onChangeText={handleTextChange}
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
          <MaterialCommunityIcons
            name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
            size={22}
            color={theme.colors.text}
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
          <MaterialCommunityIcons
            name="close-circle-outline"
            size={20}
            color={theme.colors.placeholder}
          />
        </TouchableOpacity>
      )}

      {Boolean(rightIcon && !rest.secureTextEntry && !hasClearButton) && (
        <View style={styles.iconSlot}>{rightIcon}</View>
      )}
    </View>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      width: 275,
      minHeight: 52,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.pitchBackground,
      borderRadius: 10,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      margin: 12,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: theme.colors.text,
      paddingVertical: 10,
    },
    iconSlot: {
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 8,
    },
    actionButton: {
      justifyContent: 'center',
      alignItems: 'center',
      paddingLeft: 8,
      height: '100%',
    },
  });
