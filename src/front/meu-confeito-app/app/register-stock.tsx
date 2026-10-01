import { useMemo, useState } from 'react';
import {
  Alert,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

import { Stack, router } from 'expo-router';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { ActivityIndicator } from 'react-native-paper';

import { CustomButton, DateInput, IngredientSelector, StockCard } from '@/src/components';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { useIngredients } from '@/src/hooks/useIngredients';
import { useInventory } from '@/src/hooks/useInventory';
import { AppTheme } from '@/src/theme/themes';
import { InventoryItem } from '@/src/types/inventory';
import { formatCurrency, formatDateForApi, formatQuantity } from '@/src/utils/formatters';

type EntryMode = 'purchase' | 'adjustment';

export default function RegisterStockScreen() {
  const { theme } = useThemeMode();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const { ingredients: availableIngredients, refetch: refetchIngredients } = useIngredients();
  const {
    inventory,
    registerPurchase,
    registerAdjustment,
    refetch: refetchInventory,
  } = useInventory();

  // Mode: purchase (with cost & avg calculation) or initial adjustment (only balance)
  const [entryMode, setEntryMode] = useState<EntryMode>('purchase');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refetchIngredients(), refetchInventory()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Form Fields
  const [selectedIngredientId, setSelectedIngredientId] = useState('');
  const [quantityInput, setQuantityInput] = useState('');
  const [totalCostInput, setTotalCostInput] = useState('');
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const [notesInput, setNotesInput] = useState('');

  // Package calculation helper
  const [isPackageHelperEnabled, setIsPackageHelperEnabled] = useState(false);
  const [packageCount, setPackageCount] = useState('1');
  const [packageSize, setPackageSize] = useState('');

  const [hasTouchedIngredient, setHasTouchedIngredient] = useState(false);

  // Find the selected ingredient object
  const selectedIngredient = useMemo(() => {
    return (
      availableIngredients.find((ing) => String(ing.id) === String(selectedIngredientId)) || null
    );
  }, [availableIngredients, selectedIngredientId]);

  const baseUnit = selectedIngredient?.baseUnit || 'un';

  // Check if ingredient already exists in current user inventory
  const existingStockItem = useMemo(() => {
    if (!selectedIngredientId) return null;
    return (
      inventory.find((item) => String(item.ingredientId) === String(selectedIngredientId)) || null
    );
  }, [inventory, selectedIngredientId]);

  const isAlreadyInStock = Boolean(existingStockItem);

  // Sync package helper with quantityInput
  const handlePackageValuesChange = (newCountStr: string, newSizeStr: string) => {
    const count = parseFloat(newCountStr.replace(',', '.')) || 0;
    const size = parseFloat(newSizeStr.replace(',', '.')) || 0;

    if (count > 0 && size > 0) {
      setQuantityInput(String(count * size));
    }
  };

  // Parsed numerical values
  const parsedQuantity = parseFloat(quantityInput.replace(',', '.')) || 0;
  const parsedCost = parseFloat(totalCostInput.replace(',', '.')) || 0;

  // Calculated unit cost preview
  const calculatedUnitCost = parsedQuantity > 0 && parsedCost > 0 ? parsedCost / parsedQuantity : 0;

  // Validation
  const ingredientError = useMemo(() => {
    if (!hasTouchedIngredient) return '';
    if (!selectedIngredientId) return 'Selecione um ingrediente da lista.';
    return '';
  }, [hasTouchedIngredient, selectedIngredientId]);

  // Mock item for live preview card
  const previewItem: InventoryItem | null = useMemo(() => {
    if (!selectedIngredient) return null;

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
      ingredientId: Number(selectedIngredient.id),
      currentQuantity: finalQty,
      costPerBaseUnit: finalCost,
      expirationDate: expirationDate ? (formatDateForApi(expirationDate) ?? null) : null,
      lastUpdated: new Date(),
      ingredient: {
        id: Number(selectedIngredient.id),
        name: selectedIngredient.name,
        slug: selectedIngredient.slug || '',
        category: selectedIngredient.category,
        baseDimension: selectedIngredient.baseDimension || 'MASS',
        baseUnit: selectedIngredient.baseUnit || 'un',
        description: selectedIngredient.description || null,
      },
    };
  }, [
    selectedIngredient,
    existingStockItem,
    parsedQuantity,
    calculatedUnitCost,
    entryMode,
    parsedCost,
    expirationDate,
  ]);

  const handleSubmit = async () => {
    setHasTouchedIngredient(true);

    if (!selectedIngredientId) {
      Alert.alert('Campo Obrigatório', 'Selecione um ingrediente da lista para continuar.');
      return;
    }

    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      Alert.alert('Quantidade Inválida', 'A quantidade deve ser um valor numérico maior que zero.');
      return;
    }

    // Format optional expiration date for API request format (YYYY-MM-DD)
    const formattedExpDate = formatDateForApi(expirationDate);

    try {
      setIsSubmitting(true);

      if (entryMode === 'purchase') {
        if (isNaN(parsedCost) || parsedCost <= 0) {
          Alert.alert(
            'Custo Inválido',
            'Informe o custo total pago nesta compra para cálculo do custo unitário.',
          );
          setIsSubmitting(false);
          return;
        }

        await registerPurchase({
          ingredientId: Number(selectedIngredientId),
          quantity: parsedQuantity,
          totalCost: parsedCost,
          expirationDate: formattedExpDate,
        });

        Alert.alert('Sucesso!', 'Entrada de compra registrada com sucesso!', [
          {
            text: 'Ver Estoque',
            onPress: () => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/stock');
              }
            },
          },
        ]);
      } else {
        // Adjustment mode
        await registerAdjustment({
          ingredientId: Number(selectedIngredientId),
          realQuantity: parsedQuantity,
          notes: notesInput.trim() || undefined,
        });

        Alert.alert('Sucesso!', 'Saldo de estoque ajustado com sucesso!', [
          {
            text: 'Ver Estoque',
            onPress: () => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/stock');
              }
            },
          },
        ]);
      }
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
      const msg =
        apiErr?.response?.data?.message ||
        apiErr?.message ||
        'Não foi possível registrar o item no estoque. Tente novamente.';
      Alert.alert('Erro ao registrar', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const styles = useMemo(() => createStyles(theme, isMobile), [theme, isMobile]);

  return (
    <>
      <Stack.Screen options={{ title: 'Cadastrar no Estoque' }} />

      <KeyboardAwareScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bottomOffset={64}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        <View style={styles.card}>
          {/* Header section */}
          <View style={styles.headerArea}>
            <View style={styles.headerIconContainer}>
              <MaterialCommunityIcons
                name="package-variant-closed-plus"
                size={30}
                color={theme.colors.primary}
              />
            </View>
            <Text style={styles.headline}>Entrada no Estoque</Text>
            <Text style={styles.subheadline}>
              Cadastre a compra ou o saldo inicial dos insumos que você utiliza na cozinha.
            </Text>
          </View>

          {/* Entry Mode Selector */}
          <View style={styles.modeTabs}>
            <TouchableOpacity
              style={[styles.modeTab, entryMode === 'purchase' && styles.modeTabActive]}
              onPress={() => setEntryMode('purchase')}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="cart-plus"
                size={18}
                color={entryMode === 'purchase' ? theme.colors.primary : theme.colors.text}
              />
              <Text
                style={[styles.modeTabText, entryMode === 'purchase' && styles.modeTabTextActive]}
              >
                Registrar Compra
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeTab, entryMode === 'adjustment' && styles.modeTabActive]}
              onPress={() => setEntryMode('adjustment')}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="tune-variant"
                size={18}
                color={entryMode === 'adjustment' ? theme.colors.primary : theme.colors.text}
              />
              <Text
                style={[styles.modeTabText, entryMode === 'adjustment' && styles.modeTabTextActive]}
              >
                Ajuste de Saldo
              </Text>
            </TouchableOpacity>
          </View>

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
              selectedIngredientId={selectedIngredientId}
              selectedIngredient={selectedIngredient}
              onSelectIngredient={(ing) => {
                setSelectedIngredientId(ing ? String(ing.id) : '');
                setHasTouchedIngredient(true);
              }}
              initialIngredients={availableIngredients}
              error={ingredientError}
              isRequired
              label="Insumo"
              placeholder="Buscar insumo (ex: Farinha)..."
              helperText="Busque e selecione o ingrediente do catálogo para dar entrada ou ajuste de estoque."
            />

            {/* Existing Stock Alert */}
            {isAlreadyInStock && existingStockItem && (
              <View style={styles.existingStockBanner}>
                <MaterialCommunityIcons
                  name="information-outline"
                  size={18}
                  color={theme.colors.primary}
                />
                <View style={styles.existingStockTextContainer}>
                  <Text style={styles.existingStockTitle}>Item já possui estoque:</Text>
                  <Text style={styles.existingStockDetail}>
                    Saldo atual: {formatQuantity(existingStockItem.currentQuantity, baseUnit)} |
                    Custo médio: {formatCurrency(Number(existingStockItem.costPerBaseUnit) || 0)} /{' '}
                    {baseUnit}
                  </Text>
                </View>
              </View>
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
                onPress={() => setIsPackageHelperEnabled(!isPackageHelperEnabled)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name={isPackageHelperEnabled ? 'checkbox-marked' : 'checkbox-blank-outline'}
                  size={20}
                  color={theme.colors.primary}
                />
                <Text style={styles.packageHelperToggleText}>
                  Calcular quantidade por pacotes / fardos
                </Text>
              </TouchableOpacity>
            )}

            {/* Package Helper Inputs */}
            {entryMode === 'purchase' && isPackageHelperEnabled && (
              <View style={styles.rowTwoCols}>
                <View style={[styles.fieldWrapper, styles.colFlex]}>
                  <Text style={styles.label}>Nº de Pacotes</Text>
                  <TextInput
                    style={styles.singleInput}
                    value={packageCount}
                    onChangeText={(val) => {
                      setPackageCount(val);
                      handlePackageValuesChange(val, packageSize);
                    }}
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
                      value={packageSize}
                      onChangeText={(val) => {
                        setPackageSize(val);
                        handlePackageValuesChange(packageCount, val);
                      }}
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
                  value={quantityInput}
                  onChangeText={setQuantityInput}
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
                  ? `Total de insumo adicionado ao estoque em ${baseUnit}.`
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
                    value={totalCostInput}
                    onChangeText={setTotalCostInput}
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

            {/* Unit Cost Preview Box */}
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
                    ? `${formatCurrency(calculatedUnitCost)} / ${baseUnit}`
                    : 'R$ 0,00'}
                </Text>
                <Text style={styles.costSummaryExplainer}>
                  {calculatedUnitCost > 0
                    ? `Calculado a partir de ${formatCurrency(parsedCost)} para ${formatQuantity(parsedQuantity, baseUnit)}.`
                    : 'Preencha a quantidade e o valor total para visualizar o custo unitário.'}
                </Text>
              </View>
            )}

            {/* Expiration Date (Purchase Mode) */}
            {entryMode === 'purchase' && (
              <DateInput
                label="Data de Validade (Opcional)"
                value={expirationDate}
                onChangeDate={setExpirationDate}
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
                  value={notesInput}
                  onChangeText={setNotesInput}
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
              <Text style={styles.previewSubtitle}>
                Como o insumo será apresentado no seu painel:
              </Text>

              <StockCard
                item={previewItem}
                onAdjust={() => {}}
                onPurchase={() => {}}
                onWaste={() => {}}
              />
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            {isSubmitting ? (
              <ActivityIndicator size="large" color={theme.colors.primary} />
            ) : (
              <CustomButton
                title={
                  entryMode === 'purchase' ? 'Salvar Compra no Estoque' : 'Salvar Ajuste de Estoque'
                }
                variant="primary"
                onPress={handleSubmit}
                style={styles.btnSubmit}
              />
            )}

            <CustomButton
              title="Cancelar"
              variant="secondary"
              onPress={() => router.back()}
              style={styles.btnCancel}
            />
          </View>
        </View>
      </KeyboardAwareScrollView>
    </>
  );
}

const createStyles = (theme: AppTheme, isMobile: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContainer: {
      flexGrow: 1,
      alignItems: 'center',
      paddingHorizontal: isMobile ? 16 : 24,
      paddingTop: 16,
      paddingBottom: 80,
    },
    card: {
      width: '100%',
      maxWidth: 620,
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.rounded.lg,
      padding: isMobile ? 16 : 24,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      ...theme.shadows.soft,
      gap: 18,
    },
    headerArea: {
      alignItems: 'center',
      marginBottom: 2,
    },
    headerIconContainer: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: theme.colors.surfaceContainerLow,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      marginBottom: 10,
    },
    headline: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 22,
      fontWeight: 'bold',
      color: theme.colors.espressoDark,
      textAlign: 'center',
      marginBottom: 4,
    },
    subheadline: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      lineHeight: 18,
      paddingHorizontal: 8,
    },
    modeTabs: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surfaceContainerLow,
      borderRadius: theme.rounded.md,
      padding: 4,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    modeTab: {
      flex: 1,
      minHeight: 48,
      height: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.rounded.sm,
      gap: 8,
    },
    modeTabActive: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      ...theme.shadows.soft,
    },
    modeTabText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
    },
    modeTabTextActive: {
      color: theme.colors.primary,
      fontWeight: '700',
    },
    fieldset: {
      width: '100%',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.rounded.md,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: 16,
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
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
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
    existingStockBanner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      backgroundColor: theme.colors.parchment,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.default,
      padding: 10,
      marginTop: 8,
    },
    existingStockTextContainer: {
      flex: 1,
    },
    existingStockTitle: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.espressoDark,
    },
    existingStockDetail: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
    },
    helperText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
      marginTop: 4,
      lineHeight: 15,
    },
    errorText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 11,
      color: theme.colors.error,
      fontWeight: '500',
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
    actionButtonsContainer: {
      width: '100%',
      gap: 10,
      marginTop: 4,
    },
    btnSubmit: {
      width: '100%',
      height: 50,
      minHeight: 48,
      borderRadius: theme.rounded.default,
      margin: 0,
    },
    btnCancel: {
      width: '100%',
      height: 50,
      minHeight: 48,
      borderRadius: theme.rounded.default,
      margin: 0,
    },
  });
