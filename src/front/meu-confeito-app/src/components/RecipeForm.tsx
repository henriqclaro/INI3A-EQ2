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

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Picker } from '@react-native-picker/picker';
import { ActivityIndicator } from 'react-native-paper';

import { CustomButton } from '@/src/components/CustomButton';
import { IngredientSelector } from '@/src/components/IngredientSelector';
import { RecipeSelector } from '@/src/components/RecipeSelector';
import { TagSelector } from '@/src/components/TagSelector';
import { STANDARD_UNITS } from '@/src/constants/common-units';
import { useAuth } from '@/src/contexts/AuthContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { useIngredients } from '@/src/hooks/useIngredients';
import { useUserRecipes } from '@/src/hooks/useRecipes';
import { AppTheme } from '@/src/theme/themes';
import {
  FullRecipe,
  RecipeInstructionStep,
  RecipeItemInput,
  StandardUnit,
  Tag,
  TagType,
} from '@/src/types';
import { parseRecipeInstructions } from '@/src/utils/recipe';

export type RecipeInstructionStepInput = RecipeInstructionStep;

export interface RecipeFormSubmitData {
  title: string;
  coverUrl: string | null;
  instructions: { steps: RecipeInstructionStep[] } | Record<string, unknown>;
  baseYield: number;
  yieldUnit: StandardUnit;
  profitMargin?: number;
  overhead?: number;
  prepTimeMinutes?: number;
  hourlyLabor?: number;
  packagingCost?: number;
  items: RecipeItemInput[];
  tagIds?: number[];
}

export interface RecipeFormProps {
  initialRecipe?: FullRecipe;
  isEditMode?: boolean;
  isSubmitting?: boolean;
  onSubmit: (data: RecipeFormSubmitData) => Promise<void>;
  submitButtonText?: string;
}

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

export function RecipeForm({
  initialRecipe,
  isEditMode = false,
  isSubmitting = false,
  onSubmit,
  submitButtonText,
}: RecipeFormProps) {
  const { theme } = useThemeMode();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 350;

  const { ingredients: availableIngredients, isLoading: isLoadingIngredients } = useIngredients();
  const { recipes: userRecipes, isLoading: isLoadingUserRecipes } = useUserRecipes(user?.id);

  const styles = useMemo(() => createStyles(theme, isSmallScreen), [theme, isSmallScreen]);

  // Initial values setup
  const initialItems: RecipeFormItem[] = useMemo(() => {
    if (initialRecipe?.items && initialRecipe.items.length > 0) {
      return initialRecipe.items.map((item) => ({
        itemType: item.subRecipeId ? 'SUB_RECIPE' : 'INGREDIENT',
        ingredientId: item.ingredientId ? String(item.ingredientId) : '',
        subRecipeId: item.subRecipeId ? String(item.subRecipeId) : '',
        quantity:
          item.quantity !== undefined && item.quantity !== null ? String(item.quantity) : '',
        unit: (item.unit as StandardUnit) || 'G',
        displayQuantity:
          item.displayQuantity !== undefined && item.displayQuantity !== null
            ? String(item.displayQuantity)
            : '',
        displayUnit: item.displayUnit || '',
        notes: item.notes || '',
      }));
    }
    return [
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
    ];
  }, [initialRecipe]);

  const initialSteps: RecipeInstructionStep[] = useMemo(() => {
    const parsed = parseRecipeInstructions(initialRecipe?.instructions);
    if (parsed.length > 0) {
      return parsed.map((item, idx) => ({
        step: idx + 1,
        title: item.title || '',
        description: item.description || '',
      }));
    }
    return [{ step: 1, title: '', description: '' }];
  }, [initialRecipe]);

  const initialTags: Tag[] = useMemo(() => {
    if (initialRecipe?.tags && Array.isArray(initialRecipe.tags)) {
      return initialRecipe.tags.map((item) => ({
        id: typeof item.tag.id === 'string' ? parseInt(item.tag.id, 10) : item.tag.id,
        name: item.tag.name,
        type: (item.tag.type as TagType) || 'PRODUCT',
      }));
    }
    return [];
  }, [initialRecipe]);

  // Form States
  const [title, setTitle] = useState(initialRecipe?.title || '');
  const [coverUrl, setCoverUrl] = useState(initialRecipe?.coverUrl || '');
  const [baseYield, setBaseYield] = useState(
    initialRecipe?.baseYield !== undefined && initialRecipe.baseYield !== null
      ? String(initialRecipe.baseYield)
      : '',
  );
  const [yieldUnit, setYieldUnit] = useState<StandardUnit>(
    (initialRecipe?.yieldUnit as StandardUnit) || 'UN',
  );
  const [prepTimeMinutes, setPrepTimeMinutes] = useState(
    initialRecipe?.prepTimeMinutes ? String(initialRecipe.prepTimeMinutes) : '',
  );

  // Financial / Pricing States
  const [profitMargin, setProfitMargin] = useState(
    initialRecipe?.profitMargin !== undefined && initialRecipe.profitMargin !== null
      ? String(initialRecipe.profitMargin)
      : '',
  );
  const [overhead, setOverhead] = useState(
    initialRecipe?.overhead !== undefined && initialRecipe.overhead !== null
      ? String(initialRecipe.overhead)
      : '',
  );
  const [hourlyLabor, setHourlyLabor] = useState(
    initialRecipe?.hourlyLabor !== undefined && initialRecipe.hourlyLabor !== null
      ? String(initialRecipe.hourlyLabor)
      : '',
  );
  const [packagingCost, setPackagingCost] = useState(
    initialRecipe?.packagingCost !== undefined && initialRecipe.packagingCost !== null
      ? String(initialRecipe.packagingCost)
      : '',
  );

  // Recipe Items State
  const [items, setItems] = useState<RecipeFormItem[]>(initialItems);

  // Instructions / Steps State
  const [steps, setSteps] = useState<RecipeInstructionStep[]>(initialSteps);

  // Tags State
  const [selectedTags, setSelectedTags] = useState<Tag[]>(initialTags);

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
    setSteps((prev) => [
      ...prev,
      {
        step: prev.length + 1,
        title: '',
        description: '',
      },
    ]);
  };

  const handleRemoveStep = (index: number) => {
    if (steps.length === 1) {
      Alert.alert('Aviso', 'A receita deve conter ao menos 1 etapa de preparo.');
      return;
    }
    setSteps((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      return filtered.map((item, idx) => ({
        ...item,
        step: idx + 1,
      }));
    });
  };

  const handleStepChange = (index: number, field: 'title' | 'description', value: string) => {
    setSteps((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return updated;
    });
  };

  // Submission handler
  const handleSubmit = async () => {
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
      .map((s) => ({
        title: s.title.trim(),
        description: s.description.trim(),
      }))
      .filter((s) => s.title.length > 0 || s.description.length > 0)
      .map((s, idx) => ({
        step: idx + 1,
        title: s.title,
        description: s.description,
      }));

    if (validSteps.length === 0) {
      Alert.alert('Modo de Preparo', 'Informe ao menos uma etapa no modo de preparo.');
      return;
    }

    if (selectedTags.length > 5) {
      Alert.alert('Tags', 'Uma receita pode conter no máximo 5 tags.');
      return;
    }

    const payload: RecipeFormSubmitData = {
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
      tagIds: selectedTags.map((t) => t.id),
    };

    await onSubmit(payload);
  };

  const defaultButtonLabel = isEditMode ? 'Salvar Alterações' : 'Cadastrar Receita';
  const resolvedButtonText = submitButtonText || defaultButtonLabel;

  return (
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
        <Text style={styles.primaryTitle}>{isEditMode ? 'Editar Receita' : 'Nova Receita'}</Text>
        <Text style={styles.subtitle}>
          {isEditMode
            ? 'Atualize as informações da sua receita abaixo.'
            : 'Preencha as informações abaixo para registrar sua receita no sistema.'}
        </Text>

        {/* Cover Image Preview */}
        {coverUrl.trim() ? (
          <Image source={{ uri: coverUrl }} style={styles.imagePreview} contentFit="cover" />
        ) : null}

        {/* Card: Basic Data */}
        <View style={styles.box}>
          <Text style={styles.secondaryTitle}>Dados Básicos</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Título da Receita *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Ex: Bolo de Cenoura"
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
                  dropdownIconColor={theme.colors.onSurface}
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

        {/* Card: Tags Selection (up to 5 tags) */}
        <View style={styles.box}>
          <Text style={styles.secondaryTitle}>Categorização por Tags</Text>
          <TagSelector
            selectedTags={selectedTags}
            onSelectedTagsChange={setSelectedTags}
            maxTags={5}
            isDisabled={isSubmitting}
          />
        </View>

        {/* Card: Costs and Pricing */}
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
              <Text style={styles.label}>Custos Fixos (%)</Text>
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

        {/* Card: Recipe Items (Ingredients & Sub-recipes) */}
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
                      color={theme.colors.error}
                    />
                  </TouchableOpacity>
                )}
              </View>

              {/* Item Type Toggle */}
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
                        ? theme.colors.onPrimary
                        : theme.colors.onSurfaceVariant
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
                        ? theme.colors.onPrimary
                        : theme.colors.onSurfaceVariant
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

              {/* Ingredient or Sub-recipe Selection */}
              {item.itemType === 'INGREDIENT' ? (
                <View style={styles.inputGroup}>
                  <IngredientSelector
                    selectedIngredientId={item.ingredientId}
                    onSelectIngredient={(selectedIng) => {
                      handleItemChange(
                        index,
                        'ingredientId',
                        selectedIng ? String(selectedIng.id) : '',
                      );
                      if (selectedIng?.baseUnit) {
                        const matchedUnit = STANDARD_UNITS.find(
                          (u) => u.value.toUpperCase() === selectedIng.baseUnit?.toUpperCase(),
                        );
                        if (matchedUnit) {
                          handleItemChange(index, 'unit', matchedUnit.value);
                        }
                      }
                    }}
                    initialIngredients={availableIngredients}
                    label="Ingrediente"
                    placeholder="Buscar ingrediente (ex: Cacau)..."
                    isRequired
                    isDisabled={isSubmitting}
                  />
                </View>
              ) : (
                <View style={styles.inputGroup}>
                  <RecipeSelector
                    selectedRecipeId={item.subRecipeId}
                    onSelectRecipe={(selectedRec) => {
                      handleItemChange(index, 'subRecipeId', selectedRec ? selectedRec.id : '');
                    }}
                    userId={user?.id}
                    onlyUserRecipes={true}
                    excludeRecipeId={initialRecipe?.id}
                    initialRecipes={userRecipes}
                    label="Sub-receita"
                    placeholder="Buscar sub-receita (ex: Brigadeiro)..."
                    isRequired
                    isDisabled={isSubmitting}
                  />
                </View>
              )}

              {/* Standard Quantity & Unit */}
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
                      onValueChange={(val) => handleItemChange(index, 'unit', val as StandardUnit)}
                      style={styles.picker}
                      dropdownIconColor={theme.colors.onSurface}
                    >
                      {STANDARD_UNITS.map((u) => (
                        <Picker.Item key={u.value} label={u.label} value={u.value} />
                      ))}
                    </Picker>
                  </View>
                </View>
              </View>

              {/* Optional Empirical Display */}
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
                    placeholder="Ex: xícaras"
                    placeholderTextColor={theme.colors.placeholder}
                    value={item.displayUnit}
                    onChangeText={(val) => handleItemChange(index, 'displayUnit', val)}
                  />
                </View>
              </View>

              {/* Notes */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Observações (opcional)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ex: peneirado"
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

        {/* Card: Preparation Steps */}
        <View style={styles.box}>
          <Text style={styles.secondaryTitle}>Modo de Preparo *</Text>
          <Text style={styles.boxHelperText}>
            Descreva as etapas ordenadas para preparar a receita com título e descrição.
          </Text>

          {steps.map((stepItem, index) => (
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
                      color={theme.colors.error}
                    />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.stepInputGroup}>
                <Text style={styles.stepInputSubLabel}>Título da Etapa (opcional)</Text>
                <TextInput
                  style={styles.stepTitleInput}
                  placeholder="Ex: Preparo da Massa, Recheio..."
                  placeholderTextColor={theme.colors.placeholder}
                  value={stepItem.title}
                  onChangeText={(val) => handleStepChange(index, 'title', val)}
                />
              </View>

              <View style={styles.stepInputGroup}>
                <Text style={styles.stepInputSubLabel}>Descrição da Etapa *</Text>
                <TextInput
                  style={styles.stepTextInput}
                  placeholder={`Descreva a etapa ${index + 1}...`}
                  placeholderTextColor={theme.colors.placeholder}
                  multiline
                  numberOfLines={3}
                  value={stepItem.description}
                  onChangeText={(val) => handleStepChange(index, 'description', val)}
                />
              </View>
            </View>
          ))}

          <CustomButton variant="dashed" style={styles.addBtn} onPress={handleAddStep}>
            <MaterialCommunityIcons name="plus" size={20} color={theme.colors.primary} />
            <Text style={styles.addBtnText}>Adicionar Etapa</Text>
          </CustomButton>
        </View>

        {/* Submit Button */}
        <View style={styles.submitContainer}>
          {isSubmitting ? (
            <ActivityIndicator size="large" color={theme.colors.primary} />
          ) : (
            <CustomButton
              title={resolvedButtonText}
              variant="primary"
              style={styles.submitBtn}
              onPress={handleSubmit}
            />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
      color: theme.colors.espressoDark,
      fontFamily: theme.typography.headlineLg.fontFamily,
      fontSize: 26,
      fontWeight: '600',
      marginBottom: 6,
      marginTop: 4,
    },
    subtitle: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 15,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 20,
      lineHeight: 22,
    },
    imagePreview: {
      width: '50%',
      aspectRatio: 4 / 3,
      alignSelf: 'center',
      borderRadius: theme.rounded.lg,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      marginBottom: 20,
    },
    box: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.rounded.lg,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      marginBottom: 20,
      padding: 20,
      ...theme.shadows.soft,
    },
    boxHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    secondaryTitle: {
      color: theme.colors.espressoDark,
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 20,
      fontWeight: '600',
      marginBottom: 12,
    },
    boxHelperText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 16,
    },
    row: {
      flexDirection: isSmallScreen ? 'column' : 'row',
      gap: 12,
      width: '100%',
      alignItems: isSmallScreen ? 'stretch' : 'flex-start',
    },
    flex1: {
      flex: 1,
      width: '100%',
    },
    inputGroup: {
      marginBottom: 14,
      width: '100%',
    },
    label: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: 6,
    },
    textInput: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.sm,
      paddingHorizontal: 12,
      height: 48,
      fontSize: 15,
      color: theme.colors.onSurface,
      fontFamily: theme.typography.bodyMd.fontFamily,
      textAlignVertical: 'center',
      paddingVertical: 0,
      width: '100%',
    },
    pickerWrapper: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.sm,
      height: 48,
      justifyContent: 'center',
      overflow: 'hidden',
      width: '100%',
    },
    picker: {
      width: '100%',
      color: theme.colors.onSurface,
      ...Platform.select({
        android: {
          height: 48,
          marginLeft: -8,
        },
        web: {
          height: 48,
          paddingHorizontal: 8,
          borderWidth: 0,
        },
      }),
    },
    ingredientCard: {
      backgroundColor: theme.colors.surfaceContainerLow,
      borderRadius: theme.rounded.md,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      width: '100%',
    },
    ingredientCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      minHeight: 44,
      marginBottom: 8,
    },
    ingredientIndexText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    removeBtn: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: -4,
    },
    itemTypeRow: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surfaceContainer,
      borderRadius: theme.rounded.sm,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: 4,
      marginBottom: 14,
      gap: 6,
      alignItems: 'center',
      width: '100%',
    },
    itemTypeBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 44,
      borderRadius: theme.rounded.sm,
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    itemTypeBtnActive: {
      backgroundColor: theme.colors.primary,
      ...theme.shadows.glow,
    },
    itemTypeBtnText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
    },
    itemTypeBtnTextActive: {
      color: theme.colors.onPrimary,
      fontWeight: '700',
    },
    addBtn: {
      width: '100%',
      marginHorizontal: 0,
      marginVertical: 4,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
      borderRadius: theme.rounded.sm,
      borderWidth: 1.5,
      marginTop: 8,
      gap: 6,
    },
    addBtnText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      color: theme.colors.primary,
      fontSize: 15,
      fontWeight: '700',
    },
    stepContainer: {
      marginBottom: 16,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
      width: '100%',
    },
    stepHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 44,
      marginBottom: 8,
    },
    stepBadge: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.colors.secondaryContainer,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    stepText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      color: theme.colors.onSecondaryContainer,
      fontWeight: '700',
      fontSize: 14,
    },
    stepLabel: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.onSurface,
      flex: 1,
    },
    removeStepBtn: {
      minWidth: 48,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: -4,
    },
    stepInputGroup: {
      marginTop: 8,
    },
    stepInputSubLabel: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
      marginBottom: 4,
    },
    stepTitleInput: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.sm,
      paddingHorizontal: 12,
      paddingVertical: 8,
      minHeight: 44,
      fontSize: 14,
      color: theme.colors.onSurface,
      fontFamily: theme.typography.bodyMd.fontFamily,
    },
    stepTextInput: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.sm,
      paddingHorizontal: 12,
      paddingVertical: 10,
      minHeight: 70,
      fontSize: 14,
      color: theme.colors.onSurface,
      fontFamily: theme.typography.bodyMd.fontFamily,
      textAlignVertical: 'top',
    },
    submitContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 10,
      marginBottom: 24,
      width: '100%',
    },
    submitBtn: {
      width: '100%',
      maxWidth: 360,
      height: 52,
      marginHorizontal: 0,
      alignSelf: 'center',
    },
  });
