import { RecipeInstructionStep } from '../types';

/**
 * Parses raw recipe instructions into an array of typed RecipeInstructionStep objects.
 * Supports legacy formats (flat strings, string arrays, objects with .text) as well as
 * the standard format ({ steps: [{ step, title, description }] }).
 */
export function parseRecipeInstructions(rawInstructions: unknown): RecipeInstructionStep[] {
  if (!rawInstructions) return [];

  let data = rawInstructions;
  if (typeof data === 'string') {
    const trimmed = data.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        data = JSON.parse(trimmed);
      } catch {
        return [{ step: 1, title: '', description: trimmed }];
      }
    } else {
      return [{ step: 1, title: '', description: trimmed }];
    }
  }

  const parseStepItem = (item: unknown, defaultIndex: number): RecipeInstructionStep | null => {
    if (!item) return null;
    if (typeof item === 'string') {
      const desc = item.trim();
      if (!desc) return null;
      return { step: defaultIndex + 1, title: '', description: desc };
    }
    if (typeof item === 'object' && item !== null) {
      const obj = item as Record<string, unknown>;
      const stepNum =
        typeof obj.step === 'number'
          ? obj.step
          : typeof obj.step === 'string'
            ? parseInt(obj.step, 10) || defaultIndex + 1
            : defaultIndex + 1;
      const title = typeof obj.title === 'string' ? obj.title.trim() : '';
      const description =
        typeof obj.description === 'string'
          ? obj.description.trim()
          : typeof obj.text === 'string'
            ? obj.text.trim()
            : '';

      if (!title && !description) {
        return null;
      }
      return {
        step: stepNum,
        title,
        description,
      };
    }
    return null;
  };

  if (Array.isArray(data)) {
    return data
      .map((item, idx) => parseStepItem(item, idx))
      .filter((s): s is RecipeInstructionStep => s !== null)
      .sort((a, b) => a.step - b.step);
  }

  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.steps)) {
      return obj.steps
        .map((item, idx) => parseStepItem(item, idx))
        .filter((s): s is RecipeInstructionStep => s !== null)
        .sort((a, b) => a.step - b.step);
    }
    const single = parseStepItem(obj, 0);
    if (single) {
      return [single];
    }
  }

  return [];
}
