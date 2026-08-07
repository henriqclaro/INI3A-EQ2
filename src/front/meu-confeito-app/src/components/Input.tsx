import { useEffect, useMemo, useState } from 'react';
import { StyleProp, StyleSheet, TextInput, TextInputProps, TouchableOpacity, View, ViewStyle } from 'react-native';

import { useThemeMode } from '../contexts/ThemeContext';
import { AppTheme } from '../theme/themes';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

interface InputProps extends TextInputProps {
  containerStyle?: StyleProp<ViewStyle>;
}

export const Input = ({ value, onChangeText, style, containerStyle, ...rest }: InputProps) => {
  const { theme } = useThemeMode();

  const [localValue, setLocalValue] = useState(value?.toString() || '');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  useEffect(() => {
    if (value !== undefined && value?.toString() !== localValue) {
      setLocalValue(value.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        secureTextEntry={rest.secureTextEntry && !isPasswordVisible}
      />

      {rest.secureTextEntry && (
        <TouchableOpacity
          style={styles.eyeButton}
          onPress={() => setIsPasswordVisible(!isPasswordVisible)}
        >
          <MaterialCommunityIcons
            name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
            size={24}
            color={theme.colors.text}
          />
        </TouchableOpacity>
      )}
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
      paddingRight: 20,
      margin: 12,
    },
    input: {
      fontSize: 18,
      color: theme.colors.text,
    },
    eyeButton: {
      position: 'absolute',
      right: 12,
      height: '100%',
      justifyContent: 'center',
    },
  });
