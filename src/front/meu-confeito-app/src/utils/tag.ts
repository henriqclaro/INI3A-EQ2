import { AppTheme } from '../theme/themes';
import { TagType } from '../types/tag';

export const TAG_TYPE_LABELS: Record<string, string> = {
  PRODUCT: 'Produto',
  VARIETY: 'Variedade',
  ATTRIBUTE: 'Atributo',
  USER: 'Usuário',
  product: 'Produto',
  variety: 'Variedade',
  attribute: 'Atributo',
  user: 'Usuário',
};

export const getTagTypeLabel = (type?: string | TagType): string => {
  if (!type) return 'Tag';
  return TAG_TYPE_LABELS[type.toUpperCase()] || TAG_TYPE_LABELS[type.toLowerCase()] || type;
};

export interface TagColorsResult {
  backgroundColor: string;
  textColor: string;
  borderColor: string;
}

export const getTagColors = (type: string | undefined, theme: AppTheme): TagColorsResult => {
  const normalized = (type || '').toLowerCase();
  const isDark = Boolean(theme.dark);

  // In both light and dark modes, product (#FF8A65/#FFA189), variety (#FFF59D/#FFF25E),
  // and attribute (#80DEEA/#8DFBFF) have bright pastel backgrounds.
  // The text color on these pastel chips must always be high-contrast dark espresso (#25181A).
  const darkTagTextColor = '#25181A';

  if (normalized === 'product') {
    return {
      backgroundColor: theme.colors.tags.product,
      textColor: darkTagTextColor,
      borderColor: isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(64, 36, 43, 0.2)',
    };
  }

  if (normalized === 'variety') {
    return {
      backgroundColor: theme.colors.tags.variety,
      textColor: darkTagTextColor,
      borderColor: isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(64, 36, 43, 0.2)',
    };
  }

  if (normalized === 'attribute') {
    return {
      backgroundColor: theme.colors.tags.attribute,
      textColor: darkTagTextColor,
      borderColor: isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(64, 36, 43, 0.2)',
    };
  }

  if (normalized === 'user') {
    return {
      backgroundColor: theme.colors.tags.user || theme.colors.parchment,
      textColor: isDark ? '#F6EDDC' : darkTagTextColor,
      borderColor: isDark ? 'rgba(246, 237, 220, 0.2)' : 'rgba(64, 36, 43, 0.2)',
    };
  }

  return {
    backgroundColor: theme.colors.surfaceContainerHigh,
    textColor: isDark ? '#F6EDDC' : darkTagTextColor,
    borderColor: theme.colors.outlineVariant,
  };
};
