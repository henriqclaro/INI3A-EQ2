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
import { useRecipe } from '@/src/hooks/useRecipe';
import { AppTheme } from '@/src/theme/themes';

export default function RecipeScreen() {
  const { theme } = useThemeMode();
  const { width } = useWindowDimensions();
  const { recipeId } = useLocalSearchParams() as { recipeId: string };
  const { recipe } = useRecipe(recipeId);

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

              <ScrollView
                style={styles.box}
                contentContainerStyle={styles.boxContent}
                nestedScrollEnabled={true}
              >
                <Text style={styles.secondaryTitle}>Ingredientes</Text>
                <View style={styles.lineBox}>
                  <TouchableOpacity
                    style={[styles.checkbox, isChecked && styles.checkedCheckbox]}
                    onPress={() => setIsChecked(!isChecked)}
                  >
                    {isChecked && <Text style={styles.textCheck}>✓</Text>}
                  </TouchableOpacity>
                  <Text> Quantidade de ingrediente 1</Text>
                </View>
              </ScrollView>

              <ScrollView
                style={styles.box}
                contentContainerStyle={styles.boxContent}
                nestedScrollEnabled={true}
              >
                <Text style={styles.secondaryTitle}>Modo de Preparo</Text>
                {Array.isArray(recipe?.instructions) ? (
                  recipe.instructions.map((step: any, index: number) => (
                    <View key={index} style={styles.lineBox}>
                      <Text style={styles.step}>{index + 1}</Text>
                      <Text style={styles.textStepContent}> {step.text} </Text>
                    </View>
                  ))
                ) : (
                  <View style={styles.lineBox}>
                    <Text style={styles.step}>1</Text>
                    <Text>
                      {' '}
                      {recipe?.instructions
                        ? String(recipe.instructions)
                        : 'Descrição da primeira etapa do modo de preparo da receita'}
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          ) : (
            <View style={styles.modeContainer}>
              <Text style={styles.primaryTitle}>{recipe?.title || 'Nome da Receita'}</Text>
              <Text style={styles.textQuantity}>
                Rende {recipe?.baseYield || 'X'}{' '}
                {recipe?.yieldUnit + '(s)' || 'porções de X gramas'}
              </Text>

              <ScrollView
                style={styles.box}
                contentContainerStyle={styles.boxContent}
                nestedScrollEnabled={true}
              >
                <Text style={styles.secondaryTitle}>Preço por Ingrediente</Text>
                <View style={styles.lineBox}>
                  <Text>R$XX,XX </Text>
                  <Text> Quantidade de ingrediente 1</Text>
                </View>
              </ScrollView>

              <View style={[styles.box, styles.boxContent]}>
                <Text style={styles.secondaryTitle}>Preço Gasto - Total</Text>
                <Text>Preço gasto por unidade: R$XX,XX</Text>
                <Text>Preço gasto por receita: R$XX,XX</Text>
              </View>
              <View style={[styles.box, styles.boxContent]}>
                <Text style={styles.secondaryTitle}>Preço Sugerido</Text>
                <Text>Preço para venda por unidade:</Text>
                <Text style={styles.priceText}>R$ XX,XX</Text>
                <Text>Margem de Lucro: {recipe?.profitMargin || 'XX'}%</Text>
                <Text>Lucro por unidade: R$XX,XX</Text>
                <Text>Lucro por receita: R$XX,XX</Text>
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
      paddingTop: 70,
      paddingBottom: 40,
    },
    image: {
      width: 300,
      height: 300,
      alignSelf: 'center',
      borderRadius: 16,
      marginBottom: 20,
      borderColor: theme.colors.border,
      borderWidth: 1.2,
    },
    mode: {
      flexDirection: isSmallScreen ? 'column' : 'row',
      alignItems: isSmallScreen ? 'flex-start' : 'center',
      justifyContent: 'space-between',
      width: '100%',
      marginBottom: 25,
    },
    textMode: {
      fontSize: 20,
      flexShrink: 1,
    },
    pickerContainer: {
      backgroundColor: theme.colors.secondary,
      borderRadius: 10,
      overflow: 'hidden',
      height: 45,
      justifyContent: 'center',
      minWidth: 150,
    },
    picker: {
      width: '100%',
      color: theme.colors.text,
    },
    pickerItem: {
      fontSize: 16,
    },
    modeContainer: {
      flex: 1,
      width: '100%',
    },
    primaryTitle: {
      color: theme.colors.primary,
      fontFamily: 'Playfair Display SC',
      fontSize: 28,
      fontWeight: 'bold',
    },
    textQuantity: {
      fontSize: 18,
      marginBottom: 10,
    },
    box: {
      maxHeight: 300,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.pitchBackground,
      marginTop: 5,
      marginBottom: 15,
    },
    boxContent: {
      padding: 15,
      paddingBottom: 25,
    },
    lineBox: {
      flexDirection: 'row',
      gap: 10,
      alignItems: 'flex-start',
      marginBottom: 15,
    },
    textStepContent: {
      flex: 1,
      marginTop: 8,
    },
    secondaryTitle: {
      color: theme.colors.text,
      fontFamily: 'Playfair Display SC',
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 10,
    },
    step: {
      fontSize: 30,
      color: theme.colors.primary,
    },
    checkbox: {
      width: 15,
      height: 15,
      borderWidth: 2,
      borderColor: theme.colors.primary,
      borderRadius: 4,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 4,
    },
    textCheck: {
      color: theme.colors.primary,
      fontSize: 10,
      fontWeight: 'bold',
    },
    checkedCheckbox: {
      backgroundColor: theme.colors.secondary,
    },
    priceText: {
      color: theme.colors.primary,
      fontSize: 18,
      fontWeight: 'bold',
    },
  });
