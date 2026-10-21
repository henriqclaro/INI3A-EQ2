import { memo, useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { MaterialSymbol } from '@/src/components/common';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';
import { RecipeItem } from '@/src/types/recipe';

export interface RecipeIngredientsSectionProps {
  recipeItems: RecipeItem[];
}

export const RecipeIngredientsSection = memo(function RecipeIngredientsSection({
  recipeItems,
}: RecipeIngredientsSectionProps) {
  const { theme } = useThemeMode();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [checkedIngredientMap, setCheckedIngredientMap] = useState<Record<string, boolean>>({});

  const toggleIngredient = useCallback((id: string) => {
    setCheckedIngredientMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }, []);

  return (
    <View style={styles.cardBox}>
      <View style={styles.cardHeader}>
        <MaterialSymbol name="checklist" size={22} color={theme.colors.primary} />
        <Text style={styles.cardTitle}>Itens da Receita</Text>
      </View>

      {recipeItems.length > 0 ? (
        recipeItems.map((item, index) => {
          const itemId = item.id || String(index);
          const isIngredientChecked = Boolean(checkedIngredientMap[itemId]);
          const isSubRecipe = Boolean(item.subRecipe);
          const itemName = isSubRecipe
            ? item.subRecipe?.title || 'Sub-receita'
            : item.ingredient?.name || 'Ingrediente';

          const formattedQuantity =
            item.displayQuantity && item.displayUnit
              ? `${item.displayQuantity} ${item.displayUnit} (${item.quantity} ${item.unit})`
              : `${item.quantity} ${item.unit}`;

          return (
            <TouchableOpacity
              key={itemId}
              style={styles.ingredientRow}
              onPress={() => toggleIngredient(itemId)}
              activeOpacity={0.7}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isIngredientChecked }}
            >
              <View style={styles.ingredientLeft}>
                <View style={[styles.checkbox, isIngredientChecked && styles.checkedCheckbox]}>
                  {isIngredientChecked && (
                    <MaterialSymbol name="check" size={14} color={theme.colors.onPrimary} />
                  )}
                </View>
                <View style={styles.ingredientTextGroup}>
                  <View style={styles.ingredientTitleRow}>
                    <Text
                      style={[
                        styles.ingredientName,
                        isIngredientChecked && styles.checkedIngredientText,
                      ]}
                    >
                      {itemName}
                    </Text>
                    {isSubRecipe && (
                      <View style={styles.subRecipeBadge}>
                        <Text style={styles.subRecipeBadgeText}>Sub-receita</Text>
                      </View>
                    )}
                  </View>
                  {Boolean(item.notes) && <Text style={styles.ingredientNotes}>{item.notes}</Text>}
                </View>
              </View>
              <Text style={styles.ingredientQuantity}>{formattedQuantity}</Text>
            </TouchableOpacity>
          );
        })
      ) : (
        <Text style={styles.emptyCardText}>Nenhum item informado.</Text>
      )}
    </View>
  );
});

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    cardBox: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.rounded.lg,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: 18,
      gap: 14,
      ...theme.shadows.soft,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
      paddingBottom: 10,
    },
    cardTitle: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 19,
      fontWeight: 'bold',
      color: theme.colors.espressoDark,
    },
    emptyCardText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 14,
      fontStyle: 'italic',
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      paddingVertical: 12,
    },
    ingredientRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      minHeight: 48,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
    },
    ingredientLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      paddingRight: 12,
      gap: 12,
    },
    ingredientTextGroup: {
      flex: 1,
    },
    ingredientTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 6,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderWidth: 1.5,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.sm,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surfaceContainerLowest,
    },
    checkedCheckbox: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    ingredientName: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 14,
      color: theme.colors.text,
      flexShrink: 1,
    },
    checkedIngredientText: {
      textDecorationLine: 'line-through',
      opacity: 0.5,
    },
    subRecipeBadge: {
      backgroundColor: theme.colors.parchment,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: theme.rounded.full,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    subRecipeBadgeText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 10,
      fontWeight: '700',
      color: theme.colors.espressoDark,
    },
    ingredientNotes: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
    },
    ingredientQuantity: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.colors.espressoDark,
    },
  });
