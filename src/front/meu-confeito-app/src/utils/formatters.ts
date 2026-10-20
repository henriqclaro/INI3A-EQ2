let globalPriceDecimalPlaces = 4;

export const setGlobalPriceDecimalPlaces = (decimals: number): void => {
  if (decimals === 2 || decimals === 3 || decimals === 4) {
    globalPriceDecimalPlaces = decimals;
  }
};

export const getGlobalPriceDecimalPlaces = (): number => globalPriceDecimalPlaces;

export const formatCurrency = (
  value: number | string | null | undefined,
  maxFractionDigits?: number,
): string => {
  const num = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
  if (isNaN(num)) return 'R$ 0,00';
  const effectiveMaxDigits =
    typeof maxFractionDigits === 'number' ? maxFractionDigits : globalPriceDecimalPlaces;
  return num.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: Math.max(2, effectiveMaxDigits),
  });
};

export const formatUnit = (unit?: string | null): string => {
  if (!unit) return 'un';
  const clean = unit.trim().toUpperCase();
  switch (clean) {
    case 'G':
    case 'GRAM':
    case 'GRAMA':
    case 'GRAMAS':
      return 'g';
    case 'KG':
    case 'QUILO':
    case 'QUILOS':
    case 'KILOGRAM':
      return 'kg';
    case 'ML':
    case 'MILILITRO':
    case 'MILILITROS':
      return 'ml';
    case 'L':
    case 'LITRO':
    case 'LITROS':
      return 'L';
    case 'UN':
    case 'UND':
    case 'UNIDADE':
    case 'UNIDADES':
      return 'un';
    default:
      return unit.trim().toLowerCase();
  }
};

export const getIngredientDisplayUnit = (
  ingredient?: {
    baseUnit?: string | null;
    baseDimension?: string | null;
  } | null,
): string => {
  if (ingredient?.baseUnit) {
    return formatUnit(ingredient.baseUnit);
  }
  if (ingredient?.baseDimension === 'MASS') return 'g';
  if (ingredient?.baseDimension === 'VOLUME') return 'ml';
  return 'un';
};

export const formatQuantity = (
  value: number | string | null | undefined,
  unit?: string,
): string => {
  const num = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
  const formattedUnit = unit ? formatUnit(unit) : '';
  if (isNaN(num)) return `0 ${formattedUnit}`.trim();

  // Format with max 3 decimals if fractional, otherwise integer
  const formattedNumber = num.toLocaleString('pt-BR', {
    maximumFractionDigits: 3,
  });

  return formattedUnit ? `${formattedNumber} ${formattedUnit}` : formattedNumber;
};

export const parseDateSafely = (value: Date | string | null | undefined): Date | null => {
  if (!value) return null;
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }
  const str = String(value).trim();
  if (!str) return null;

  // DD/MM/YYYY
  const brMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (brMatch) {
    const day = parseInt(brMatch[1], 10);
    const month = parseInt(brMatch[2], 10) - 1;
    const year = parseInt(brMatch[3], 10);
    const date = new Date(year, month, day, 12, 0, 0);
    return isNaN(date.getTime()) ? null : date;
  }

  // YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    const date = new Date(year, month, day, 12, 0, 0);
    return isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(str);
  return isNaN(date.getTime()) ? null : date;
};

export const formatDateForDisplay = (value: Date | string | null | undefined): string => {
  if (!value) return '';
  const parsed = parseDateSafely(value);
  if (!parsed) return '';

  const day = String(parsed.getDate()).padStart(2, '0');
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const year = parsed.getFullYear();
  return `${day}/${month}/${year}`;
};

export const formatDateForApi = (value: Date | string | null | undefined): string | undefined => {
  if (!value) return undefined;
  const parsed = parseDateSafely(value);
  if (!parsed) return undefined;

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDate = (date: string | Date | null | undefined): string => {
  return formatDateForDisplay(date);
};

export const isExpired = (date: string | Date | null | undefined): boolean => {
  if (!date) return false;
  const parsed = parseDateSafely(date);
  if (!parsed) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return parsed.getTime() < today.getTime();
};

export const isExpiringSoon = (
  date: string | Date | null | undefined,
  daysThreshold = 7,
): boolean => {
  if (!date) return false;
  const parsed = parseDateSafely(date);
  if (!parsed) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thresholdDate = new Date(today);
  thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

  return parsed.getTime() >= today.getTime() && parsed.getTime() <= thresholdDate.getTime();
};
