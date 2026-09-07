import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

import { Image } from 'expo-image';
import { Stack, router } from 'expo-router';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Picker } from '@react-native-picker/picker';
import { ActivityIndicator } from 'react-native-paper';

import { CustomButton } from '@/src/components';
import { STANDARD_UNITS } from '@/src/constants/common-units';
import { useAuth } from '@/src/contexts/AuthContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { useIngredients } from '@/src/hooks/useIngredients';
import { useRecipeRegister, useUserRecipes } from '@/src/hooks/useRecipes';
import { AppTheme } from '@/src/theme/themes';
import { RecipeItemInput, RecipeRegisterInput, StandardUnit } from '@/src/types';

interface RecipeFormItem {
  itemType: 'INGREDIENT' | 'SUB_RECIPE';
  ingredientId: string;
  subRecipeId: string;
  quantity: string;
  unit: StandardUnit;
  displayQuantity: string;
  displayUnit: string;
  notes: string;
}

export default function CreateRecipeScreen() {
  const { theme } = useThemeMode();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 350;

  const { registerRecipe, isLoading: isSubmitting } = useRecipeRegister();
  const { ingredients: availableIngredients, isLoading: isLoadingIngredients } = useIngredients();
  const { recipes: userRecipes, isLoading: isLoadingUserRecipes } = useUserRecipes(user?.id);

  const styles = useMemo(() => createStyles(theme, isSmallScreen), [theme, isSmallScreen]);

  // Form States
  const [title, setTitle] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [baseYield, setBaseYield] = useState('');
  const [yieldUnit, setYieldUnit] = useState<StandardUnit>('UN');
  const [prepTimeMinutes, setPrepTimeMinutes] = useState('');

  // Financial / Pricing States
  const [profitMargin, setProfitMargin] = useState('');
  const [overhead, setOverhead] = useState('');
  const [hourlyLabor, setHourlyLabor] = useState('');
  const [packagingCost, setPackagingCost] = useState('');

  // Recipe Items State (BOM architecture)
  const [items, setItems] = useState<RecipeFormItem[]>([
    {
      itemType: 'INGREDIENT',
      ingredientId: '',
      subRecipeId: '',
      quantity: '',
      unit: 'G',
      displayQuantity: '',
      displayUnit: '',
      notes: '',
    },
  ]);

  // Instructions / Steps State
  const [steps, setSteps] = useState<string[]>(['']);

  // Add & Remove Items
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        itemType: 'INGREDIENT',
        ingredientId: '',
        subRecipeId: '',
        quantity: '',
        unit: 'G',
        displayQuantity: '',
        displayUnit: '',
        notes: '',
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) {
      Alert.alert('Aviso', 'A receita deve conter ao menos 1 item.');
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = <K extends keyof RecipeFormItem>(
    index: number,
    field: K,
    value: RecipeFormItem[K],
  ) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Add & Remove Steps
  const handleAddStep = () => {
    setSteps((prev) => [...prev, '']);
  };

  const handleRemoveStep = (index: number) => {
    if (steps.length === 1) {
      Alert.alert('Aviso', 'A receita deve conter ao menos 1 etapa de preparo.');
      return;
    }
    setSteps((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStepChange = (index: number, text: string) => {
    setSteps((prev) => {
      const updated = [...prev];
      updated[index] = text;
      return updated;
    });
  };

  // Submission handler
  const handleSubmit = async () => {
    if (!user?.id) {
      Alert.alert('Erro', 'Usuário não autenticado. Por favor, faça login novamente.');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Campo Obrigatório', 'Por favor, informe o título da receita.');
      return;
    }

    const parsedYield = parseFloat(baseYield.replace(',', '.'));
    if (!baseYield || isNaN(parsedYield) || parsedYield <= 0) {
      Alert.alert(
        'Campo Obrigatório',
        'Por favor, informe um rendimento base válido maior que zero.',
      );
      return;
    }

    // Validate items
    const validItems: RecipeItemInput[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const parsedQty = parseFloat(item.quantity.replace(',', '.'));

      if (item.itemType === 'INGREDIENT') {
        if (!item.ingredientId) {
          Alert.alert('Ingrediente Inválido', `Selecione o ingrediente do item #${i + 1}.`);
          return;
        }
      } else {
        if (!item.subRecipeId) {
          Alert.alert('Sub-receita Inválida', `Selecione a sub-receita do item #${i + 1}.`);
          return;
        }
      }

      if (!item.quantity || isNaN(parsedQty) || parsedQty <= 0) {
        Alert.alert('Quantidade Inválida', `Informe uma quantidade válida para o item #${i + 1}.`);
        return;
      }

      const parsedDisplayQty = item.displayQuantity.trim()
        ? parseFloat(item.displayQuantity.replace(',', '.'))
        : null;

      validItems.push({
        ingredientId: item.itemType === 'INGREDIENT' ? parseInt(item.ingredientId, 10) : null,
        subRecipeId: item.itemType === 'SUB_RECIPE' ? item.subRecipeId : null,
        quantity: parsedQty,
        unit: item.unit,
        displayQuantity:
          parsedDisplayQty && !isNaN(parsedDisplayQty) && parsedDisplayQty > 0
            ? parsedDisplayQty
            : null,
        displayUnit: item.displayUnit.trim() ? item.displayUnit.trim() : null,
        sortOrder: i,
        notes: item.notes.trim() ? item.notes.trim() : null,
      });
    }

    if (validItems.length === 0) {
      Alert.alert('Itens da Receita', 'A receita deve conter ao menos 1 item.');
      return;
    }

    // Validate steps
    const validSteps = steps
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map((text) => ({ text }));

    if (validSteps.length === 0) {
      Alert.alert('Modo de Preparo', 'Informe ao menos uma etapa no modo de preparo.');
      return;
    }

    // Format payload matching registerSchema
    const payload: RecipeRegisterInput = {
      userId: user.id,
      parentId: null,
      title: title.trim(),
      coverUrl: coverUrl.trim() ? coverUrl.trim() : null,
      instructions: {
        steps: validSteps,
      },
      baseYield: parsedYield,
      yieldUnit,
      profitMargin: profitMargin ? parseFloat(profitMargin.replace(',', '.')) : undefined,
      overhead: overhead ? parseFloat(overhead.replace(',', '.')) : undefined,
      prepTimeMinutes: prepTimeMinutes ? parseInt(prepTimeMinutes, 10) : undefined,
      hourlyLabor: hourlyLabor ? parseFloat(hourlyLabor.replace(',', '.')) : undefined,
      packagingCost: packagingCost ? parseFloat(packagingCost.replace(',', '.')) : undefined,
      items: validItems,
    };

    try {
      const res = await registerRecipe(payload);

      Alert.alert('Sucesso', 'Receita cadastrada com sucesso!', [
        {
          text: 'Visualizar',
          onPress: () => {
            if (res?.data?.recipe?.id) {
              router.replace({
                pathname: '/single-recipe',
                params: { recipeId: res.data.recipe.id },
              });
            } else {
              router.replace('/(tabs)/recipes');
            }
          },
        },
      ]);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
      const errorMsg =
        apiErr?.response?.data?.message || apiErr?.message || 'Não foi possível salvar a receita.';
      Alert.alert('Erro ao cadastrar', errorMsg);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Cadastrar Receita' }} />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets
        >
          <Text style={styles.primaryTitle}>Nova Receita</Text>
          <Text style={styles.subtitle}>
            Preencha as informações abaixo para registrar sua receita no sistema.
          </Text>

          {/* Imagem de Capa */}
          {coverUrl.trim() ? (
            <Image source={{ uri: coverUrl }} style={styles.imagePreview} contentFit="cover" />
          ) : null}

          {/* Card: Dados Básicos */}
          <View style={styles.box}>
            <Text style={styles.secondaryTitle}>Dados Básicos</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Título da Receita *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ex: Bolo de Cenoura com Chocolate"
                placeholderTextColor={theme.colors.placeholder}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>URL da Imagem de Capa (opcional)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="https://exemplo.com/imagem.jpg"
                placeholderTextColor={theme.colors.placeholder}
                value={coverUrl}
                onChangeText={setCoverUrl}
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.flex1]}>
                <Text style={styles.label}>Rendimento Base *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ex: 12"
                  placeholderTextColor={theme.colors.placeholder}
                  keyboardType="numeric"
                  value={baseYield}
                  onChangeText={setBaseYield}
                />
              </View>

              <View style={[styles.inputGroup, styles.flex1]}>
                <Text style={styles.label}>Unidade Rendimento *</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={yieldUnit}
                    onValueChange={(val) => setYieldUnit(val as StandardUnit)}
                    style={styles.picker}
                    dropdownIconColor={theme.colors.text}
                  >
                    {STANDARD_UNITS.map((u) => (
                      <Picker.Item key={u.value} label={u.label} value={u.value} />
                    ))}
                  </Picker>
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tempo de Preparo (minutos)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ex: 45"
                placeholderTextColor={theme.colors.placeholder}
                keyboardType="numeric"
                value={prepTimeMinutes}
                onChangeText={setPrepTimeMinutes}
              />
            </View>
          </View>

          {/* Card: Custos e Precificação */}
          <View style={styles.box}>
            <Text style={styles.secondaryTitle}>Precificação e Custos</Text>
            <Text style={styles.boxHelperText}>
              Parâmetros opcionais para cálculo automático de custos e precificação.
            </Text>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.flex1]}>
                <Text style={styles.label}>Margem de Lucro (%)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ex: 30"
                  placeholderTextColor={theme.colors.placeholder}
                  keyboardType="numeric"
                  value={profitMargin}
                  onChangeText={setProfitMargin}
                />
              </View>

              <View style={[styles.inputGroup, styles.flex1]}>
                <Text style={styles.label}>Custos Fixos / Overhead (%)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ex: 10"
                  placeholderTextColor={theme.colors.placeholder}
                  keyboardType="numeric"
                  value={overhead}
                  onChangeText={setOverhead}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.flex1]}>
                <Text style={styles.label}>Mão de Obra / Hora (R$)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ex: 20.00"
                  placeholderTextColor={theme.colors.placeholder}
                  keyboardType="numeric"
                  value={hourlyLabor}
                  onChangeText={setHourlyLabor}
                />
              </View>

              <View style={[styles.inputGroup, styles.flex1]}>
                <Text style={styles.label}>Custo de Embalagem (R$)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ex: 2.50"
                  placeholderTextColor={theme.colors.placeholder}
                  keyboardType="numeric"
                  value={packagingCost}
                  onChangeText={setPackagingCost}
                />
              </View>
            </View>
          </View>

          {/* Card: Itens da Receita (Ingredientes e Sub-receitas) */}
          <View style={styles.box}>
            <View style={styles.boxHeaderRow}>
              <Text style={styles.secondaryTitle}>Itens da Receita *</Text>
              {(isLoadingIngredients || isLoadingUserRecipes) && (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              )}
            </View>
            <Text style={styles.boxHelperText}>
              Adicione os insumos necessários. Você pode incluir ingredientes do catálogo ou
              sub-receitas já cadastradas.
            </Text>

            {items.map((item, index) => (
              <View key={index} style={styles.ingredientCard}>
                <View style={styles.ingredientCardHeader}>
                  <Text style={styles.ingredientIndexText}>Item #{index + 1}</Text>
                  {items.length > 1 && (
                    <TouchableOpacity
                      onPress={() => handleRemoveItem(index)}
                      style={styles.removeBtn}
                      accessibilityRole="button"
                      accessibilityLabel={`Remover item ${index + 1}`}
                    >
                      <MaterialCommunityIcons
                        name="trash-can-outline"
                        size={20}
                        color={theme.colors.primary}
                      />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Tipo de Item (Ingrediente ou Sub-receita) */}
                <View style={styles.itemTypeRow}>
                  <TouchableOpacity
                    style={[
                      styles.itemTypeBtn,
                      item.itemType === 'INGREDIENT' && styles.itemTypeBtnActive,
                    ]}
                    onPress={() => handleItemChange(index, 'itemType', 'INGREDIENT')}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons
                      name="food-apple-outline"
                      size={16}
                      color={
                        item.itemType === 'INGREDIENT'
                          ? theme.colors.secondaryText
                          : theme.colors.text
                      }
                    />
                    <Text
                      style={[
                        styles.itemTypeBtnText,
                        item.itemType === 'INGREDIENT' && styles.itemTypeBtnTextActive,
                      ]}
                    >
                      Ingrediente
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.itemTypeBtn,
                      item.itemType === 'SUB_RECIPE' && styles.itemTypeBtnActive,
                    ]}
                    onPress={() => handleItemChange(index, 'itemType', 'SUB_RECIPE')}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons
                      name="cake-variant-outline"
                      size={16}
                      color={
                        item.itemType === 'SUB_RECIPE'
                          ? theme.colors.secondaryText
                          : theme.colors.text
                      }
                    />
                    <Text
                      style={[
                        styles.itemTypeBtnText,
                        item.itemType === 'SUB_RECIPE' && styles.itemTypeBtnTextActive,
                      ]}
                    >
                      Sub-receita
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Seleção do Ingrediente ou Sub-receita */}
                {item.itemType === 'INGREDIENT' ? (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Ingrediente *</Text>
                    <View style={styles.pickerWrapper}>
                      <Picker
                        selectedValue={item.ingredientId}
                        onValueChange={(val) =>
                          handleItemChange(index, 'ingredientId', String(val))
                        }
                        style={styles.picker}
                        dropdownIconColor={theme.colors.text}
                      >
                        <Picker.Item label="Selecione um ingrediente..." value="" />
                        {availableIngredients.map((ing) => (
                          <Picker.Item
                            key={ing.id}
                            label={`${ing.name} (${ing.category})`}
                            value={String(ing.id)}
                          />
                        ))}
                      </Picker>
                    </View>
                  </View>
                ) : (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Sub-receita *</Text>
                    <View style={styles.pickerWrapper}>
                      <Picker
                        selectedValue={item.subRecipeId}
                        onValueChange={(val) => handleItemChange(index, 'subRecipeId', String(val))}
                        style={styles.picker}
                        dropdownIconColor={theme.colors.text}
                      >
                        <Picker.Item label="Selecione uma sub-receita..." value="" />
                        {userRecipes.map((r) => (
                          <Picker.Item key={r.id} label={r.title} value={r.id} />
                        ))}
                      </Picker>
                    </View>
                  </View>
                )}

                {/* Quantidade Métrica e Unidade Padrão */}
                <View style={styles.row}>
                  <View style={[styles.inputGroup, styles.flex1]}>
                    <Text style={styles.label}>Quantidade Padrão *</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Ex: 250"
                      placeholderTextColor={theme.colors.placeholder}
                      keyboardType="numeric"
                      value={item.quantity}
                      onChangeText={(val) => handleItemChange(index, 'quantity', val)}
                    />
                  </View>

                  <View style={[styles.inputGroup, styles.flex1]}>
                    <Text style={styles.label}>Unidade Padrão *</Text>
                    <View style={styles.pickerWrapper}>
                      <Picker
                        selectedValue={item.unit}
                        onValueChange={(val) =>
                          handleItemChange(index, 'unit', val as StandardUnit)
                        }
                        style={styles.picker}
                        dropdownIconColor={theme.colors.text}
                      >
                        {STANDARD_UNITS.map((u) => (
                          <Picker.Item key={u.value} label={u.label} value={u.value} />
                        ))}
                      </Picker>
                    </View>
                  </View>
                </View>

                {/* Exibição Empírica Opcional */}
                <View style={styles.row}>
                  <View style={[styles.inputGroup, styles.flex1]}>
                    <Text style={styles.label}>Qtd. Exibição (opcional)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Ex: 2"
                      placeholderTextColor={theme.colors.placeholder}
                      keyboardType="numeric"
                      value={item.displayQuantity}
                      onChangeText={(val) => handleItemChange(index, 'displayQuantity', val)}
                    />
                  </View>

                  <View style={[styles.inputGroup, styles.flex1]}>
                    <Text style={styles.label}>Unidade Exibição (opcional)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Ex: xícaras, colheres"
                      placeholderTextColor={theme.colors.placeholder}
                      value={item.displayUnit}
                      onChangeText={(val) => handleItemChange(index, 'displayUnit', val)}
                    />
                  </View>
                </View>

                {/* Observações */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Observações (opcional)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Ex: peneirado, temperatura ambiente"
                    placeholderTextColor={theme.colors.placeholder}
                    value={item.notes}
                    onChangeText={(val) => handleItemChange(index, 'notes', val)}
                  />
                </View>
              </View>
            ))}

            <CustomButton variant="dashed" style={styles.addBtn} onPress={handleAddItem}>
              <MaterialCommunityIcons name="plus" size={20} color={theme.colors.primary} />
              <Text style={styles.addBtnText}>Adicionar Item</Text>
            </CustomButton>
          </View>

          {/* Card: Modo de Preparo */}
          <View style={styles.box}>
            <Text style={styles.secondaryTitle}>Modo de Preparo *</Text>
            <Text style={styles.boxHelperText}>
              Descreva as etapas ordenadas para preparar a receita.
            </Text>

            {steps.map((stepText, index) => (
              <View key={index} style={styles.stepContainer}>
                <View style={styles.stepHeaderRow}>
                  <View style={styles.stepBadge}>
                    <Text style={styles.stepText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.stepLabel}>Etapa {index + 1}</Text>
                  {steps.length > 1 && (
                    <TouchableOpacity
                      onPress={() => handleRemoveStep(index)}
                      style={styles.removeStepBtn}
                      accessibilityRole="button"
                      accessibilityLabel={`Remover etapa ${index + 1}`}
                    >
                      <MaterialCommunityIcons
                        name="trash-can-outline"
                        size={20}
                        color={theme.colors.primary}
                      />
                    </TouchableOpacity>
                  )}
                </View>

                <TextInput
                  style={styles.stepTextInput}
                  placeholder={`Descreva a etapa ${index + 1}...`}
                  placeholderTextColor={theme.colors.placeholder}
                  multiline
                  numberOfLines={3}
                  value={stepText}
                  onChangeText={(val) => handleStepChange(index, val)}
                />
              </View>
            ))}

            <CustomButton variant="dashed" style={styles.addBtn} onPress={handleAddStep}>
              <MaterialCommunityIcons name="plus" size={20} color={theme.colors.primary} />
              <Text style={styles.addBtnText}>Adicionar Etapa</Text>
            </CustomButton>
          </View>

          {/* Botão de Salvar Receita */}
          <View style={styles.submitContainer}>
            {isSubmitting ? (
              <ActivityIndicator size="large" color={theme.colors.primary} />
            ) : (
              <CustomButton
                title="Cadastrar Receita"
                variant="primary"
                style={styles.submitBtn}
                onPress={handleSubmit}
              />
            )}
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
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 100,
      maxWidth: 700,
      alignSelf: 'center',
      width: '100%',
    },
    primaryTitle: {
      color: theme.colors.primary,
      fontFamily: 'Playfair Display SC',
      fontSize: 26,
      fontWeight: 'bold',
      marginBottom: 6,
      marginTop: 4,
    },
    subtitle: {
      fontSize: 15,
      color: theme.colors.text,
      marginBottom: 20,
      lineHeight: 22,
    },
    imagePreview: {
      width: '50%',
      aspectRatio: 4 / 3,
      alignSelf: 'center',
      borderRadius: 16,
      marginBottom: 20,
    },
    box: {
      backgroundColor: theme.colors.pitchBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.secBorder,
      marginBottom: 20,
      padding: 20,
    },
    boxHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    secondaryTitle: {
      color: theme.colors.primary,
      fontFamily: 'Playfair Display SC',
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 12,
    },
    boxHelperText: {
      fontSize: 13,
      color: theme.colors.placeholder,
      marginBottom: 16,
    },
    row: {
      flexDirection: isSmallScreen ? 'column' : 'row',
      gap: 12,
    },
    flex1: {
      flex: 1,
    },
    inputGroup: {
      marginBottom: 14,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 6,
    },
    textInput: {
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.lightGray,
      borderRadius: 8,
      paddingHorizontal: 12,
      height: 46,
      fontSize: 15,
      color: theme.colors.text,
    },
    pickerWrapper: {
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.lightGray,
      borderRadius: 8,
      height: 46,
      justifyContent: 'center',
      overflow: 'hidden',
    },
    picker: {
      width: '100%',
      color: theme.colors.text,
    },
    ingredientCard: {
      backgroundColor: theme.colors.background,
      borderRadius: 10,
      padding: 14,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: theme.colors.secBorder,
    },
    ingredientCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    ingredientIndexText: {
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    removeBtn: {
      padding: 4,
      minWidth: 48,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    itemTypeRow: {
      flexDirection: 'row',
      backgroundColor: theme.colors.pitchBackground,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.secBorder,
      padding: 3,
      marginBottom: 12,
      gap: 6,
    },
    itemTypeBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
      borderRadius: 6,
      gap: 6,
    },
    itemTypeBtnActive: {
      backgroundColor: theme.colors.primary,
    },
    itemTypeBtnText: {
      fontFamily: 'Inter',
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.text,
    },
    itemTypeBtnTextActive: {
      color: theme.colors.secondaryText,
    },
    addBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
      borderRadius: 8,
      borderWidth: 1.5,
      marginTop: 6,
      gap: 6,
    },
    addBtnText: {
      color: theme.colors.primary,
      fontSize: 15,
      fontWeight: 'bold',
    },
    stepContainer: {
      marginBottom: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.lightGray,
    },
    stepHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    stepBadge: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.colors.secondary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    stepText: {
      color: theme.colors.primary,
      fontWeight: 'bold',
      fontSize: 14,
    },
    stepLabel: {
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.colors.text,
      flex: 1,
    },
    removeStepBtn: {
      padding: 4,
      minWidth: 48,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepTextInput: {
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.lightGray,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      minHeight: 70,
      fontSize: 15,
      color: theme.colors.text,
      textAlignVertical: 'top',
    },
    submitContainer: {
      alignItems: 'center',
      marginTop: 10,
      marginBottom: 20,
    },
    submitBtn: {
      width: '100%',
      maxWidth: 350,
      height: 52,
    },
  });
