import { Alert, Platform, Share } from 'react-native';

import * as Clipboard from 'expo-clipboard';

export interface ShoppingListItem {
  name: string;
  quantity?: number | string | null;
  unit?: string | null;
  category?: string | null;
}

export function isShareSupported(): boolean {
  if (Platform.OS === 'web') {
    return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  }
  return true;
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await Clipboard.setStringAsync(text);
    return true;
  } catch {
    if (
      typeof navigator !== 'undefined' &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === 'function'
    ) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}

export async function shareShoppingList(
  items: ShoppingListItem[],
  title: string = 'Lista de Compras • Meu Confeito',
): Promise<{ isShared: boolean; isCopied: boolean }> {
  if (!items || items.length === 0) {
    Alert.alert('Lista Vazia', 'Não há itens para compartilhar.');
    return { isShared: false, isCopied: false };
  }

  const lines = items.map((it) => {
    const qtyPart =
      it.quantity !== undefined && it.quantity !== null && it.quantity !== ''
        ? ` (${it.quantity} ${it.unit || 'un'})`
        : '';
    return `• ${it.name}${qtyPart}`;
  });

  const message = `🧁 *${title}*\n\n${lines.join('\n')}\n\n_Gerado pelo aplicativo Meu Confeito_`;

  const hasNativeShare = isShareSupported();

  if (hasNativeShare) {
    try {
      await Share.share({
        title,
        message,
      });
      return { isShared: true, isCopied: false };
    } catch (error: unknown) {
      const isAbortError =
        (error instanceof Error && error.name === 'AbortError') ||
        (typeof error === 'object' &&
          error !== null &&
          'name' in error &&
          (error as { name: string }).name === 'AbortError');

      if (isAbortError) {
        return { isShared: false, isCopied: false };
      }
      console.warn('Native share failed, falling back to clipboard:', error);
    }
  }

  const didCopy = await copyToClipboard(message);
  if (didCopy) {
    Alert.alert(
      'Lista Copiada!',
      'O compartilhamento direto não é suportado pelo seu navegador. A lista de compras foi copiada para a área de transferência!',
      [{ text: 'OK' }],
    );
    return { isShared: false, isCopied: true };
  }

  Alert.alert(
    'Compartilhamento Indisponível',
    'O seu navegador não possui suporte para compartilhamento direto ou cópia para a área de transferência.',
    [{ text: 'OK' }],
  );
  return { isShared: false, isCopied: false };
}

export async function shareRecipeSummary(recipe: {
  title: string;
  baseYield?: number | string | null;
  yieldUnit?: string | null;
  prepTimeMinutes?: number | string | null;
  items?: {
    quantity?: number | string | null;
    unit?: string | null;
    ingredient?: { name?: string | null } | null;
    subRecipe?: { title?: string | null } | null;
  }[];
}): Promise<{ isShared: boolean; isCopied: boolean }> {
  const yieldText = recipe.baseYield
    ? `Rendimento: ${recipe.baseYield} ${recipe.yieldUnit || 'UN'}`
    : '';
  const timeText = recipe.prepTimeMinutes ? `Tempo: ${recipe.prepTimeMinutes} min` : '';
  const metaParts = [yieldText, timeText].filter(Boolean).join(' • ');

  const ingredientsList = (recipe.items || []).map((it) => {
    const name = it.ingredient?.name || it.subRecipe?.title || 'Insumo';
    return `• ${it.quantity} ${it.unit || ''} - ${name}`;
  });

  const message = [
    `🍰 *${recipe.title}*`,
    metaParts ? `_${metaParts}_` : '',
    '',
    '*Ingredientes:*',
    ingredientsList.join('\n'),
    '',
    '_Meu Confeito • Confeitaria Artesanal_',
  ]
    .filter((l) => l !== null && l !== undefined)
    .join('\n');

  const hasNativeShare = isShareSupported();

  if (hasNativeShare) {
    try {
      await Share.share({
        title: recipe.title,
        message,
      });
      return { isShared: true, isCopied: false };
    } catch (error: unknown) {
      const isAbortError =
        (error instanceof Error && error.name === 'AbortError') ||
        (typeof error === 'object' &&
          error !== null &&
          'name' in error &&
          (error as { name: string }).name === 'AbortError');

      if (isAbortError) {
        return { isShared: false, isCopied: false };
      }
      console.warn('Native share failed, falling back to clipboard:', error);
    }
  }

  const didCopy = await copyToClipboard(message);
  if (didCopy) {
    Alert.alert(
      'Receita Copiada!',
      'O compartilhamento direto não é suportado pelo seu navegador. A receita foi copiada para a área de transferência para você colar onde preferir!',
      [{ text: 'OK' }],
    );
    return { isShared: false, isCopied: true };
  }

  Alert.alert(
    'Compartilhamento Indisponível',
    'O seu navegador não possui suporte para compartilhamento direto ou cópia para a área de transferência.',
    [{ text: 'OK' }],
  );
  return { isShared: false, isCopied: false };
}
