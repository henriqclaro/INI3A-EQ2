import { StyleSheet, Text, View } from 'react-native';

import { useThemeMode } from '../theme/ThemeContext';

interface LabelProps {
  text?: string;
  placeholder?: string;
}

export const Label = ({ text, placeholder }: LabelProps) => {
  const { theme } = useThemeMode();

  const styles = StyleSheet.create({
    container: {
      width: 250,
      height: 55,
      borderWidth: 0.8,
      backgroundColor: theme.colors.pitchBackground,
      borderRadius: 10,
      paddingVertical: 12,
      justifyContent: 'center',
      alignItems: 'center',
      margin: 12,
    },
    lblText: {
      fontSize: 18,
      color: theme.colors.text,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.lblText}>{text || placeholder}</Text>
    </View>
  );
};
