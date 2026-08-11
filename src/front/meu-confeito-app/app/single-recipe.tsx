import { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';

import { Picker } from '@react-native-picker/picker';

import { BackButton } from '@/src/components';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { useSingleRecipe } from '@/src/hooks/useRecipes';
import { AppTheme } from '@/src/theme/themes';

export default function RecipeScreen() {
  const { theme } = useThemeMode();
  const { width } = useWindowDimensions();
  const { recipeId } = useLocalSearchParams() as { recipeId: string };
  const { recipe } = useSingleRecipe(recipeId);

  const isSmallScreen = width < 350;

  const styles = useMemo(() => createStyles(theme, isSmallScreen), [theme, isSmallScreen]);
  const [isChecked, setIsChecked] = useState(false);

  const [viewMode, setViewMode] = useState('recipe');

  return (
    <>
      <Stack.Screen options={{ title: 'Receita' }} />

      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <BackButton />

          {recipe?.coverUrl ? (
            <Image source={{ uri: recipe.coverUrl }} style={styles.image} contentFit="cover" />
          ) : null}

          <View style={styles.mode}>
            <Text style={styles.textMode}>Modo de Visualização: </Text>

            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={viewMode}
                onValueChange={(itemValue) => setViewMode(itemValue)}
                style={styles.picker}
                mode="dropdown"
                dropdownIconColor={theme.colors.text}
              >
                <Picker.Item label="Receitas" value="recipe" style={styles.pickerItem} />
                <Picker.Item label="Preços" value="price" style={styles.pickerItem} />
              </Picker>
            </View>
          </View>

          {viewMode === 'recipe' ? (
            <View style={styles.modeContainer}>
              <Text style={styles.primaryTitle}>{recipe?.title || 'Nome da Receita'}</Text>
              <Text style={styles.textQuantity}>
                Rende {recipe?.baseYield || 'X'}{' '}
                {recipe?.yieldUnit.concat('(s)') || 'porções de X gramas'}
              </Text>

              <View style={styles.box}>
                <Text style={styles.secondaryTitle}>Ingredientes</Text>
                {recipe?.ingredients && recipe.ingredients.length > 0 ? (
                  recipe.ingredients.map((item, index) => {
                    const ingName = Array.isArray(item.ingredient?.name)
                      ? item.ingredient.name.join(', ')
                      : item.ingredient?.name || 'Ingrediente';
                    return (
                      <View key={item.ingredientId || index} style={styles.ingredientRow}>
                        <View style={styles.ingredientLeft}>
                          <TouchableOpacity
                            style={[styles.checkbox, isChecked && styles.checkedCheckbox]}
                            onPress={() => setIsChecked(!isChecked)}
                          >
                            {isChecked && <Text style={styles.textCheck}>✓</Text>}
                          </TouchableOpacity>
                          <Text style={styles.ingredientName}>
                            {ingName}
                            {item.notes ? ` (${item.notes})` : ''}
                          </Text>
                        </View>
                        <Text style={styles.ingredientQuantity}>
                          {item.baseQuantity} {item.measurementUnit}
                        </Text>
                      </View>
                    );
                  })
                ) : (
                  <View style={styles.ingredientRow}>
                    <View style={styles.ingredientLeft}>
                      <TouchableOpacity
                        style={[styles.checkbox, isChecked && styles.checkedCheckbox]}
                        onPress={() => setIsChecked(!isChecked)}
                      >
                        {isChecked && <Text style={styles.textCheck}>✓</Text>}
                      </TouchableOpacity>
                      <Text style={styles.ingredientName}>Ingrediente 1</Text>
                    </View>
                    <Text style={styles.ingredientQuantity}>Quantidade</Text>
                  </View>
                )}
              </View>

              <View style={styles.box}>
                <Text style={styles.secondaryTitle}>Modo de Preparo</Text>
                {Array.isArray(recipe?.instructions) ? (
                  recipe.instructions.map((step: any, index: number) => (
                    <View key={index} style={styles.stepRow}>
                      <View style={styles.stepBadge}>
                        <Text style={styles.stepText}>{index + 1}</Text>
                      </View>
                      <Text style={styles.textStepContent}>{step.text}</Text>
                    </View>
                  ))
                ) : (
                  <View style={styles.stepRow}>
                    <View style={styles.stepBadge}>
                      <Text style={styles.stepText}>1</Text>
                    </View>
                    <Text style={styles.textStepContent}>
                      {recipe?.instructions
                        ? String(recipe.instructions)
                        : 'Descrição da primeira etapa do modo de preparo da receita'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.modeContainer}>
              <Text style={styles.primaryTitle}>{recipe?.title || 'Nome da Receita'}</Text>
              <Text style={styles.textQuantity}>
                Rende {recipe?.baseYield || 'X'}{' '}
                {recipe?.yieldUnit ? recipe.yieldUnit + '(s)' : 'porções de X gramas'}
              </Text>

              <View style={styles.pricingBox}>
                <Text style={styles.pricingTitle}>Preço por Ingrediente</Text>
                {recipe?.ingredients && recipe.ingredients.length > 0 ? (
                  recipe.ingredients.map((item, index) => {
                    const ingName = Array.isArray(item.ingredient?.name)
                      ? item.ingredient.name.join(', ')
                      : item.ingredient?.name || 'Ingrediente';
                    return (
                      <View key={item.ingredientId || index} style={styles.pricingRow}>
                        <Text style={styles.pricingTextWhite}>
                          {item.baseQuantity} {item.measurementUnit} - {ingName}
                        </Text>
                        <Text style={styles.pricingTextWhiteBold}>R$XX,XX</Text>
                      </View>
                    );
                  })
                ) : (
                  <View style={styles.pricingRow}>
                    <Text style={styles.pricingTextWhite}>Quantidade de ingrediente 1</Text>
                    <Text style={styles.pricingTextWhiteBold}>R$XX,XX</Text>
                  </View>
                )}
              </View>

              <View style={styles.pricingBox}>
                <Text style={styles.pricingTitle}>Preço Gasto - Total</Text>
                <View style={styles.pricingRow}>
                  <Text style={styles.pricingTextWhite}>Preço gasto por unidade:</Text>
                  <Text style={styles.pricingTextWhiteBold}>R$XX,XX</Text>
                </View>
                <View style={[styles.pricingRow]}>
                  <Text style={styles.pricingTextWhite}>Preço gasto por receita:</Text>
                  <Text style={styles.pricingTextWhiteBold}>R$XX,XX</Text>
                </View>
              </View>

              <View style={styles.pricingBox}>
                <Text style={styles.pricingTitle}>Preço Sugerido</Text>

                <View style={styles.markupBox}>
                  <Text style={styles.markupText}>Preço para venda por unidade:</Text>
                  <Text style={styles.priceText}>R$ XX,XX</Text>

                  <View style={styles.markupDetailsRow}>
                    <Text style={styles.markupText}>Margem de Lucro:</Text>
                    <Text style={styles.markupValue}>{recipe?.profitMargin || 'XX'}%</Text>
                  </View>
                  <View style={styles.markupDetailsRow}>
                    <Text style={styles.markupText}>Lucro por unidade:</Text>
                    <Text style={styles.markupValue}>R$XX,XX</Text>
                  </View>
                  <View style={styles.markupDetailsRow}>
                    <Text style={styles.markupText}>Lucro por receita:</Text>
                    <Text style={styles.markupValue}>R$XX,XX</Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
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
      paddingTop: 40,
      paddingBottom: 60,
    },
    image: {
      width: '50%',
      aspectRatio: 4 / 3,
      alignSelf: 'center',
      borderRadius: 16,
      marginBottom: 20,
      marginTop: 15,
    },
    mode: {
      flexDirection: isSmallScreen ? 'column' : 'row',
      alignItems: isSmallScreen ? 'flex-start' : 'center',
      justifyContent: 'space-between',
      width: '100%',
      marginBottom: 25,
      gap: 10,
    },
    textMode: {
      fontSize: 16,
      color: theme.colors.text,
      fontWeight: '600',
    },
    pickerContainer: {
      backgroundColor: theme.colors.secondary,
      borderRadius: 8,
      overflow: 'hidden',
      height: 40,
      justifyContent: 'center',
      flex: 1,
      maxWidth: isSmallScreen ? '100%' : 160,
    },
    picker: {
      width: '100%',
      color: theme.colors.text,
    },
    pickerItem: {
      fontSize: 14,
    },
    modeContainer: {
      flex: 1,
      width: '100%',
    },

    // Headers e Textos base
    primaryTitle: {
      color: theme.colors.primary,
      fontFamily: 'Playfair Display SC',
      fontSize: 26,
      fontWeight: 'bold',
      marginBottom: 6,
    },
    textQuantity: {
      fontSize: 16,
      color: theme.colors.text,
      marginBottom: 24,
    },

    // View Modo Receita (Cards Brancos)
    box: {
      backgroundColor: theme.colors.pitchBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.secBorder,
      marginBottom: 20,
      padding: 20,
    },
    secondaryTitle: {
      color: theme.colors.primary,
      fontFamily: 'Playfair Display SC',
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 16,
    },

    // Linhas de Ingredientes
    ingredientRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.lightGray,
    },
    ingredientLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      paddingRight: 10,
    },
    ingredientName: {
      color: theme.colors.text,
      fontSize: 14,
      flexShrink: 1,
    },
    ingredientQuantity: {
      color: theme.colors.text,
      fontSize: 14,
      fontWeight: 'bold',
    },

    // Checkbox
    checkbox: {
      width: 18,
      height: 18,
      borderWidth: 2,
      borderColor: theme.colors.primary,
      borderRadius: 4,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    checkedCheckbox: {
      backgroundColor: theme.colors.primary,
    },
    textCheck: {
      color: theme.colors.secondaryText,
      fontSize: 12,
      fontWeight: 'bold',
    },

    // Modo de Preparo
    stepRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    stepBadge: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.colors.secondary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
      marginTop: 2,
    },
    stepText: {
      color: theme.colors.primary,
      fontWeight: 'bold',
      fontSize: 14,
    },
    textStepContent: {
      flex: 1,
      color: theme.colors.text,
      fontSize: 15,
      lineHeight: 22,
    },

    // View Modo Precificação (Cards Vermelhos)
    pricingBox: {
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      marginBottom: 16,
      padding: 20,
    },
    pricingTitle: {
      color: theme.colors.secondaryText,
      fontFamily: 'Playfair Display SC',
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 16,
    },
    pricingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    },
    pricingTextWhite: {
      color: theme.colors.secondaryText,
      fontSize: 14,
      flex: 1,
    },
    pricingTextWhiteBold: {
      color: theme.colors.secondaryText,
      fontSize: 14,
      fontWeight: 'bold',
      marginLeft: 10,
    },

    // Card interno de Sugestão de Preço
    markupBox: {
      backgroundColor: theme.colors.pitchBackground,
      borderRadius: 12,
      padding: 16,
      marginTop: 4,
    },
    markupDetailsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 6,
    },
    markupText: {
      color: theme.colors.text,
      fontSize: 14,
    },
    markupValue: {
      color: theme.colors.primary,
      fontSize: 14,
      fontWeight: 'bold',
    },
    priceText: {
      color: theme.colors.primary,
      fontSize: 24,
      fontWeight: 'bold',
      marginVertical: 8,
    },
  });
