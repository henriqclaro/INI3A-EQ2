import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions, Text, Modal, Pressable } from 'react-native';

import { Stack} from 'expo-router';

import { BackButton, Input, CustomButton } from '@/src/components';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';

export default function SrockScreen() {
  const [search, setSearch] = useState('');
  const [editingIngredient, setEditingIngredient] = useState<number | null>(null);
  const [editQuantity, setEditQuantity] = useState('');
  const [editMinimum, setEditMinimum] = useState('');

  const { theme } = useThemeMode();
  const { width } = useWindowDimensions();

  const handleEditIngredient = (ingredient: (typeof ingredients)[number]) => {
    setEditingIngredient(ingredient.id);
    setEditQuantity(String(ingredient.quantity));
    setEditMinimum(String(ingredient.minimum));
  };

  const handleSaveIngredient = () => {
  if (editingIngredient === null) return;

  const quantity = Number(editQuantity.replace(',', '.'));
  const minimum = Number(editMinimum.replace(',', '.'));

  if (Number.isNaN(quantity) || Number.isNaN(minimum)) {
    return;
  }

  setIngredients((currentIngredients) =>
      currentIngredients.map((ingredient) =>
        ingredient.id === editingIngredient
          ? {
              ...ingredient,
              quantity,
              minimum,
            }
          : ingredient
      )
    );
    setEditingIngredient(null);
    setEditQuantity('');
    setEditMinimum('');
  };

  const handleCancelEdit = () => {
    setEditingIngredient(null);
    setEditQuantity('');
    setEditMinimum('');
  };

  const cardWidth = useMemo(() => {
    if (width >= 1200) {
      return (1200 - 40 - 45) / 4; // 4 columns on large desktop
    }
    if (width >= 900) {
      return (width - 40 - 30) / 3; // 3 columns on tablet / small desktop
    }
    if (width >= 600) {
      return (width - 40 - 15) / 2; // 2 columns on tablets
    }
    return undefined; // full width on mobile
  }, [width]);

  const styles = useMemo(() => createStyles(theme), [theme]);

  const [ingredients, setIngredients] = useState([
    {
        id: 1,
        name: 'Farinha de Trigo Branca',
        quantity: 0.5,
        unit: 'kg',
        minimum: 1,
    },
    {
        id: 2,
        name: 'Açúcar Refinado',
        quantity: 750,
        unit: 'g',
        minimum: 100,
    },
    {
        id: 3,
        name: 'Chocolate Meio Amargo',
        quantity: 0,
        unit: 'g',
        minimum: 500,
    },
    {
        id: 4,
        name: 'Farinha Integral',
        quantity: 1.8,
        unit: 'kg',
        minimum: 500,
    },
    ]);

  return (
    <>
      <Stack.Screen options={{ title: 'Estoque' }} />
      
      <View style={styles.container}>
        <BackButton />
        <View style={styles.headerContent}>
          <Input
            value={search}
            placeholder="Buscar Ingrediente..."
            onChangeText={setSearch}
            containerStyle={styles.searchInput}
          />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsHorizontalScrollIndicator={false}
        >
          <View style={styles.gridContainer}>
                {ingredients.map((ingredient) => (
            <View
                key={ingredient.id}
                style={[
                styles.ingredientCard,
                cardWidth ? { width: cardWidth } : undefined,
                ]}
            >
                <View style={styles.cardHeader}>
                <Text style={styles.ingredientName}>
                    {ingredient.name}
                </Text>
                </View>

                <Text style={styles.quantityLabel}>Estoque atual</Text>

                <Text style={styles.quantity}>
                {ingredient.quantity} {ingredient.unit}
                </Text>

                <View style={styles.statusContainer}>
                <View
                    style={[
                        styles.statusDot,
                        ingredient.quantity === 0
                            ? styles.statusEmpty 
                            : ingredient.quantity <= ingredient.minimum
                            ? styles.statusLow
                            : styles.statusOk,
                                            ]}
                />

                <Text style={styles.statusText}>
                    {ingredient.quantity === 0
                        ? 'Em falta'
                        : ingredient.quantity <= ingredient.minimum
                        ? 'Estoque baixo'
                        : 'Estoque suficiente'}
                </Text>
                </View>

                <Text style={styles.minimum}>
                Estoque mínimo: {ingredient.minimum} {ingredient.unit}
                </Text>
                <br></br>
                <CustomButton
                  title="Editar estoque"
                  onPress={() => handleEditIngredient(ingredient)}
                  variant="primary"
                  style={styles.editButton}
                />

                

            </View>
            ))}

            <Modal
              visible={editingIngredient !== null}
              transparent
              animationType="fade"
              onRequestClose={handleCancelEdit}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>

                  <Text style={styles.modalTitle}>
                    Editar estoque
                  </Text>

                  <Text style={styles.editTitle}>Quantidade: </Text>
                  <Input
                    value={editQuantity}
                    onChangeText={setEditQuantity}
                    placeholder="Quantidade"
                  />

                  <Text style={styles.editTitle}>Estoque Mínimo: </Text>
                  <Input
                    value={editMinimum}
                    onChangeText={setEditMinimum}
                    placeholder="Estoque mínimo"
                  />

                  <View style={styles.modalButtons}>
                    <CustomButton
                      title="Cancelar"
                      variant="neutral"
                      onPress={handleCancelEdit}
                      style={styles.modalButton}
                    />

                    <CustomButton
                      title="Salvar"
                      variant="primary"
                      onPress={handleSaveIngredient}
                      style={styles.modalButton}
                    />
                  </View>

    </View>
  </View>
</Modal>

          </View>
        </ScrollView>
      </View>
    </>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      alignItems: 'center',
      paddingTop: 80,
    },
    headerContent: {
      width: '100%',
      maxWidth: 1200,
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    searchInput: {
      width: '100%',
      maxWidth: 500,
      margin: 12,
    },
    scrollContainer: {
      alignItems: 'center',
      padding: 20,
      width: '100%',
    },
    gridContainer: {
      flexDirection: 'column',
      flexWrap: 'wrap',
      gap: 15,
      justifyContent: 'center',
      width: '100%',
      maxWidth: 1200,
    },
    ingredientCard: {
        backgroundColor: theme.colors.secondaryText,
        borderRadius: 12,
        padding: 18,
        minHeight: 170,
        maxWidth: 400,
        borderWidth: 1,
        borderColor: theme.colors.primary,
        },

        cardHeader: {
        marginBottom: 16,
        },

        ingredientName: {
        fontSize: 20,
        fontWeight: '600',
        color: theme.colors.text,
        },

        quantityLabel: {
        fontSize: 18,
        color: theme.colors.text,
        marginBottom: 4,
        },

        quantity: {
        fontSize: 26,
        fontWeight: '700',
        color: theme.colors.text,
        marginBottom: 14,
        },

        statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        },

        statusDot: {
        width: 9,
        height: 9,
        borderRadius: 5,
        marginRight: 7,
        },

        statusOk: {
        backgroundColor: theme.colors.secondary,
        },

        statusLow: {
        backgroundColor: theme.colors.primary,
        },

        statusEmpty: {
        backgroundColor: theme.colors.border,
        },

        statusText: {
        fontSize: 16,
        color: theme.colors.text,
        },

        minimum: {
        fontSize: 14,
        color: theme.colors.text,
        },

        modalOverlay: {
          flex: 1,
          backgroundColor: theme.colors.text,
          justifyContent: 'center',
          alignItems: 'center',
        },

        modalContainer: {
          width: '90%',
          maxWidth: 500,
          backgroundColor: theme.colors.background,
          borderRadius: 16,
          padding: 20,
        },

        modalTitle: {
          fontSize: 22,
          fontWeight: '700',
          color: theme.colors.text,
          marginBottom: 20,
        },

        editTitle: {
          fontSize: 18,
          color: theme.colors.text,
        },

        modalButtons: {
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 10,
        },

        modalButton: {
          flex: 1,
          width: undefined,
          margin: 0,
        },

        editButton: {
          width: '100%',
          margin: 0,
        },

},
);
