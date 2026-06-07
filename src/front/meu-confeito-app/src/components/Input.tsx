import { useEffect, useMemo, useState } from 'react';
import { StyleProp, StyleSheet, TextInput, TextInputProps, View, ViewStyle } from 'react-native';

import { useThemeMode } from '../theme/ThemeContext';
import { AppTheme } from '../theme/themes';

interface InputProps extends TextInputProps {
  containerStyle?: StyleProp<ViewStyle>;
}

export const Input = ({ value, onChangeText, style, containerStyle, ...rest }: InputProps) => {
  const { theme } = useThemeMode();

  const [localValue, setLocalValue] = useState(value?.toString() || '');

  useEffect(() => {
    if (value !== undefined && value?.toString() !== localValue) {
      setLocalValue(value.toString());
    }
  }, [value]);

  const handleTextChange = (text: string) => {
    setLocalValue(text);

    if (onChangeText) {
      onChangeText(text);
    }
  };

  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[styles.container, containerStyle]}>
      <TextInput
        value={localValue}
        onChangeText={handleTextChange}
        style={[styles.input, style]}
        {...rest}
      />
    </View>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      width: 275,
      height: 60,
      borderWidth: 0.8,
      backgroundColor: theme.colors.pitchBackground,
      borderRadius: 10,
      justifyContent: 'center',
      paddingLeft: 10,
      margin: 12,
    },
    input: {
      fontSize: 18,
      color: theme.colors.text,
    },
  });
