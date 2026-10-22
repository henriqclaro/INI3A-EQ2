import { useMemo } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { DateInput, IngredientSelector } from '@/src/components/common';
import { ExistingStockInfoCard } from '@/src/components/stock/ExistingStockInfoCard';
import { StockCard } from '@/src/components/stock/StockCard';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';
import { PartialIngredient } from '@/src/types/ingredient';
import { InventoryItem } from '@/src/types/inventory';
import { StockEntryItem, StockEntryMode } from '@/src/types/stockEntry';
import {
  formatCurrency,
  formatDateForApi,
  formatQuantity,
  getIngredientDisplayUnit,
} from '@/src/utils/formatters';

export interface StockEntryCardProps {
  item: StockEntryItem;
  index: number;
  totalItems: number;
  entryMode: StockEntryMode;
  availableIngredients: PartialIngredient[];
  inventory: InventoryItem[];
  priceDecimalPlaces: number;
  isMobile: boolean;
  onChange: (updated: StockEntryItem) => void;
  onRemove: (id: string) => void;
}

export function StockEntryCard({
  item,
  index,
  totalItems,
  entryMode,
  availableIngredients,
  inventory,
  priceDecimalPlaces,
  isMobile,
  onChange,
  onRemove,
}: StockEntryCardProps) {
  const { theme } = useThemeMode();
  const styles = useMemo(() => createStyles(theme, isMobile), [theme, isMobile]);

  const hasMultipleItems = totalItems > 1;

  // Resolve current ingredient object
  const currentIngredient = useMemo(() => {
    if (
      item.selectedIngredient &&
      String(item.selectedIngredient.id) === String(item.selectedIngredientId)
    ) {
      return item.selectedIngredient;
    }
    return (
      availableIngredients.find((ing) => String(ing.id) === String(item.selectedIngredientId)) ||
      null
    );
  }, [item.selectedIngredient, availableIngredients, item.selectedIngredientId]);

  const baseUnit = getIngredientDisplayUnit(currentIngredient);

  // Check if item already exists in stock
  const existingStockItem = useMemo(() => {
    if (!item.selectedIngredientId) return null;
    return (
      inventory.find((inv) => String(inv.ingredientId) === String(item.selectedIngredientId)) ||
      null
    );
  }, [inventory, item.selectedIngredientId]);

  const isAlreadyInStock = Boolean(existingStockItem);

  // Numerical parsing
  const parsedQuantity = parseFloat(item.quantityInput.replace(',', '.')) || 0;
  const parsedCost = parseFloat(item.totalCostInput.replace(',', '.')) || 0;
  const calculatedUnitCost = parsedQuantity > 0 && parsedCost > 0 ? parsedCost / parsedQuantity : 0;

  // Sync package helper with quantityInput
  const handlePackageValuesChange = (newCountStr: string, newSizeStr: string) => {
    const count = parseFloat(newCountStr.replace(',', '.')) || 0;
    const size = parseFloat(newSizeStr.replace(',', '.')) || 0;

    let updatedQuantity = item.quantityInput;
    if (count > 0 && size > 0) {
      updatedQuantity = String(count * size);
    }

    onChange({
      ...item,
      packageCount: newCountStr,
      packageSize: newSizeStr,
      quantityInput: updatedQuantity,
    });
  };

  const ingredientError = useMemo(() => {
    if (!item.hasTouchedIngredient) return '';
    if (!item.selectedIngredientId) return 'Selecione um ingrediente da lista.';
    return '';
  }, [item.hasTouchedIngredient, item.selectedIngredientId]);

  // Live preview item representation
  const previewItem: InventoryItem | null = useMemo(() => {
    if (!currentIngredient) return null;

    const currentQty = existingStockItem ? Number(existingStockItem.currentQuantity) : 0;
    const currentCost = existingStockItem ? Number(existingStockItem.costPerBaseUnit) : 0;

    let finalQty = parsedQuantity;
    let finalCost = calculatedUnitCost;

    if (entryMode === 'purchase') {
      if (existingStockItem && currentQty > 0) {
        finalQty = currentQty + parsedQuantity;
        finalCost = (currentQty * currentCost + parsedCost) / (finalQty > 0 ? finalQty : 1);
      } else {
        finalQty = parsedQuantity;
        finalCost = calculatedUnitCost;
      }
    } else {
      finalQty = parsedQuantity;
      finalCost = currentCost;
    }

    return {
      ingredientId: Number(currentIngredient.id),
      currentQuantity: finalQty,
      costPerBaseUnit: finalCost,
      expirationDate: item.expirationDate ? (formatDateForApi(item.expirationDate) ?? null) : null,
      lastUpdated: new Date(),
      ingredient: {
        id: Number(currentIngredient.id),
        name: currentIngredient.name,
        slug: currentIngredient.slug || '',
        category: currentIngredient.category,
        baseDimension: currentIngredient.baseDimension || 'MASS',
        baseUnit: currentIngredient.baseUnit || baseUnit,
        description: currentIngredient.description || null,
      },
    };
  }, [
    currentIngredient,
    existingStockItem,
    parsedQuantity,
    calculatedUnitCost,
    entryMode,
    parsedCost,
    item.expirationDate,
    baseUnit,
  ]);

  return (
    <View style={[styles.itemContainer, hasMultipleItems && styles.itemContainerMulti]}>
      {/* Header bar identifying this entry when multiple items exist */}
      {hasMultipleItems && (
        <View style={styles.itemHeaderBar}>
          <View style={styles.itemBadgeGroup}>
            <View style={styles.itemBadge}>
              <Text style={styles.itemBadgeText}>Insumo #{index + 1}</Text>
            </View>
            <Text style={styles.itemHeaderTitle} numberOfLines={1}>
              {currentIngredient ? currentIngredient.name : 'Novo Insumo'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.btnRemove}
            onPress={() => onRemove(item.id)}
            accessibilityRole="button"
            accessibilityLabel={`Remover insumo ${index + 1}`}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={20} color={theme.colors.error} />
            <Text style={styles.btnRemoveText}>Remover</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Section 1: Insumo / Ingrediente */}
      <View style={styles.fieldset}>
        <View style={styles.fieldsetHeader}>
          <MaterialCommunityIcons
            name="food-apple-outline"
            size={20}
            color={theme.colors.primary}
          />
          <Text style={styles.fieldsetSectionTitle}>1. Seleção do Insumo</Text>
        </View>

        <IngredientSelector
          selectedIngredientId={item.selectedIngredientId}
          selectedIngredient={currentIngredient}
          onSelectIngredient={(ing) => {
            onChange({
              ...item,
              selectedIngredient: ing,
              selectedIngredientId: ing ? String(ing.id) : '',
              hasTouchedIngredient: true,
            });
          }}
          initialIngredients={availableIngredients}
          error={ingredientError}
          isRequired
          label="Insumo"
          placeholder="Buscar insumo (ex: Farinha)..."
          helperText="Busque e selecione o ingrediente do catálogo para dar entrada ou ajuste de estoque."
        />

        {/* Existing Stock Detailed Transparency Card */}
        {isAlreadyInStock && existingStockItem && (
          <ExistingStockInfoCard
            existingItem={existingStockItem}
            baseUnit={baseUnit}
            entryMode={entryMode}
            parsedQuantity={parsedQuantity}
            parsedCost={parsedCost}
            priceDecimalPlaces={priceDecimalPlaces}
            isMobile={isMobile}
          />
        )}
      </View>

      {/* Section 2: Quantidade e Custo */}
      <View style={styles.fieldset}>
        <View style={styles.fieldsetHeader}>
          <MaterialCommunityIcons name="scale-balance" size={20} color={theme.colors.primary} />
          <Text style={styles.fieldsetSectionTitle}>
            {entryMode === 'purchase' ? '2. Dados da Compra' : '2. Quantidade Física Real'}
          </Text>
        </View>

        {/* Package Helper Toggle */}
        {entryMode === 'purchase' && (
          <TouchableOpacity
            style={styles.packageHelperToggle}
            onPress={() =>
              onChange({
                ...item,
                isPackageHelperEnabled: !item.isPackageHelperEnabled,
              })
            }
            activeOpacity={0.8}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: item.isPackageHelperEnabled }}
          >
            <MaterialCommunityIcons
              name={item.isPackageHelperEnabled ? 'checkbox-marked' : 'checkbox-blank-outline'}
              size={20}
              color={theme.colors.primary}
            />
            <Text style={styles.packageHelperToggleText}>
              Calcular quantidade por pacotes / fardos
            </Text>
          </TouchableOpacity>
        )}

        {/* Package Helper Inputs */}
        {entryMode === 'purchase' && item.isPackageHelperEnabled && (
          <View style={styles.rowTwoCols}>
            <View style={[styles.fieldWrapper, styles.colFlex]}>
              <Text style={styles.label}>Nº de Pacotes</Text>
              <TextInput
                style={styles.singleInput}
                value={item.packageCount}
                onChangeText={(val) => handlePackageValuesChange(val, item.packageSize)}
                placeholder="Ex: 2"
                placeholderTextColor={theme.colors.placeholder}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.fieldWrapper, styles.colFlex]}>
              <Text style={styles.label}>Tamanho por Pacote ({baseUnit})</Text>
              <View style={styles.inputWithSuffix}>
                <TextInput
                  style={styles.textInputFlex}
                  value={item.packageSize}
                  onChangeText={(val) => handlePackageValuesChange(item.packageCount, val)}
                  placeholder="Ex: 500"
                  placeholderTextColor={theme.colors.placeholder}
                  keyboardType="numeric"
                />
                <View style={styles.suffixBadge}>
                  <Text style={styles.suffixText}>{baseUnit}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Quantity Input */}
        <View style={styles.fieldWrapper}>
          <Text style={styles.label}>
            {entryMode === 'purchase'
              ? `Quantidade Comprada (${baseUnit}) *`
              : `Saldo Físico Real (${baseUnit}) *`}
          </Text>
          <View style={styles.inputWithSuffix}>
            <TextInput
              style={styles.textInputFlex}
              value={item.quantityInput}
              onChangeText={(val) => onChange({ ...item, quantityInput: val })}
              placeholder="0"
              placeholderTextColor={theme.colors.placeholder}
              keyboardType="numeric"
            />
            <View style={styles.suffixBadge}>
              <Text style={styles.suffixText}>{baseUnit}</Text>
            </View>
          </View>
          <Text style={styles.helperText}>
            {entryMode === 'purchase'
              ? isAlreadyInStock && existingStockItem
                ? Number(existingStockItem.currentQuantity) <= 0
                  ? `Quantidade a ser adicionada para reabastecer o insumo (atualmente em falta) em ${baseUnit}.`
                  : `Quantidade que será somada ao saldo existente de ${formatQuantity(existingStockItem.currentQuantity, baseUnit)}.`
                : `Total de insumo adicionado ao estoque em ${baseUnit}.`
              : isAlreadyInStock && existingStockItem
                ? `Saldo atual registrado: ${formatQuantity(existingStockItem.currentQuantity, baseUnit)}. Digite a contagem física real após a conferência.`
                : `Contagem real de insumo disponível na cozinha em ${baseUnit}.`}
          </Text>
        </View>

        {/* Cost Input (Purchase Mode) */}
        {entryMode === 'purchase' && (
          <View style={styles.fieldWrapper}>
            <Text style={styles.label}>
              Valor Total Pago (R$) <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputWithPrefix}>
              <Text style={styles.prefixText}>R$</Text>
              <TextInput
                style={styles.textInputFlex}
                value={item.totalCostInput}
                onChangeText={(val) => onChange({ ...item, totalCostInput: val })}
                placeholder="0,00"
                placeholderTextColor={theme.colors.placeholder}
                keyboardType="numeric"
              />
            </View>
            <Text style={styles.helperText}>
              Valor total pago nesta compra (utilizado para calcular o custo unitário médio
              ponderado).
            </Text>
          </View>
        )}

        {/* Unit Cost Preview Box (Purchase Mode) */}
        {entryMode === 'purchase' && (
          <View style={styles.costSummaryBox}>
            <View style={styles.costSummaryHeader}>
              <MaterialCommunityIcons
                name="calculator-variant-outline"
                size={18}
                color={theme.colors.primary}
              />
              <Text style={styles.costSummaryTitle}>Custo por Unidade Base ({baseUnit})</Text>
            </View>
            <Text style={styles.costSummaryValue}>
              {calculatedUnitCost > 0
                ? `${formatCurrency(calculatedUnitCost, priceDecimalPlaces)} / ${baseUnit}`
                : 'R$ 0,00'}
            </Text>
            <Text style={styles.costSummaryExplainer}>
              {calculatedUnitCost > 0
                ? `Calculado a partir de ${formatCurrency(parsedCost, priceDecimalPlaces)} para ${formatQuantity(parsedQuantity, baseUnit)}.`
                : 'Preencha a quantidade e o valor total para visualizar o custo unitário.'}
            </Text>
          </View>
        )}

        {/* Expiration Date (Purchase Mode) */}
        {entryMode === 'purchase' && (
          <DateInput
            label="Data de Validade (Opcional)"
            value={item.expirationDate}
            onChangeDate={(date) => onChange({ ...item, expirationDate: date })}
            placeholder="DD/MM/AAAA"
            helperText="Se informada, você receberá avisos automáticos na tela de Estoque antes do vencimento."
            isClearable
          />
        )}

        {/* Notes (Adjustment Mode) */}
        {entryMode === 'adjustment' && (
          <View style={styles.fieldWrapper}>
            <Text style={styles.label}>Observações / Motivo (Opcional)</Text>
            <TextInput
              style={styles.textArea}
              value={item.notesInput}
              onChangeText={(val) => onChange({ ...item, notesInput: val })}
              placeholder="Ex: Contagem inicial de estoque..."
              placeholderTextColor={theme.colors.placeholder}
              maxLength={255}
              multiline
            />
          </View>
        )}
      </View>

      {/* Live Preview Section */}
      {previewItem && (
        <View style={styles.previewSection}>
          <View style={styles.previewHeaderRow}>
            <MaterialCommunityIcons
              name="eye-outline"
              size={18}
              color={theme.colors.espressoDark}
            />
            <Text style={styles.previewSectionTitle}>Prévia no Estoque</Text>
          </View>
          <Text style={styles.previewSubtitle}>Como o insumo será apresentado no seu painel:</Text>

          <StockCard
            item={previewItem}
            onAdjust={() => {}}
            onPurchase={() => {}}
            onWaste={() => {}}
          />
        </View>
      )}
    </View>
  );
}

const createStyles = (theme: AppTheme, isMobile: boolean) =>
  StyleSheet.create({
    itemContainer: {
      width: '100%',
      gap: 18,
    },
    itemContainerMulti: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.rounded.lg,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: isMobile ? 14 : 20,
      ...theme.shadows.soft,
    },
    itemHeaderBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
    },
    itemBadgeGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
      marginRight: 8,
    },
    itemBadge: {
      backgroundColor: theme.colors.surfaceContainerLow,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: theme.rounded.sm,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    itemBadgeText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.espressoDark,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    itemHeaderTitle: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.espressoDark,
      flex: 1,
    },
    btnRemove: {
      minHeight: 48,
      height: 48,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      borderRadius: theme.rounded.default,
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    btnRemoveText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.error,
    },
    fieldset: {
      width: '100%',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.rounded.md,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: isMobile ? 14 : 16,
      gap: 14,
    },
    fieldsetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
      paddingBottom: 8,
    },
    fieldsetSectionTitle: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.espressoDark,
    },
    fieldWrapper: {
      width: '100%',
    },
    label: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.espressoDark,
      marginBottom: 4,
    },
    required: {
      color: theme.colors.primary,
    },
    helperText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
      marginTop: 4,
      lineHeight: 15,
    },
    packageHelperToggle: {
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 4,
    },
    packageHelperToggleText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.espressoDark,
    },
    rowTwoCols: {
      flexDirection: isMobile ? 'column' : 'row',
      gap: 12,
      width: '100%',
    },
    colFlex: {
      flex: 1,
    },
    inputWithSuffix: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 48,
      minHeight: 48,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.default,
      backgroundColor: theme.colors.surfaceContainerLowest,
      overflow: 'hidden',
    },
    inputWithPrefix: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 48,
      minHeight: 48,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.default,
      backgroundColor: theme.colors.surfaceContainerLowest,
      paddingLeft: 12,
      overflow: 'hidden',
    },
    singleInput: {
      height: 48,
      minHeight: 48,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.default,
      backgroundColor: theme.colors.surfaceContainerLowest,
      paddingHorizontal: 12,
      fontSize: 15,
      color: theme.colors.text,
      fontFamily: theme.typography.bodyMd.fontFamily,
    },
    prefixText: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
      marginRight: 4,
    },
    textInputFlex: {
      flex: 1,
      height: '100%',
      paddingHorizontal: 12,
      fontSize: 15,
      color: theme.colors.text,
      fontFamily: theme.typography.bodyMd.fontFamily,
    },
    suffixBadge: {
      backgroundColor: theme.colors.surfaceContainerLow,
      height: '100%',
      paddingHorizontal: 12,
      justifyContent: 'center',
      alignItems: 'center',
      borderLeftWidth: 1,
      borderLeftColor: theme.colors.outlineVariant,
    },
    suffixText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.espressoDark,
    },
    textArea: {
      minHeight: 70,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.default,
      backgroundColor: theme.colors.surfaceContainerLowest,
      padding: 10,
      fontSize: 14,
      color: theme.colors.text,
      fontFamily: theme.typography.bodyMd.fontFamily,
      textAlignVertical: 'top',
    },
    costSummaryBox: {
      backgroundColor: theme.colors.parchment,
      borderRadius: theme.rounded.default,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: 12,
      gap: 4,
    },
    costSummaryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    costSummaryTitle: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.espressoDark,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    costSummaryValue: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.tertiary,
      marginVertical: 2,
    },
    costSummaryExplainer: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 15,
    },
    previewSection: {
      width: '100%',
      backgroundColor: theme.colors.surfaceContainerLow,
      borderRadius: theme.rounded.md,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: 14,
      gap: 10,
    },
    previewHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    previewSectionTitle: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.colors.espressoDark,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    previewSubtitle: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 4,
    },
  });
