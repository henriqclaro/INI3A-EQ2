import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

export const colors = {
  // Legacy mappings for backwards compatibility with existing screens
  colorLightYellow: '#F6EDDC',
  colorLightPink: '#FBA8AF',
  colorDarkPink: '#C53557',
  colorMarsala: '#40242B',
  colorWhite: '#FFFFFF',
  colorLightGray: '#E0BEC1',
  colorGray: '#8C7073',
  colorMediumGray: '#584143',
  colorDarkGray: '#40242B',
  colorOrange: '#FFA189',
  colorYellow: '#B45309',
  colorTagVariety: '#FFF25E',
  colorRed: '#BA1A1A',
  colorCiano: '#8DFBFF',
  colorGreen: '#006139',
  colorBackdrop: 'rgba(37, 24, 26, 0.6)',

  // Base & Surfaces (Blush-Cream Tonal Hierarchy & Parchment)
  background: '#FFF8F7',
  surface: '#FFF8F7',
  surfaceDim: '#EDD4D6',
  surfaceBright: '#FFF8F7',
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#FFF0F1',
  surfaceContainer: '#FFE9EA',
  surfaceContainerHigh: '#FBE2E4',
  surfaceContainerHighest: '#F5DDDE',
  surfaceVariant: '#F5DDDE',
  parchment: '#F6EDDC',

  // Text & On-Surface Colors
  onSurface: '#25181A',
  onSurfaceVariant: '#584143',
  espressoDark: '#40242B',
  text: '#40242B',
  inverseSurface: '#3C2D2E',
  inverseOnSurface: '#FFECED',

  // Primary (Berry / Deep Crimson)
  primary: '#A31940',
  onPrimary: '#FFFFFF',
  primaryContainer: '#C53557',
  onPrimaryContainer: '#FFEAEC',
  primaryFixed: '#FFD9DD',
  onPrimaryFixed: '#400012',

  // Secondary (Glaze Pink & Rose)
  secondary: '#8D4B52',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#FBA8AF',
  onSecondaryContainer: '#40242B',
  secondaryFixed: '#FFDADB',
  onSecondaryFixed: '#7A3C43',

  // Tertiary & Semantic (Artisanal Green / Financial Growth & Profit)
  tertiary: '#006139',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#007D4A',
  onTertiaryContainer: '#BBFFD0',
  tertiaryFixed: '#93F7B8',
  onTertiaryFixed: '#002110',

  // Neutrals & Artisanal Accents
  accentBrown: '#6F4137',
  placeholder: '#8C7073',
  lightGray: '#E0BEC1',
  white: '#FFFFFF',

  // Borders & Outlines
  border: '#E0BEC1',
  borderSubtle: '#F6EDDC',
  borderEmphasis: '#40242B',
  outline: '#8C7073',
  outlineVariant: '#E0BEC1',

  // Status & Feedback
  error: '#BA1A1A',
  onError: '#FFFFFF',
  errorContainer: '#FFDAD6',
  onErrorContainer: '#93000A',
};

export const COLOR_SUCCESS = colors.tertiary;
export const COLOR_DANGER = colors.error;
export const COLOR_WARNING = colors.colorYellow;

export const chips = {
  primary: {
    background: '#FFD9DD',
    text: '#400012',
  },
  secondary: {
    background: '#FFDADB',
    text: '#7A3C43',
  },
  success: {
    background: '#93F7B8',
    text: '#002110',
  },
  accent: {
    background: '#FBE2E4',
    text: '#C53557',
  },
};

export const typography = {
  headlineXl: {
    fontFamily: 'Playfair Display SC',
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: 0.6,
    fontWeight: '600' as const,
  },
  headlineLg: {
    fontFamily: 'Playfair Display SC',
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '600' as const,
  },
  headlineMd: {
    fontFamily: 'Playfair Display SC',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600' as const,
  },
  bodyLg: {
    fontFamily: 'Inter',
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '400' as const,
  },
  bodyMd: {
    fontFamily: 'Inter',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
  },
  bodySm: {
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
  },
  labelMd: {
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.5,
    fontWeight: '600' as const,
  },
  labelSm: {
    fontFamily: 'Inter',
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.2,
    fontWeight: '500' as const,
  },
};

export const rounded = {
  sm: 4,
  default: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const shadows = {
  soft: {
    shadowColor: '#25181A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 2,
  },
  hover: {
    shadowColor: '#25181A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 30,
    elevation: 4,
  },
  modal: {
    shadowColor: '#25181A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 40,
    elevation: 8,
  },
  glow: {
    shadowColor: '#A31940',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
};

export const spacing = {
  sm: 8,
  md: 16,
  lg: 24,
  base: 8,
  touchable: 48,
  marginMobile: 16,
  marginTablet: 24,
  marginDesktop: 40,
  gutterMobile: 16,
  gutterDesktop: 24,
  containerMax: 1200,
  space1: 4,
  space2: 8,
  space3: 12,
  space4: 16,
  space5: 20,
  space6: 24,
  space8: 32,
  space10: 40,
  space12: 48,
  space16: 64,
};

export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    // Base & Surfaces (Blush-Cream Tonal Hierarchy & Parchment)
    background: colors.background,
    surface: colors.surface,
    surfaceDim: colors.surfaceDim,
    surfaceBright: colors.surfaceBright,
    surfaceContainerLowest: colors.surfaceContainerLowest,
    surfaceContainerLow: colors.surfaceContainerLow,
    surfaceContainer: colors.surfaceContainer,
    surfaceContainerHigh: colors.surfaceContainerHigh,
    surfaceContainerHighest: colors.surfaceContainerHighest,
    surfaceVariant: colors.surfaceVariant,
    parchment: colors.parchment,

    // Text & On-Surface
    onSurface: colors.onSurface,
    onSurfaceVariant: colors.onSurfaceVariant,
    espressoDark: colors.espressoDark,
    text: colors.text,
    secondaryText: colors.onPrimary,
    inverseSurface: colors.inverseSurface,
    inverseOnSurface: colors.inverseOnSurface,

    // Primary
    primary: colors.primary,
    onPrimary: colors.onPrimary,
    primaryContainer: colors.primaryContainer,
    onPrimaryContainer: colors.onPrimaryContainer,
    primaryFixed: colors.primaryFixed,
    onPrimaryFixed: colors.onPrimaryFixed,

    // Secondary
    secondary: colors.secondary,
    onSecondary: colors.onSecondary,
    secondaryContainer: colors.secondaryContainer,
    onSecondaryContainer: colors.onSecondaryContainer,
    secondaryFixed: colors.secondaryFixed,
    onSecondaryFixed: colors.onSecondaryFixed,

    // Tertiary & Semantic
    tertiary: colors.tertiary,
    onTertiary: colors.onTertiary,
    tertiaryContainer: colors.tertiaryContainer,
    onTertiaryContainer: colors.onTertiaryContainer,
    tertiaryFixed: colors.tertiaryFixed,
    onTertiaryFixed: colors.onTertiaryFixed,

    // Neutrals & Artisanal Accents
    accentBrown: colors.accentBrown,
    placeholder: colors.placeholder,
    lightGray: colors.lightGray,
    white: colors.white,

    // Borders & Outlines
    border: colors.border,
    secBorder: colors.outlineVariant,
    borderSubtle: colors.borderSubtle,
    borderEmphasis: colors.borderEmphasis,
    outline: colors.outline,
    outlineVariant: colors.outlineVariant,

    // Status & Feedback
    error: colors.error,
    onError: colors.onError,
    errorContainer: colors.errorContainer,
    onErrorContainer: colors.onErrorContainer,
    success: colors.tertiary,
    danger: colors.error,
    warning: colors.colorYellow,
    backdrop: colors.colorBackdrop,

    // Legacy & helper aliases
    pitchBackground: colors.surfaceContainerLowest,
    mediumGray: colors.onSurfaceVariant,
    darkGray: colors.espressoDark,
    textMuted: colors.onSurfaceVariant,
    textSecondary: colors.onSurfaceVariant,

    chips,

    // Navigation Bar overrides
    onSurfaceDisabled: colors.onSurfaceVariant,

    tags: {
      product: colors.colorOrange,
      variety: colors.colorTagVariety,
      attribute: colors.colorCiano,
      user: colors.parchment,
    },
  },
  rounded,
  shadows,
  typography,
  spacing,
  breakpoints,
};

export const darkColors = {
  // Base & Surfaces
  background: '#180E10',
  surface: '#180E10',
  surfaceDim: '#140A0C',
  surfaceBright: '#241518',
  surfaceContainerLowest: '#100608',
  surfaceContainerLow: '#1E1013',
  surfaceContainer: '#261519',
  surfaceContainerHigh: '#321C21',
  surfaceContainerHighest: '#40242B',
  surfaceVariant: '#321C21',
  parchment: '#584143',

  // Text & On-Surface Colors
  onSurface: '#F6EDDC',
  onSurfaceVariant: '#E0BEC1',
  espressoDark: '#FFD9DD',
  text: '#F6EDDC',
  inverseSurface: '#FFF8F7',
  inverseOnSurface: '#25181A',

  // Primary
  primary: '#FBA8AF',
  onPrimary: '#400012',
  primaryContainer: '#C53557',
  onPrimaryContainer: '#FFEAEC',
  primaryFixed: '#FFD9DD',
  onPrimaryFixed: '#400012',

  // Secondary
  secondary: '#E0BEC1',
  onSecondary: '#25181A',
  secondaryContainer: '#40242B',
  onSecondaryContainer: '#FFDADB',
  secondaryFixed: '#584143',
  onSecondaryFixed: '#FFDADB',

  // Tertiary & Semantic
  tertiary: '#93F7B8',
  onTertiary: '#00391F',
  tertiaryContainer: '#006139',
  onTertiaryContainer: '#BBFFD0',
  tertiaryFixed: '#93F7B8',
  onTertiaryFixed: '#002110',

  // Neutrals & Artisanal Accents
  accentBrown: '#6F4137',
  placeholder: '#8C7073',
  lightGray: '#40242B',
  white: '#FFFFFF',

  // Borders & Outlines
  border: '#6F4137',
  borderSubtle: '#321C21',
  borderEmphasis: '#FBA8AF',
  outline: '#8C7073',
  outlineVariant: '#584143',

  // Status & Feedback
  error: '#FFB4AB',
  onError: '#690005',
  errorContainer: '#93000A',
  onErrorContainer: '#FFDAD6',
  colorBackdrop: 'rgba(16, 6, 8, 0.75)',
};

export const darkChips = {
  primary: {
    background: '#40242B',
    text: '#FFD9DD',
  },
  secondary: {
    background: '#321C21',
    text: '#FBA8AF',
  },
  success: {
    background: '#00391F',
    text: '#93F7B8',
  },
  accent: {
    background: '#4A1D27',
    text: '#FFB2BB',
  },
};

export const darkShadows = {
  soft: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 2,
  },
  hover: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 30,
    elevation: 4,
  },
  modal: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 40,
    elevation: 8,
  },
  glow: {
    shadowColor: '#FBA8AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 4,
  },
};

export const darkTheme: AppTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...darkColors,
    secBorder: darkColors.outlineVariant,
    secondaryText: darkColors.onSurfaceVariant,
    success: darkColors.tertiary,
    danger: darkColors.error,
    warning: colors.colorYellow,
    backdrop: darkColors.colorBackdrop,
    pitchBackground: darkColors.surfaceContainerLowest,
    mediumGray: darkColors.onSurfaceVariant,
    darkGray: darkColors.espressoDark,
    textMuted: darkColors.onSurfaceVariant,
    textSecondary: darkColors.onSurfaceVariant,
    chips: darkChips,
    onSurfaceDisabled: darkColors.onSurfaceVariant,
    tags: {
      product: '#FF8A65',
      variety: '#FFF59D',
      attribute: '#80DEEA',
      user: '#584143',
    },
  },
  rounded,
  shadows: darkShadows,
  typography,
  spacing,
  breakpoints,
};

export const oledDarkColors = {
  ...darkColors,
  background: '#000000',
  surface: '#000000',
  surfaceDim: '#000000',
  surfaceBright: '#12080A',
  surfaceContainerLowest: '#000000',
  surfaceContainerLow: '#0A0405',
  surfaceContainer: '#12080A',
  surfaceContainerHigh: '#1C0E11',
  surfaceContainerHighest: '#261317',
  surfaceVariant: '#1A0C0F',
  borderSubtle: '#1F0E12',
  colorBackdrop: 'rgba(0, 0, 0, 0.85)',
};

export const oledDarkTheme: AppTheme = {
  ...darkTheme,
  colors: {
    ...darkTheme.colors,
    ...oledDarkColors,
    pitchBackground: '#000000',
    backdrop: oledDarkColors.colorBackdrop,
    secBorder: oledDarkColors.outlineVariant,
    secondaryText: oledDarkColors.onSurfaceVariant,
    mediumGray: oledDarkColors.onSurfaceVariant,
    darkGray: oledDarkColors.espressoDark,
    textMuted: oledDarkColors.onSurfaceVariant,
    textSecondary: oledDarkColors.onSurfaceVariant,
    onSurfaceDisabled: oledDarkColors.onSurfaceVariant,
  },
};

export const highContrastLightColors = {
  // Base & Surfaces
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceDim: '#F6EDDC',
  surfaceBright: '#FFFFFF',
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#FFF0F1',
  surfaceContainer: '#FFE9EA',
  surfaceContainerHigh: '#FBE2E4',
  surfaceContainerHighest: '#F5DDDE',
  surfaceVariant: '#F5DDDE',
  parchment: '#F6EDDC',

  // Text & On-Surface
  onSurface: '#40242B',
  onSurfaceVariant: '#25181A',
  espressoDark: '#40242B',
  text: '#40242B',
  inverseSurface: '#000000',
  inverseOnSurface: '#FFFFFF',

  // Primary
  primary: '#A31940',
  onPrimary: '#FFFFFF',
  primaryContainer: '#FFD9DD',
  onPrimaryContainer: '#400012',
  primaryFixed: '#FFD9DD',
  onPrimaryFixed: '#400012',

  // Secondary
  secondary: '#6F4137',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#FFDADB',
  onSecondaryContainer: '#40242B',
  secondaryFixed: '#FFDADB',
  onSecondaryFixed: '#40242B',

  // Tertiary / Success
  tertiary: '#006139',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#BBFFD0',
  onTertiaryContainer: '#002110',
  tertiaryFixed: '#93F7B8',
  onTertiaryFixed: '#002110',

  // Neutrals & Accents
  accentBrown: '#6F4137',
  placeholder: '#584143',
  lightGray: '#E0BEC1',
  white: '#FFFFFF',

  // Borders & Outlines
  border: '#40242B',
  borderSubtle: '#40242B',
  borderEmphasis: '#40242B',
  outline: '#40242B',
  outlineVariant: '#40242B',

  // Status & Feedback
  error: '#BA1A1A',
  onError: '#FFFFFF',
  errorContainer: '#FFDAD6',
  onErrorContainer: '#93000A',
  colorBackdrop: 'rgba(0, 0, 0, 0.85)',
};

export const highContrastDarkColors = {
  // Base & Surfaces
  background: '#000000',
  surface: '#000000',
  surfaceDim: '#000000',
  surfaceBright: '#100608',
  surfaceContainerLowest: '#000000',
  surfaceContainerLow: '#000000',
  surfaceContainer: '#000000',
  surfaceContainerHigh: '#180E10',
  surfaceContainerHighest: '#40242B',
  surfaceVariant: '#000000',
  parchment: '#180E10',

  // Text & On-Surface
  onSurface: '#F6EDDC',
  onSurfaceVariant: '#FFFFFF',
  espressoDark: '#FFFFFF',
  text: '#F6EDDC',
  inverseSurface: '#FFFFFF',
  inverseOnSurface: '#000000',

  // Primary
  primary: '#FBA8AF',
  onPrimary: '#000000',
  primaryContainer: '#C53557',
  onPrimaryContainer: '#FFFFFF',
  primaryFixed: '#FBA8AF',
  onPrimaryFixed: '#000000',

  // Secondary
  secondary: '#FFFFFF',
  onSecondary: '#000000',
  secondaryContainer: '#40242B',
  onSecondaryContainer: '#FFFFFF',
  secondaryFixed: '#FBA8AF',
  onSecondaryFixed: '#000000',

  // Tertiary / Success
  tertiary: '#93F7B8',
  onTertiary: '#000000',
  tertiaryContainer: '#006139',
  onTertiaryContainer: '#FFFFFF',
  tertiaryFixed: '#93F7B8',
  onTertiaryFixed: '#000000',

  // Neutrals & Accents
  accentBrown: '#F6EDDC',
  placeholder: '#FBA8AF',
  lightGray: '#FFFFFF',
  white: '#FFFFFF',

  // Borders & Outlines
  border: '#FFFFFF',
  borderSubtle: '#F6EDDC',
  borderEmphasis: '#FBA8AF',
  outline: '#FFFFFF',
  outlineVariant: '#F6EDDC',

  // Status & Feedback
  error: '#FFB4AB',
  onError: '#000000',
  errorContainer: '#93000A',
  onErrorContainer: '#FFFFFF',
  colorBackdrop: 'rgba(0, 0, 0, 0.9)',
};

export const highContrastLightChips = {
  primary: { background: '#FFD9DD', text: '#400012' },
  secondary: { background: '#FFDADB', text: '#40242B' },
  success: { background: '#93F7B8', text: '#002110' },
  accent: { background: '#FBE2E4', text: '#400012' },
};

export const highContrastDarkChips = {
  primary: { background: '#40242B', text: '#FFD9DD' },
  secondary: { background: '#321C21', text: '#F6EDDC' },
  success: { background: '#00391F', text: '#93F7B8' },
  accent: { background: '#4A1D27', text: '#FFB2BB' },
};

export const highContrastShadows = {
  soft: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  hover: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  modal: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  glow: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
};

export const highContrastLightTheme: AppTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...highContrastLightColors,
    secBorder: highContrastLightColors.border,
    secondaryText: highContrastLightColors.onSurfaceVariant,
    success: highContrastLightColors.tertiary,
    danger: highContrastLightColors.error,
    warning: colors.colorYellow,
    backdrop: highContrastLightColors.colorBackdrop,
    pitchBackground: '#FFFFFF',
    mediumGray: highContrastLightColors.onSurfaceVariant,
    darkGray: highContrastLightColors.espressoDark,
    textMuted: highContrastLightColors.onSurfaceVariant,
    textSecondary: highContrastLightColors.onSurfaceVariant,
    chips: highContrastLightChips,
    onSurfaceDisabled: '#40242B',
    tags: {
      product: '#FFA189',
      variety: '#FFF25E',
      attribute: '#8DFBFF',
      user: '#F6EDDC',
    },
  },
  rounded,
  shadows: highContrastShadows,
  typography,
  spacing,
  breakpoints,
};

export const highContrastDarkTheme: AppTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...highContrastDarkColors,
    secBorder: highContrastDarkColors.border,
    secondaryText: highContrastDarkColors.onSurfaceVariant,
    success: highContrastDarkColors.tertiary,
    danger: highContrastDarkColors.error,
    warning: '#FFF25E',
    backdrop: highContrastDarkColors.colorBackdrop,
    pitchBackground: '#000000',
    mediumGray: highContrastDarkColors.onSurfaceVariant,
    darkGray: highContrastDarkColors.espressoDark,
    textMuted: highContrastDarkColors.onSurfaceVariant,
    textSecondary: highContrastDarkColors.onSurfaceVariant,
    chips: highContrastDarkChips,
    onSurfaceDisabled: '#FFFFFF',
    tags: {
      product: '#FFA189',
      variety: '#FFF25E',
      attribute: '#8DFBFF',
      user: '#F6EDDC',
    },
  },
  rounded,
  shadows: highContrastShadows,
  typography,
  spacing,
  breakpoints,
};

export type AppTheme = typeof lightTheme;
