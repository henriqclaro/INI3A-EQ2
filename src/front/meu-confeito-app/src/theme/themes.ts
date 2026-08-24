import { MD3LightTheme } from 'react-native-paper';

export const colors = {
  colorLightYellow: '#F6EDDC',
  colorLightPink: '#FBA8AF',
  colorDarkPink: '#C53557',
  colorMarsala: '#40242B',
  colorWhite: '#FFFFFF',
  colorLightGray: '#D6D6D6',
  colorGray: '#A9A9A9',

  colorOrange: '#FFA189',
  colorYellow: '#FFF25E',
  colorCiano: '#8DFBFF',
}
export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    background: colors.colorLightYellow,
    text: colors.colorMarsala,
    secondaryText: colors.colorWhite,
    primary: colors.colorDarkPink,
    secondary: colors.colorLightPink,
    border: colors.colorMarsala,
    secBorder: colors.colorLightPink,
    pitchBackground: colors.colorWhite,
    lightGray: colors.colorLightGray,
    placeholder: colors.colorGray,

    // Barra de Navegação
    secondaryContainer: colors.colorLightPink, // Pílula
    onSecondaryContainer: colors.colorMarsala, //  Ícone Selecionado
    onSurface: colors.colorLightYellow, // Texto
    onSurfaceVariant: colors.colorLightYellow, // Ícone Padrão

    tags: {
      product: colors.colorOrange,
      variety: colors.colorYellow,
      attribute: colors.colorCiano,
    },
  },
  spacing: {
    sm: 8,
    md: 16,
    lg: 24,
  },
};

export type AppTheme = typeof lightTheme;
