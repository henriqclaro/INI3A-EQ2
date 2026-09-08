import { MD3LightTheme } from 'react-native-paper';

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
    },
  },
  rounded,
  shadows,
  typography,
  spacing,
  breakpoints,
};

export type AppTheme = typeof lightTheme;
