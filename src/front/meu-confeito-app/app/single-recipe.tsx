import { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions, ScrollView } from 'react-native';

import { Stack } from 'expo-router';

import { Picker } from '@react-native-picker/picker';

import { BackButton } from '@/src/components';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';

export default function RecipesScreen() {
  const { theme } = useThemeMode();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 350;

  const styles = useMemo(() => createStyles(theme, isSmallScreen), [theme, isSmallScreen]);
  const [isChecked, setIsChecked] = useState(false);

  const [viewMode, setViewMode] = useState('recipe');

  return (
    <>
      <Stack.Screen options={{ title: 'Receita' }} />

      <View style={styles.container}>
        <BackButton route="/(tabs)/recipes" />
        <View style={styles.mode}>
          <Text style={styles.textMode}>Modo de Visualização: </Text>
          <Picker
            selectedValue={viewMode}
            onValueChange={(itemValue) => setViewMode(itemValue)}
            style={styles.selectMode}
          >
            <Picker.Item label="Receitas" value="recipe" />
            <Picker.Item label="Preços" value="price" />
          </Picker>
        </View>
        {viewMode === 'recipe' ? (
          <View style={styles.modeContainer}>
            <Text style={styles.primaryTitle}>Nome da Receita</Text>
            <Text style={styles.textQuantity}>Rende X porções de X gramas</Text>
            <ScrollView style={styles.box}>
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
            <ScrollView style={styles.box}>
              <Text style={styles.secondaryTitle}>Modo de Preparo</Text>
              <View style={styles.lineBox}>
                <Text style={styles.step}>1</Text>
                <Text> Descrição da primeira etapa do modo de preparo da receita</Text>
              </View>
            </ScrollView>
          </View>
        ) : (
          <View style={styles.modeContainer}>
            <Text style={styles.primaryTitle}>Nome da Receita</Text>
            <Text style={styles.textQuantity}>Rende X porções de X gramas</Text>
            <ScrollView style={styles.box}>
              <Text style={styles.secondaryTitle}>Preço por Ingrediente</Text>
              <View style={styles.lineBox}>
                <Text>R$XX,XX </Text>
                <Text> Quantidade de ingrediente 1</Text>
              </View>
            </ScrollView>
            <View style={styles.box}>
              <Text style={styles.secondaryTitle}>Preço Gasto - Total</Text>
              <Text>Preço gasto por unidade: R$XX,XX</Text>
              <Text>Preço gasto por receita: R$XX,XX</Text>
            </View>
            <View style={styles.box}>
              <Text style={styles.secondaryTitle}>Preço Sugerido</Text>
              <Text>Preço para venda por unidade:</Text>
              <Text style={styles.priceText}>R$ XX,XX</Text>
              <Text>Margem de Lucro: XX%</Text>
              <Text>Lucro por unidade: R$XX,XX</Text>
              <Text>Lucro por receita: R$XX,XX</Text>
            </View>
          </View>
        )}
      </View>
    </>
  );
}

const createStyles = (theme: AppTheme, isSmallScreen: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      alignItems: 'flex-start',
      fontFamily: 'inter',
      paddingLeft: 20,
    },
    mode: {
      flexDirection: isSmallScreen ? 'column' : 'row',
      alignItems: 'center',
      gap: 10,
      margin: 30,
      alignSelf: 'flex-end',
      marginLeft: 80,
    },
    textMode: {
      fontSize: 20,
      flexShrink: 1,
    },
    selectMode: {
      fontSize: 16,
      backgroundColor: theme.colors.secondary,
      borderRadius: 10,
      padding: 5,
    },
    modeContainer: {
      width: '100%',
      paddingRight: 20,
    },
    primaryTitle: {
      color: theme.colors.primary,
      fontFamily: 'Playfair Display SC',
      fontSize: 28,
      fontWeight: 'bold',
    },
    textQuantity: {
      fontSize: 18,
      marginBottom: 10
    },
    box: {
      maxHeight: 180,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.pitchBackground,
      padding: 10,
      marginTop: 5,
      gap: 5
    },
    secondaryTitle: {
      color: theme.colors.text,
      fontFamily: 'Playfair Display SC',
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 10,
    },
    lineBox: {
      flexDirection: 'row',
      gap: 10,
      alignItems: 'center',
    },
    step:{
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
    },
    textCheck: {
      color: theme.colors.primary,
      fontSize: 10,
    },
    checkedCheckbox: {
      backgroundColor: theme.colors.secondary,
    },
    priceText:{
      color: theme.colors.primary,
      fontSize: 18,
      fontWeight: 'bold',
    }
  });
