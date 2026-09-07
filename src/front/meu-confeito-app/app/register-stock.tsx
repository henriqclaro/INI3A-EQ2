import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

import { Stack, router } from 'expo-router';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Picker } from '@react-native-picker/picker';
import { ActivityIndicator } from 'react-native-paper';

import { CustomButton, Input, StockCard } from '@/src/components';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { useIngredients } from '@/src/hooks/useIngredients';
import { useInventory } from '@/src/hooks/useInventory';
import { AppTheme } from '@/src/theme/themes';
import { InventoryItem } from '@/src/types/inventory';
import { formatCurrency, formatQuantity } from '@/src/utils/formatters';

type EntryMode = 'purchase' | 'adjustment';

export default function RegisterStockScreen() {
  const { theme } = useThemeMode();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const {
    ingredients: availableIngredients,
    isLoading: isLoadingIngredients,
    refetch: refetchIngredients,
  } = useIngredients();
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
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [selectedIngredientId, setSelectedIngredientId] = useState('');
  const [quantityInput, setQuantityInput] = useState('');
  const [totalCostInput, setTotalCostInput] = useState('');
  const [expirationDateInput, setExpirationDateInput] = useState('');
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

  // Filter available ingredients for the dropdown
  const filteredAvailableIngredients = useMemo(() => {
    if (!ingredientSearch.trim()) return availableIngredients;
    const searchLower = ingredientSearch.toLowerCase();
    return availableIngredients.filter((ing) => {
      const hasMatchingName = Boolean(ing.name?.toLowerCase().includes(searchLower));
      const hasMatchingCategory = Boolean(ing.category?.toLowerCase().includes(searchLower));
      return hasMatchingName || hasMatchingCategory;
    });
  }, [availableIngredients, ingredientSearch]);

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
      expirationDate: expirationDateInput.trim() || null,
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
    expirationDateInput,
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

    // Format optional expiration date
    let formattedExpDate: string | undefined = undefined;
    if (expirationDateInput.trim()) {
      const cleaned = expirationDateInput.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
        formattedExpDate = cleaned;
      } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleaned)) {
        const [d, m, y] = cleaned.split('/');
        formattedExpDate = `${y}-${m}-${d}`;
      } else {
        Alert.alert(
          'Data Inválida',
          'A data de validade deve estar no formato DD/MM/AAAA ou AAAA-MM-DD.',
        );
        return;
      }
    }

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

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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
                  style={[
                    styles.modeTabText,
                    entryMode === 'adjustment' && styles.modeTabTextActive,
                  ]}
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

              {/* Filter / Search input */}
              <View style={styles.fieldWrapper}>
                <Text style={styles.label}>Filtrar Insumo</Text>
                <Input
                  value={ingredientSearch}
                  onChangeText={setIngredientSearch}
                  placeholder="Digite para filtrar a lista..."
                  isClearable
                  onClear={() => setIngredientSearch('')}
                  containerStyle={styles.filterInput}
                  leftIcon={
                    <MaterialCommunityIcons
                      name="magnify"
                      size={18}
                      color={theme.colors.placeholder}
                    />
                  }
                />
              </View>

              {/* Ingredient Picker */}
              <View style={styles.fieldWrapper}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>
                    Insumo <Text style={styles.required}>*</Text>
                  </Text>
                  {isLoadingIngredients && (
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                  )}
                </View>

                <View
                  style={[
                    styles.pickerWrapper,
                    Boolean(ingredientError) && styles.pickerError,
                    Boolean(selectedIngredientId && !ingredientError) && styles.pickerSuccess,
                  ]}
                >
                  <Picker
                    selectedValue={selectedIngredientId}
                    onValueChange={(val) => {
                      setSelectedIngredientId(String(val));
                      setHasTouchedIngredient(true);
                    }}
                    style={styles.picker}
                    dropdownIconColor={theme.colors.text}
                  >
                    <Picker.Item label="Selecione um insumo..." value="" />
                    {filteredAvailableIngredients.map((ing) => {
                      const inStockTag = inventory.some(
                        (i) => String(i.ingredientId) === String(ing.id),
                      )
                        ? ' (Já cadastrado)'
                        : '';
                      return (
                        <Picker.Item
                          key={ing.id}
                          label={`${ing.name} [${ing.category}] (${ing.baseUnit || 'un'})${inStockTag}`}
                          value={String(ing.id)}
                        />
                      );
                    })}
                  </Picker>
                </View>

                {ingredientError ? (
                  <View style={styles.helperRow}>
                    <MaterialCommunityIcons
                      name="alert-circle-outline"
                      size={14}
                      color={theme.colors.primary}
                    />
                    <Text style={styles.errorText}>{ingredientError}</Text>
                  </View>
                ) : selectedIngredient ? (
                  <View style={styles.tagRow}>
                    <View style={styles.categoryChip}>
                      <Text style={styles.categoryChipText}>{selectedIngredient.category}</Text>
                    </View>
                    <View style={styles.unitChip}>
                      <Text style={styles.unitChipText}>Unidade Base: {baseUnit}</Text>
                    </View>
                  </View>
                ) : null}

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
                        Custo médio:{' '}
                        {formatCurrency(Number(existingStockItem.costPerBaseUnit) || 0)} /{' '}
                        {baseUnit}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* Section 2: Quantidade e Custo */}
            <View style={styles.fieldset}>
              <View style={styles.fieldsetHeader}>
                <MaterialCommunityIcons
                  name="scale-balance"
                  size={20}
                  color={theme.colors.primary}
                />
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
                <View style={styles.fieldWrapper}>
                  <Text style={styles.label}>Data de Validade (Opcional)</Text>
                  <TextInput
                    style={styles.singleInput}
                    value={expirationDateInput}
                    onChangeText={setExpirationDateInput}
                    placeholder="DD/MM/AAAA ou AAAA-MM-DD"
                    placeholderTextColor={theme.colors.placeholder}
                  />
                  <Text style={styles.helperText}>
                    Se informada, você receberá avisos automáticos na tela de Estoque antes do
                    vencimento.
                  </Text>
                </View>
              )}

              {/* Notes (Adjustment Mode) */}
              {entryMode === 'adjustment' && (
                <View style={styles.fieldWrapper}>
                  <Text style={styles.label}>Observações / Motivo (Opcional)</Text>
                  <TextInput
                    style={styles.textArea}
                    value={notesInput}
                    onChangeText={setNotesInput}
                    placeholder="Ex: Contagem inicial de estoque, acerto de inventário..."
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
                  <MaterialCommunityIcons name="eye-outline" size={18} color={theme.colors.text} />
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
                    entryMode === 'purchase'
                      ? 'Salvar Compra no Estoque'
                      : 'Salvar Ajuste de Estoque'
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
        </ScrollView>
      </KeyboardAvoidingView>
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
      backgroundColor: theme.colors.pitchBackground,
      borderRadius: 16,
      padding: isMobile ? 16 : 24,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
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
      backgroundColor: theme.colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      marginBottom: 10,
    },
    headline: {
      fontFamily: 'Playfair Display SC',
      fontSize: 22,
      fontWeight: 'bold',
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: 4,
    },
    subheadline: {
      fontFamily: 'Inter',
      fontSize: 13,
      color: theme.colors.text,
      opacity: 0.8,
      textAlign: 'center',
      lineHeight: 18,
      paddingHorizontal: 8,
    },
    modeTabs: {
      flexDirection: 'row',
      backgroundColor: theme.colors.background,
      borderRadius: 10,
      padding: 4,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    modeTab: {
      flex: 1,
      height: 42,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
      gap: 8,
    },
    modeTabActive: {
      backgroundColor: theme.colors.pitchBackground,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    modeTabText: {
      fontFamily: 'Inter',
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.text,
    },
    modeTabTextActive: {
      color: theme.colors.primary,
      fontWeight: '700',
    },
    fieldset: {
      width: '100%',
      backgroundColor: theme.colors.pitchBackground,
      borderRadius: 12,
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
      fontFamily: 'Playfair Display SC',
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.text,
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
      fontFamily: 'Inter',
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 4,
    },
    required: {
      color: theme.colors.primary,
    },
    filterInput: {
      width: '100%',
      height: 46,
      margin: 0,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.pitchBackground,
    },
    pickerWrapper: {
      width: '100%',
      height: 50,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.pitchBackground,
      justifyContent: 'center',
      overflow: 'hidden',
    },
    pickerError: {
      borderColor: theme.colors.primary,
      borderWidth: 1.5,
    },
    pickerSuccess: {
      borderColor: theme.colors.success,
    },
    picker: {
      width: '100%',
      color: theme.colors.text,
    },
    tagRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 6,
    },
    categoryChip: {
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.secBorder,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 9999,
    },
    categoryChipText: {
      fontFamily: 'Inter',
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.text,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    unitChip: {
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 9999,
    },
    unitChipText: {
      fontFamily: 'Inter',
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.text,
    },
    existingStockBanner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.secBorder,
      borderRadius: 8,
      padding: 10,
      marginTop: 8,
    },
    existingStockTextContainer: {
      flex: 1,
    },
    existingStockTitle: {
      fontFamily: 'Inter',
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.text,
    },
    existingStockDetail: {
      fontFamily: 'Inter',
      fontSize: 11,
      color: theme.colors.text,
      opacity: 0.8,
      marginTop: 2,
    },
    helperRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
      gap: 4,
    },
    helperText: {
      fontFamily: 'Inter',
      fontSize: 11,
      color: theme.colors.placeholder,
      marginTop: 4,
      lineHeight: 15,
    },
    errorText: {
      fontFamily: 'Inter',
      fontSize: 11,
      color: theme.colors.primary,
      fontWeight: '500',
    },
    packageHelperToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 4,
    },
    packageHelperToggleText: {
      fontFamily: 'Inter',
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.text,
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
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: 8,
      backgroundColor: theme.colors.pitchBackground,
      overflow: 'hidden',
    },
    inputWithPrefix: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 48,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: 8,
      backgroundColor: theme.colors.pitchBackground,
      paddingLeft: 12,
      overflow: 'hidden',
    },
    singleInput: {
      height: 48,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: 8,
      backgroundColor: theme.colors.pitchBackground,
      paddingHorizontal: 12,
      fontSize: 15,
      color: theme.colors.text,
    },
    prefixText: {
      fontFamily: 'Inter',
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.placeholder,
      marginRight: 4,
    },
    textInputFlex: {
      flex: 1,
      height: '100%',
      paddingHorizontal: 12,
      fontSize: 15,
      color: theme.colors.text,
    },
    suffixBadge: {
      backgroundColor: theme.colors.background,
      height: '100%',
      paddingHorizontal: 12,
      justifyContent: 'center',
      alignItems: 'center',
      borderLeftWidth: 1,
      borderLeftColor: theme.colors.outlineVariant,
    },
    suffixText: {
      fontFamily: 'Inter',
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.text,
    },
    textArea: {
      minHeight: 70,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: 8,
      backgroundColor: theme.colors.pitchBackground,
      padding: 10,
      fontSize: 14,
      color: theme.colors.text,
      textAlignVertical: 'top',
    },
    costSummaryBox: {
      backgroundColor: theme.colors.background,
      borderRadius: 8,
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
      fontFamily: 'Inter',
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.text,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    costSummaryValue: {
      fontFamily: 'Inter',
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginVertical: 2,
    },
    costSummaryExplainer: {
      fontFamily: 'Inter',
      fontSize: 11,
      color: theme.colors.text,
      opacity: 0.75,
      lineHeight: 15,
    },
    previewSection: {
      width: '100%',
      backgroundColor: theme.colors.background,
      borderRadius: 12,
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
      fontFamily: 'Playfair Display SC',
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.colors.text,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    previewSubtitle: {
      fontFamily: 'Inter',
      fontSize: 12,
      color: theme.colors.text,
      opacity: 0.7,
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
      borderRadius: 8,
      margin: 0,
    },
    btnCancel: {
      width: '100%',
      height: 50,
      borderRadius: 8,
      margin: 0,
    },
  });
