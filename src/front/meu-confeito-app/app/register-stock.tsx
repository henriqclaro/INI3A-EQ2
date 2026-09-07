import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';

import { Stack, router } from 'expo-router';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Picker } from '@react-native-picker/picker';
import { ActivityIndicator } from 'react-native-paper';

import { CustomButton, Input } from '@/src/components';
import { COMMON_UNITS } from '@/src/constants/common-units';
import { useAuth } from '@/src/contexts/AuthContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { useIngredients } from '@/src/hooks/useIngredients';
import { useUserInventory, useUserInventoryRegister } from '@/src/hooks/useUsers';
import { RegisterUserInventoryData } from '@/src/services/user';
import { AppTheme } from '@/src/theme/themes';

export default function RegisterStockScreen() {
  const { theme } = useThemeMode();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 400;

  const { ingredients: availableIngredients, isLoading: isLoadingIngredients } = useIngredients();
  const { inventories, refetch: refetchInventory } = useUserInventory(user?.id);
  const { registerInventory, isLoading: isSubmitting } = useUserInventoryRegister();

  const [ingredientSearch, setIngredientSearch] = useState('');
  const [ingredientId, setIngredientId] = useState('');
  const [measurementUnit, setMeasurementUnit] = useState('g');
  const [currentQuantity, setCurrentQuantity] = useState('');
  const [packagePrice, setPackagePrice] = useState('');
  const [packageSize, setPackageSize] = useState('');

  const [touched, setTouched] = useState({
    ingredientId: false,
    measurementUnit: false,
    currentQuantity: false,
    packagePrice: false,
    packageSize: false,
  });

  const styles = useMemo(() => createStyles(theme, isSmallScreen), [theme, isSmallScreen]);

  // Find the selected ingredient object
  const selectedIngredient = useMemo(() => {
    return availableIngredients.find((ing) => ing.id === ingredientId) || null;
  }, [availableIngredients, ingredientId]);

  // Check if ingredient already exists in current user inventory
  const isAlreadyInStock = useMemo(() => {
    if (!ingredientId) return false;
    return inventories.some((item) => item.ingredientId === ingredientId);
  }, [inventories, ingredientId]);

  // Filter available ingredients for the dropdown
  const filteredAvailableIngredients = useMemo(() => {
    if (!ingredientSearch.trim()) return availableIngredients;
    const searchLower = ingredientSearch.toLowerCase();
    return availableIngredients.filter((ing) => {
      const names = Array.isArray(ing.name) ? ing.name : [ing.name];
      const hasMatchingName = names.some((n) => n.toLowerCase().includes(searchLower));
      const hasMatchingCategory = Boolean(ing.category?.toLowerCase().includes(searchLower));
      return hasMatchingName || hasMatchingCategory;
    });
  }, [availableIngredients, ingredientSearch]);

  // Calculations for unit cost
  const calculatedCostUnit = useMemo(() => {
    const price = parseFloat(packagePrice.replace(',', '.'));
    const size = parseFloat(packageSize.replace(',', '.'));

    if (!isNaN(price) && price > 0 && !isNaN(size) && size > 0) {
      return price / size;
    }
    return 0;
  }, [packagePrice, packageSize]);

  // Validation
  const ingredientError = useMemo(() => {
    if (!touched.ingredientId) return '';
    if (!ingredientId) return 'Selecione um ingrediente da lista.';
    if (isAlreadyInStock) return 'Este ingrediente já está cadastrado no seu estoque.';
    return '';
  }, [ingredientId, isAlreadyInStock, touched.ingredientId]);

  const packageSizeError = useMemo(() => {
    if (!packageSize.trim()) return '';
    const size = parseFloat(packageSize.replace(',', '.'));
    if (isNaN(size) || size <= 0) return 'O tamanho da embalagem deve ser maior que zero.';
    return '';
  }, [packageSize]);

  const handleRegister = async () => {
    setTouched({
      ingredientId: true,
      measurementUnit: true,
      currentQuantity: true,
      packagePrice: true,
      packageSize: true,
    });

    if (!user?.id) {
      Alert.alert('Erro', 'Usuário não autenticado. Faça login para continuar.');
      return;
    }

    if (!ingredientId) {
      Alert.alert('Campo Obrigatório', 'Selecione um ingrediente para cadastrar no estoque.');
      return;
    }

    if (isAlreadyInStock) {
      Alert.alert(
        'Ingrediente Já Cadastrado',
        'Este ingrediente já consta no seu estoque. Para alterar as quantidades ou embalagem, edite o item na tela de Estoque.',
      );
      return;
    }

    const parsedQty = currentQuantity.trim() ? parseFloat(currentQuantity.replace(',', '.')) : 0;
    if (isNaN(parsedQty) || parsedQty < 0) {
      Alert.alert('Quantidade Inválida', 'A quantidade em estoque deve ser um número válido.');
      return;
    }

    const parsedPrice = packagePrice.trim()
      ? parseFloat(packagePrice.replace(',', '.'))
      : undefined;
    if (parsedPrice !== undefined && (isNaN(parsedPrice) || parsedPrice < 0)) {
      Alert.alert('Preço Inválido', 'O preço da embalagem deve ser um valor positivo.');
      return;
    }

    const parsedSize = packageSize.trim() ? parseFloat(packageSize.replace(',', '.')) : undefined;
    if (parsedSize !== undefined && (isNaN(parsedSize) || parsedSize <= 0)) {
      Alert.alert('Tamanho Inválido', 'O tamanho da embalagem deve ser maior que zero.');
      return;
    }

    const payload: RegisterUserInventoryData = {
      ingredientId,
      measurementUnit,
      currentQuantity: parsedQty,
      ...(parsedPrice !== undefined && { packagePrice: parsedPrice }),
      ...(parsedSize !== undefined && { packageSize: parsedSize }),
      ...(calculatedCostUnit > 0 && { costUnit: calculatedCostUnit }),
    };

    try {
      await registerInventory(user.id, payload);
      await refetchInventory();

      Alert.alert('Sucesso!', 'Ingrediente adicionado ao estoque com sucesso.', [
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
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
      const msg =
        apiErr?.response?.data?.message ||
        apiErr?.message ||
        'Não foi possível adicionar o ingrediente ao estoque. Tente novamente.';
      Alert.alert('Erro ao cadastrar', msg);
    }
  };

  const parsedCurrentQty = currentQuantity.trim()
    ? parseFloat(currentQuantity.replace(',', '.'))
    : 0;
  const isPreviewOutOfStock = isNaN(parsedCurrentQty) || parsedCurrentQty <= 0;

  const ingredientDisplayName = selectedIngredient
    ? Array.isArray(selectedIngredient.name)
      ? selectedIngredient.name.join(' / ')
      : String(selectedIngredient.name)
    : 'Nome do Ingrediente';

  return (
    <>
      <Stack.Screen options={{ title: 'Cadastrar no Estoque' }} />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets
        >
          {/* Main Card */}
          <View style={styles.card}>
            {/* Header section */}
            <View style={styles.headerArea}>
              <View style={styles.headerIconContainer}>
                <MaterialCommunityIcons
                  name="package-variant-closed-plus"
                  size={32}
                  color={theme.colors.primary}
                />
              </View>
              <Text style={styles.headline}>Novo Item de Estoque</Text>
              <Text style={styles.subheadline}>
                Cadastre os insumos que você utiliza na cozinha para controlar quantidades e custos.
              </Text>
            </View>

            {/* Fieldset: Ingrediente */}
            <View style={styles.fieldset}>
              <View style={styles.fieldsetHeader}>
                <MaterialCommunityIcons
                  name="food-apple-outline"
                  size={20}
                  color={theme.colors.primary}
                />
                <Text style={styles.fieldsetSectionTitle}>Ingrediente</Text>
              </View>

              {/* Filter / Search available ingredients */}
              <View style={styles.fieldWrapper}>
                <Text style={styles.label}>Filtrar Ingrediente</Text>
                <Input
                  value={ingredientSearch}
                  onChangeText={setIngredientSearch}
                  placeholder="Digite para buscar..."
                  containerStyle={styles.filterInput}
                />
              </View>

              {/* Ingredient Picker */}
              <View style={styles.fieldWrapper}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>
                    Ingrediente <Text style={styles.required}>*</Text>
                  </Text>
                  {isLoadingIngredients && (
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                  )}
                </View>

                <View
                  style={[
                    styles.pickerWrapper,
                    !!ingredientError && styles.pickerError,
                    !!ingredientId && !ingredientError && styles.pickerSuccess,
                  ]}
                >
                  <Picker
                    selectedValue={ingredientId}
                    onValueChange={(val) => {
                      setIngredientId(val);
                      setTouched((prev) => ({ ...prev, ingredientId: true }));
                    }}
                    style={styles.picker}
                    dropdownIconColor={theme.colors.text}
                  >
                    <Picker.Item label="Selecione um ingrediente..." value="" />
                    {filteredAvailableIngredients.map((ing) => {
                      const ingName = Array.isArray(ing.name)
                        ? ing.name.join(' / ')
                        : String(ing.name);
                      const inStockTag = inventories.some((i) => i.ingredientId === ing.id)
                        ? ' (Já no estoque)'
                        : '';
                      return (
                        <Picker.Item
                          key={ing.id}
                          label={`${ingName} [${ing.category}]${inStockTag}`}
                          value={ing.id}
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
                      style={styles.helperIcon}
                    />
                    <Text style={styles.errorText}>{ingredientError}</Text>
                  </View>
                ) : selectedIngredient ? (
                  <View style={styles.tagRow}>
                    <View style={styles.categoryChip}>
                      <Text style={styles.categoryChipText}>{selectedIngredient.category}</Text>
                    </View>
                  </View>
                ) : null}
              </View>

              {/* Measurement Unit */}
              <View style={styles.fieldWrapper}>
                <Text style={styles.label}>
                  Unidade de Medida <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={measurementUnit}
                    onValueChange={(val) => setMeasurementUnit(val)}
                    style={styles.picker}
                    dropdownIconColor={theme.colors.text}
                  >
                    {COMMON_UNITS.map((u) => (
                      <Picker.Item key={u.value} label={u.label} value={u.value} />
                    ))}
                  </Picker>
                </View>
                <Text style={styles.helperText}>
                  Unidade base para controle das receitas (ex: gramas, mililitros, unidades).
                </Text>
              </View>
            </View>

            {/* Fieldset: Quantidade em Estoque */}
            <View style={styles.fieldset}>
              <View style={styles.fieldsetHeader}>
                <MaterialCommunityIcons name="scale" size={20} color={theme.colors.primary} />
                <Text style={styles.fieldsetSectionTitle}>Quantidade Atual</Text>
              </View>

              <View style={styles.fieldWrapper}>
                <Text style={styles.label}>Estoque Físico Disponível</Text>
                <View style={styles.inputWithSuffix}>
                  <TextInput
                    style={styles.textInputFlex}
                    value={currentQuantity}
                    onChangeText={setCurrentQuantity}
                    placeholder="0"
                    placeholderTextColor={theme.colors.placeholder}
                    keyboardType="numeric"
                  />
                  <View style={styles.suffixBadge}>
                    <Text style={styles.suffixText}>{measurementUnit}</Text>
                  </View>
                </View>
                <Text style={styles.helperText}>
                  Quantidade que você tem agora na despensa. Deixe 0 ou em branco se estiver em
                  falta.
                </Text>
              </View>
            </View>

            {/* Fieldset: Embalagem e Custo de Compra */}
            <View style={styles.fieldset}>
              <View style={styles.fieldsetHeader}>
                <MaterialCommunityIcons
                  name="currency-usd"
                  size={20}
                  color={theme.colors.primary}
                />
                <Text style={styles.fieldsetSectionTitle}>Embalagem e Custo</Text>
              </View>

              <View style={styles.rowTwoCols}>
                <View style={[styles.fieldWrapper, styles.colFlex]}>
                  <Text style={styles.label}>Preço da Embalagem (R$)</Text>
                  <View style={styles.inputWithPrefix}>
                    <Text style={styles.prefixText}>R$</Text>
                    <TextInput
                      style={styles.textInputFlex}
                      value={packagePrice}
                      onChangeText={setPackagePrice}
                      placeholder="0,00"
                      placeholderTextColor={theme.colors.placeholder}
                      keyboardType="numeric"
                    />
                  </View>
                  <Text style={styles.helperText}>Valor pago pelo pacote</Text>
                </View>

                <View style={[styles.fieldWrapper, styles.colFlex]}>
                  <Text style={styles.label}>Tamanho da Embalagem</Text>
                  <View style={styles.inputWithSuffix}>
                    <TextInput
                      style={styles.textInputFlex}
                      value={packageSize}
                      onChangeText={setPackageSize}
                      placeholder="1"
                      placeholderTextColor={theme.colors.placeholder}
                      keyboardType="numeric"
                    />
                    <View style={styles.suffixBadge}>
                      <Text style={styles.suffixText}>{measurementUnit}</Text>
                    </View>
                  </View>
                  {packageSizeError ? (
                    <Text style={styles.errorText}>{packageSizeError}</Text>
                  ) : (
                    <Text style={styles.helperText}>Peso ou volume do pacote</Text>
                  )}
                </View>
              </View>

              {/* Auto Calculated Cost Unit Box */}
              <View style={styles.costSummaryBox}>
                <View style={styles.costSummaryHeader}>
                  <MaterialCommunityIcons
                    name="calculator-variant-outline"
                    size={18}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.costSummaryTitle}>Custo por Unidade Base</Text>
                </View>
                <Text style={styles.costSummaryValue}>
                  R${' '}
                  {calculatedCostUnit > 0
                    ? calculatedCostUnit.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 4,
                      })
                    : '0,00'}{' '}
                  <Text style={styles.costSummaryUnit}>/ {measurementUnit}</Text>
                </Text>
                <Text style={styles.costSummaryExplainer}>
                  {calculatedCostUnit > 0
                    ? `Calculado a partir de R$ ${packagePrice || '0'} para ${packageSize || '1'} ${measurementUnit}. Utilizado automaticamente no cálculo do custo das receitas.`
                    : 'Preencha o preço e tamanho do pacote para o cálculo automático de custo.'}
                </Text>
              </View>
            </View>

            {/* Live Preview Section (Matching stock.tsx) */}
            <View style={styles.previewSection}>
              <View style={styles.previewHeaderRow}>
                <MaterialCommunityIcons name="eye-outline" size={18} color={theme.colors.text} />
                <Text style={styles.previewSectionTitle}>Prévia no Estoque</Text>
              </View>
              <Text style={styles.previewSubtitle}>
                Veja como este item será exibido no seu painel de estoque:
              </Text>

              <View style={styles.previewCard}>
                <View style={styles.previewCardHeader}>
                  <Text style={styles.previewIngredientName} numberOfLines={1}>
                    {ingredientDisplayName.toUpperCase()}
                  </Text>
                  {selectedIngredient?.category && (
                    <Text style={styles.previewCategoryText}>{selectedIngredient.category}</Text>
                  )}
                </View>

                <Text style={styles.previewQuantityLabel}>Estoque atual</Text>
                <Text style={styles.previewQuantity}>
                  {parsedCurrentQty} {measurementUnit}
                </Text>

                <View style={styles.previewStatusRow}>
                  <View
                    style={[
                      styles.previewStatusDot,
                      isPreviewOutOfStock ? styles.previewStatusEmpty : styles.previewStatusOk,
                    ]}
                  />
                  <Text style={styles.previewStatusText}>
                    {isPreviewOutOfStock ? 'Em falta' : 'Estoque suficiente'}
                  </Text>
                </View>

                {parseFloat(packagePrice) > 0 && (
                  <Text style={styles.previewPackageInfo}>
                    Pacote: {packageSize || '1'} {measurementUnit} - R${' '}
                    {parseFloat(packagePrice.replace(',', '.')).toFixed(2)}
                  </Text>
                )}

                {calculatedCostUnit > 0 && (
                  <Text style={styles.previewCostInfo}>
                    Custo base: R${' '}
                    {calculatedCostUnit.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 4,
                    })}{' '}
                    / {measurementUnit}
                  </Text>
                )}
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
              {isSubmitting ? (
                <ActivityIndicator size="large" color={theme.colors.primary} />
              ) : (
                <CustomButton
                  title="Cadastrar no Estoque"
                  variant="primary"
                  onPress={handleRegister}
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

const createStyles = (theme: AppTheme, isSmallScreen: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContainer: {
      flexGrow: 1,
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 80,
    },
    card: {
      width: '100%',
      maxWidth: 580,
      backgroundColor: theme.colors.pitchBackground,
      borderRadius: 16,
      padding: isSmallScreen ? 16 : 24,
      borderWidth: 1,
      borderColor: theme.colors.secBorder,
      gap: 20,
    },
    headerArea: {
      alignItems: 'center',
      marginBottom: 4,
    },
    headerIconContainer: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.secBorder,
      marginBottom: 10,
    },
    headline: {
      fontFamily: 'Playfair Display SC',
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: 6,
    },
    subheadline: {
      fontSize: 14,
      color: theme.colors.text,
      opacity: 0.8,
      textAlign: 'center',
      lineHeight: 20,
      paddingHorizontal: 8,
    },
    fieldset: {
      width: '100%',
      backgroundColor: theme.colors.pitchBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.lightGray,
      padding: 16,
      gap: 14,
    },
    fieldsetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.secBorder,
      paddingBottom: 8,
    },
    fieldsetSectionTitle: {
      fontFamily: 'Playfair Display SC',
      fontSize: 16,
      fontWeight: 'bold',
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
      height: 44,
      margin: 0,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.lightGray,
      backgroundColor: theme.colors.pitchBackground,
    },
    pickerWrapper: {
      width: '100%',
      height: 50,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.lightGray,
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
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.text,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    helperRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    helperIcon: {
      marginRight: 4,
    },
    helperText: {
      fontSize: 11,
      color: theme.colors.placeholder,
      marginTop: 4,
      lineHeight: 15,
    },
    errorText: {
      fontSize: 11,
      color: theme.colors.primary,
      fontWeight: '500',
      marginTop: 4,
    },
    rowTwoCols: {
      flexDirection: isSmallScreen ? 'column' : 'row',
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
      borderColor: theme.colors.lightGray,
      borderRadius: 8,
      backgroundColor: theme.colors.pitchBackground,
      overflow: 'hidden',
    },
    inputWithPrefix: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 48,
      borderWidth: 1,
      borderColor: theme.colors.lightGray,
      borderRadius: 8,
      backgroundColor: theme.colors.pitchBackground,
      paddingLeft: 12,
      overflow: 'hidden',
    },
    prefixText: {
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
      borderLeftColor: theme.colors.lightGray,
    },
    suffixText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.text,
    },
    costSummaryBox: {
      backgroundColor: theme.colors.background,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.secBorder,
      padding: 12,
      gap: 4,
      marginTop: 4,
    },
    costSummaryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    costSummaryTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.text,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    costSummaryValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginVertical: 2,
    },
    costSummaryUnit: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text,
    },
    costSummaryExplainer: {
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
      borderColor: theme.colors.secBorder,
      padding: 16,
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
      fontSize: 12,
      color: theme.colors.text,
      opacity: 0.7,
    },
    previewCard: {
      backgroundColor: theme.colors.pitchBackground,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.secBorder,
      gap: 6,
    },
    previewCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.secBorder,
      paddingBottom: 6,
    },
    previewIngredientName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
      flex: 1,
      marginRight: 8,
    },
    previewCategoryText: {
      fontSize: 12,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    previewQuantityLabel: {
      fontSize: 12,
      color: theme.colors.text,
      marginTop: 2,
    },
    previewQuantity: {
      fontSize: 22,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    previewStatusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 2,
    },
    previewStatusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    previewStatusOk: {
      backgroundColor: theme.colors.success,
    },
    previewStatusEmpty: {
      backgroundColor: theme.colors.primary,
    },
    previewStatusText: {
      fontSize: 12,
      color: theme.colors.text,
    },
    previewPackageInfo: {
      fontSize: 12,
      color: theme.colors.placeholder,
      marginTop: 4,
    },
    previewCostInfo: {
      fontSize: 12,
      color: theme.colors.text,
      fontWeight: '600',
    },
    actionButtonsContainer: {
      width: '100%',
      gap: 10,
      marginTop: 6,
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
