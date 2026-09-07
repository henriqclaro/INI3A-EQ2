export const formatCurrency = (value: number | string | null | undefined): string => {
  const num = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
  if (isNaN(num)) return 'R$ 0,00';
  return num.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
};

export const formatQuantity = (
  value: number | string | null | undefined,
  unit?: string,
): string => {
  const num = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
  if (isNaN(num)) return `0 ${unit || ''}`.trim();

  // Format with max 3 decimals if fractional, otherwise integer
  const formattedNumber = num.toLocaleString('pt-BR', {
    maximumFractionDigits: 3,
  });

  return unit ? `${formattedNumber} ${unit}` : formattedNumber;
};

export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return '';
  const parsed = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(parsed.getTime())) return '';

  return parsed.toLocaleDateString('pt-BR', {
    timeZone: 'UTC',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const isExpired = (date: string | Date | null | undefined): boolean => {
  if (!date) return false;
  const parsed = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(parsed.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return parsed.getTime() < today.getTime();
};

export const isExpiringSoon = (
  date: string | Date | null | undefined,
  daysThreshold = 7,
): boolean => {
  if (!date) return false;
  const parsed = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(parsed.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thresholdDate = new Date(today);
  thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

  return parsed.getTime() >= today.getTime() && parsed.getTime() <= thresholdDate.getTime();
};
