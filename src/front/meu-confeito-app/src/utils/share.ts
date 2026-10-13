import { Alert, Share } from 'react-native';

export interface ShoppingListItem {
  name: string;
  quantity?: number | string | null;
  unit?: string | null;
  category?: string | null;
}

export async function shareShoppingList(
  items: ShoppingListItem[],
  title: string = 'Lista de Compras • Meu Confeito',
): Promise<void> {
  if (!items || items.length === 0) {
    Alert.alert('Lista Vazia', 'Não há itens para compartilhar.');
    return;
  }

  const lines = items.map((it) => {
    const qtyPart =
      it.quantity !== undefined && it.quantity !== null && it.quantity !== ''
        ? ` (${it.quantity} ${it.unit || 'un'})`
        : '';
    return `• ${it.name}${qtyPart}`;
  });

  const message = `🧁 *${title}*\n\n${lines.join('\n')}\n\n_Gerado pelo aplicativo Meu Confeito_`;

  try {
    await Share.share({
      title,
      message,
    });
  } catch (error) {
    console.warn('Failed to share shopping list:', error);
  }
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
}): Promise<void> {
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

  try {
    await Share.share({
      title: recipe.title,
      message,
    });
  } catch (error) {
    console.warn('Failed to share recipe:', error);
  }
}
