/**
 * Normalizes text for forgiving search comparison:
 * removes accents, diacritics, and normalizes casing.
 * e.g., "Açúcar de Confeiteiro" -> "acucar de confeiteiro"
 */
export function normalizeSearchText(text?: string | null): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Checks whether a target string contains a search query,
 * ignoring accents, diacritics, and case.
 */
export function matchesSearch(sourceText?: string | null, searchQuery?: string | null): boolean {
  if (!searchQuery || !searchQuery.trim()) {
    return true;
  }
  if (!sourceText) {
    return false;
  }

  const normalizedSource = normalizeSearchText(sourceText);
  const normalizedQuery = normalizeSearchText(searchQuery);

  return normalizedSource.includes(normalizedQuery);
}
