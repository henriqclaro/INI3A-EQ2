export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const E164_REGEX = /^\+[1-9]\d{6,14}$/;

/**
 * Formats a phone number for display in the UI as the user types,
 * or when loading an existing stored phone (including +55 E.164 numbers).
 */
export function formatPhoneInput(value: string): string {
  if (!value) return '';
  const cleaned = value.trim();

  // If stored as +55XXXXXXXXXXX, format directly as Brazilian DDD + number
  if (cleaned.startsWith('+55')) {
    const brDigits = cleaned.slice(3).replace(/\D/g, '');
    if (brDigits.length === 10 || brDigits.length === 11) {
      return formatPhoneInput(brDigits);
    }
  }

  // Handle international numbers with '+'
  if (cleaned.startsWith('+')) {
    const digits = cleaned.slice(1).replace(/\D/g, '');
    return `+${digits.slice(0, 15)}`;
  }

  // Standard Brazilian masking
  const digits = cleaned.replace(/\D/g, '').slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

/**
 * Converts a phone input string to standard E.164 format (e.g. +5511999999999).
 */
export function toE164(rawPhone: string): string {
  const trimmed = rawPhone.trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('+')) {
    return `+${trimmed.slice(1).replace(/\D/g, '')}`;
  }

  const digits = trimmed.replace(/\D/g, '');
  // Brazilian numbers with DDD (10 or 11 digits)
  if (digits.length === 10 || digits.length === 11) {
    return `+55${digits}`;
  }
  // Numbers already containing Brazil 55 country code without '+'
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    return `+${digits}`;
  }
  return `+${digits}`;
}

export function isNameValid(name: string): boolean {
  return name.trim().length >= 3;
}

export function isEmailValid(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

export function isPasswordValid(password: string): boolean {
  return password.length >= 8;
}

export function isPhoneValid(phone: string): boolean {
  return phone.trim().length > 0 && E164_REGEX.test(toE164(phone));
}
