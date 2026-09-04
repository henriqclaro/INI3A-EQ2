import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { Stack } from 'expo-router';

import { BackButton, CustomButton, Input } from '@/src/components';
import { useAuth } from '@/src/contexts/AuthContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { useUserInventory } from '@/src/hooks/useUsers';
import { UserInventoryItem } from '@/src/services/user';
import { AppTheme } from '@/src/theme/themes';

export default function StockScreen() {
  const [search, setSearch] = useState('');
  const [editingIngredient, setEditingIngredient] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState('');

  const { theme } = useThemeMode();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const { inventories, setInventories, isLoading, error } = useUserInventory(user?.id);

  const handleEditIngredient = (ingredient: UserInventoryItem) => {
    setEditingIngredient(ingredient.ingredientId);
    setEditQuantity(String(ingredient.currentQuantity));
  };

  const handleSaveIngredient = () => {
    if (editingIngredient === null) return;

    const quantity = Number(editQuantity.replace(',', '.'));

    if (Number.isNaN(quantity)) {
      return;
    }

    setInventories((currentIngredients) =>
      currentIngredients.map((item) =>
        item.ingredientId === editingIngredient
          ? {
              ...item,
              currentQuantity: quantity,
            }
          : item,
      ),
    );
    setEditingIngredient(null);
    setEditQuantity('');
  };

  const handleCancelEdit = () => {
    setEditingIngredient(null);
    setEditQuantity('');
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

  const filteredInventories = useMemo(() => {
    if (!search.trim()) return inventories;
    const searchLower = search.toLowerCase();
    return inventories.filter((item) => {
      const names: string[] = Array.isArray(item.ingredient?.name)
        ? item.ingredient.name
        : [item.ingredient?.name || ''];
      const hasMatchingName = names.some((name: string) =>
        name.toLowerCase().includes(searchLower),
      );
      const hasMatchingCategory = Boolean(
        item.ingredient?.category?.toLowerCase().includes(searchLower),
      );
      return hasMatchingName || hasMatchingCategory;
    });
  }, [inventories, search]);

  const styles = useMemo(() => createStyles(theme), [theme]);

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
          {isLoading ? (
            <View style={styles.feedbackContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.feedbackText}>Carregando estoque...</Text>
            </View>
          ) : error ? (
            <View style={styles.feedbackContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : filteredInventories.length === 0 ? (
            <View style={styles.feedbackContainer}>
              <Text style={styles.emptyText}>
                {search.trim()
                  ? 'Nenhum ingrediente encontrado para a busca.'
                  : 'Nenhum ingrediente cadastrado no estoque.'}
              </Text>
            </View>
          ) : (
            <View style={styles.gridContainer}>
              {filteredInventories.map((item) => {
                const ingredientName = Array.isArray(item.ingredient?.name)
                  ? item.ingredient.name.join(' / ')
                  : item.ingredient?.name || 'Ingrediente';
                const isOutOfStock = Number(item.currentQuantity) <= 0;

                return (
                  <View
                    key={item.ingredientId}
                    style={[styles.ingredientCard, cardWidth ? { width: cardWidth } : undefined]}
                  >
                    <View style={styles.cardHeader}>
                      <Text style={styles.ingredientName}>{ingredientName}</Text>
                      {item.ingredient?.category ? (
                        <Text style={styles.categoryText}>{item.ingredient.category}</Text>
                      ) : null}
                    </View>

                    <Text style={styles.quantityLabel}>Estoque atual</Text>

                    <Text style={styles.quantity}>
                      {item.currentQuantity} {item.measurementUnit}
                    </Text>

                    <View style={styles.statusContainer}>
                      <View
                        style={[
                          styles.statusDot,
                          isOutOfStock ? styles.statusEmpty : styles.statusOk,
                        ]}
                      />

                      <Text style={styles.statusText}>
                        {isOutOfStock ? 'Em falta' : 'Estoque suficiente'}
                      </Text>
                    </View>

                    {Number(item.packagePrice) > 0 && (
                      <Text style={styles.packageInfo}>
                        Pacote: {item.packageSize} {item.measurementUnit} - R${' '}
                        {Number(item.packagePrice).toFixed(2)}
                      </Text>
                    )}

                    <CustomButton
                      title="Editar estoque"
                      onPress={() => handleEditIngredient(item)}
                      variant="primary"
                      style={styles.editButton}
                    />
                  </View>
                );
              })}
            </View>
          )}

          <Modal
            visible={editingIngredient !== null}
            transparent
            animationType="fade"
            onRequestClose={handleCancelEdit}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Editar estoque</Text>

                <Text style={styles.editTitle}>Quantidade: </Text>
                <Input
                  value={editQuantity}
                  onChangeText={setEditQuantity}
                  placeholder="Quantidade"
                  keyboardType="numeric"
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

    categoryText: {
      fontSize: 14,
      color: theme.colors.primary,
      marginTop: 2,
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

    packageInfo: {
      fontSize: 14,
      color: theme.colors.text,
      marginBottom: 12,
    },

    feedbackContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
    },

    feedbackText: {
      marginTop: 12,
      fontSize: 16,
      color: theme.colors.text,
    },

    errorText: {
      fontSize: 16,
      color: theme.colors.primary,
      textAlign: 'center',
    },

    emptyText: {
      fontSize: 16,
      color: theme.colors.text,
      textAlign: 'center',
      fontStyle: 'italic',
    },

    modalOverlay: {
      flex: 1,
      backgroundColor: theme.colors.backdrop,
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
      marginBottom: 8,
    },

    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 10,
      marginTop: 16,
    },

    modalButton: {
      flex: 1,
      width: undefined,
      margin: 0,
    },

    editButton: {
      width: '100%',
      margin: 0,
      marginTop: 8,
    },
  });
