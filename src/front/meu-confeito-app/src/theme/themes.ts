import { MD3LightTheme } from 'react-native-paper';

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    background: '#F6EDDC',
    text: '#40242B',
    primary: '#C53557',
    secondary: '#FBA8AF',
    border: '#40242B',

    secondaryContainer: '#FBA8AF',
    onSecondaryContainer: '#40242B',
    onSurface: '#F6EDDC',
    onSurfaceVariant: '#F6EDDC',
  },
  spacing: {
    sm: 8,
    md: 16,
    lg: 24,
  },
};

export type AppTheme = typeof lightTheme;
