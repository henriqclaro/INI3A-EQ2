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
    secBorder: '#FBA8AF',
    pitchBackground: '#FFFFFF',
    placeholder: '#A9A9A9',

    // Barra de Navegação
    secondaryContainer: '#FBA8AF', // Pílula
    onSecondaryContainer: '#40242B', //  Ícone Selecionado
    onSurface: '#F6EDDC', // Texto
    onSurfaceVariant: '#F6EDDC', // Ícone Padrão

    tags: {
      product: '#FFF25E',
      variety: '#8DFBFF',
      attribute: '#FFA189',
    },
  },
  spacing: {
    sm: 8,
    md: 16,
    lg: 24,
  },
};

export type AppTheme = typeof lightTheme;
