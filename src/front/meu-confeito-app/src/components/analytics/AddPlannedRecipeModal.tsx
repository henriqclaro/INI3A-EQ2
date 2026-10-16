import { useMemo, useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { KeyboardAvoidingView, KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { RecipeSelector, RecipeWithOrigin } from '@/src/components/recipe';
import { useAuth } from '@/src/contexts/AuthContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';
import { PlannedProductionItem } from '@/src/types/analytics';
import { PartialRecipe } from '@/src/types/recipe';

export interface AddPlannedRecipeModalProps {
  isVisible: boolean;
  onClose: () => void;
  onAdd: (item: PlannedProductionItem) => void;
  excludedRecipeIds?: string[];
}

export function AddPlannedRecipeModal({
  isVisible,
  onClose,
  onAdd,
  excludedRecipeIds = [],
}: AddPlannedRecipeModalProps) {
  const { theme } = useThemeMode();
  const { user } = useAuth();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [selectedRecipe, setSelectedRecipe] = useState<PartialRecipe | null>(null);
  const [targetYieldText, setTargetYieldText] = useState<string>('1');

  const handleSelectRecipe = (recipe: PartialRecipe | null) => {
    setSelectedRecipe(recipe);
    if (recipe) {
      const baseYield = recipe.baseYield ? String(recipe.baseYield) : '1';
      setTargetYieldText(baseYield);
    }
  };

  const yieldNumber = useMemo(() => {
    const parsed = parseFloat(targetYieldText.replace(',', '.'));
    return isNaN(parsed) || parsed <= 0 ? 0 : parsed;
  }, [targetYieldText]);

  const canSubmit = Boolean(selectedRecipe && yieldNumber > 0);

  const handleConfirm = () => {
    if (!selectedRecipe || yieldNumber <= 0) return;

    onAdd({
      recipeId: selectedRecipe.id,
      targetYield: yieldNumber,
      recipeTitle: selectedRecipe.title,
      baseYield: selectedRecipe.baseYield ? Number(selectedRecipe.baseYield) : undefined,
      yieldUnit: selectedRecipe.yieldUnit || 'un',
      origins: (selectedRecipe as RecipeWithOrigin).origins,
    });

    setSelectedRecipe(null);
    setTargetYieldText('1');
    onClose();
  };

  const handleCancel = () => {
    setSelectedRecipe(null);
    setTargetYieldText('1');
    onClose();
  };

  const handleYieldStep = (delta: number) => {
    const current = yieldNumber;
    const nextVal = Math.max(1, current + delta);
    setTargetYieldText(String(nextVal));
  };

  return (
    <Modal visible={isVisible} animationType="fade" transparent onRequestClose={handleCancel}>
      <KeyboardAvoidingView style={styles.modalOverlay} behavior="padding" automaticOffset>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderTitleGroup}>
              <MaterialCommunityIcons name="cart-plus" size={22} color={theme.colors.primary} />
              <Text style={styles.modalTitle}>Planejar Produção</Text>
            </View>
            <TouchableOpacity
              onPress={handleCancel}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Fechar modal de planejar produção"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons
                name="close"
                size={22}
                color={theme.colors.onSurfaceVariant}
              />
            </TouchableOpacity>
          </View>

          <KeyboardAwareScrollView
            contentContainerStyle={styles.scrollBody}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bottomOffset={24}
          >
            <Text style={styles.modalSubtitle}>
              Selecione uma de suas receitas, salvas ou baixadas, e informe o rendimento que você
              planeja produzir.
            </Text>

            {/* Recipe Selector */}
            <View style={styles.fieldSection}>
              <RecipeSelector
                userId={user?.id}
                onlyUserRecipes={false}
                includeSavedAndDownloaded={true}
                selectedRecipe={selectedRecipe}
                onSelectRecipe={handleSelectRecipe}
                excludeRecipeIds={excludedRecipeIds}
                label="Receita a Produzir"
                placeholder="Buscar receitas próprias, salvas ou baixadas..."
                isRequired={true}
                canClear={true}
                isDropdownOpenByDefault={true}
              />
            </View>

            {/* Target Yield Input & Stepper */}
            {selectedRecipe && (
              <View style={styles.yieldCard}>
                <View style={styles.yieldHeader}>
                  <Text style={styles.yieldLabel}>Quantidade / Rendimento Planejado</Text>
                  {Boolean(selectedRecipe.baseYield) && (
                    <Text style={styles.baseYieldHint}>
                      (Base da receita: {selectedRecipe.baseYield}{' '}
                      {selectedRecipe.yieldUnit || 'un'})
                    </Text>
                  )}
                </View>

                <View style={styles.yieldControlsRow}>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => handleYieldStep(-1)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Diminuir rendimento planejado"
                  >
                    <MaterialCommunityIcons
                      name="minus"
                      size={20}
                      color={theme.colors.espressoDark}
                    />
                  </TouchableOpacity>

                  <TextInput
                    style={styles.yieldInput}
                    value={targetYieldText}
                    onChangeText={setTargetYieldText}
                    keyboardType="decimal-pad"
                    textAlign="center"
                    placeholder="1"
                    placeholderTextColor={theme.colors.placeholder}
                  />

                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => handleYieldStep(1)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Aumentar rendimento planejado"
                  >
                    <MaterialCommunityIcons
                      name="plus"
                      size={20}
                      color={theme.colors.espressoDark}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </KeyboardAwareScrollView>

          {/* Footer Actions */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={handleCancel}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Cancelar adição"
            >
              <Text style={styles.secondaryBtnText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryBtn, !canSubmit && styles.btnDisabled]}
              onPress={handleConfirm}
              disabled={!canSubmit}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Adicionar receita ao plano"
            >
              <MaterialCommunityIcons name="plus" size={18} color={theme.colors.onPrimary} />
              <Text style={styles.primaryBtnText}>Adicionar ao Plano</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.colors.backdrop,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    modalContent: {
      width: '100%',
      maxWidth: 520,
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.rounded.xl,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      overflow: 'hidden',
      maxHeight: '90%',
      ...theme.shadows.modal,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surfaceContainerLow,
    },
    modalHeaderTitleGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    modalTitle: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 17,
      fontWeight: '700',
      color: theme.colors.espressoDark,
    },
    closeBtn: {
      minWidth: theme.spacing.touchable,
      minHeight: theme.spacing.touchable,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scrollBody: {
      padding: 20,
      gap: 16,
    },
    modalSubtitle: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 18,
    },
    fieldSection: {
      width: '100%',
    },
    yieldCard: {
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.md,
      padding: 16,
      gap: 12,
    },
    yieldHeader: {
      gap: 2,
    },
    yieldLabel: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.espressoDark,
    },
    baseYieldHint: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    yieldControlsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    stepperBtn: {
      width: theme.spacing.touchable,
      height: theme.spacing.touchable,
      borderRadius: theme.rounded.default,
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },
    yieldInput: {
      flex: 1,
      height: theme.spacing.touchable,
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.default,
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.espressoDark,
      paddingHorizontal: 12,
    },
    modalFooter: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: 12,
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surfaceContainerLow,
    },
    secondaryBtn: {
      minHeight: theme.spacing.touchable,
      paddingHorizontal: 16,
      borderRadius: theme.rounded.default,
      alignItems: 'center',
      justifyContent: 'center',
    },
    secondaryBtnText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
    },
    primaryBtn: {
      minHeight: theme.spacing.touchable,
      paddingHorizontal: 20,
      backgroundColor: theme.colors.primary,
      borderRadius: theme.rounded.default,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    primaryBtnText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.onPrimary,
    },
    btnDisabled: {
      opacity: 0.5,
    },
  });
