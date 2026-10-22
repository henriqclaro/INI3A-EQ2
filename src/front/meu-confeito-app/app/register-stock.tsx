import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

import { Stack, router } from 'expo-router';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { ActivityIndicator } from 'react-native-paper';

import { CustomButton, DraftRecoveryBanner, OfflineBanner } from '@/src/components/common';
import { StockEntryCard } from '@/src/components/stock';
import { useSettings } from '@/src/contexts/SettingsContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { useFormDraft } from '@/src/hooks/useFormDraft';
import { useIngredients } from '@/src/hooks/useIngredients';
import { useInventory } from '@/src/hooks/useInventory';
import { useNetwork } from '@/src/hooks/useNetwork';
import { useUnsavedChangesWarning } from '@/src/hooks/useUnsavedChangesWarning';
import { InventoryService } from '@/src/services/inventory';
import { AppTheme } from '@/src/theme/themes';
import {
  StockEntryItem,
  StockEntryMode,
  StockRegisterDraft,
  createEmptyStockEntryItem,
  deserializeStockEntryItem,
  serializeStockEntryItem,
} from '@/src/types/stockEntry';
import { STOCK_REGISTER_DRAFT_KEY } from '@/src/utils/drafts';
import { formatCurrency, formatDateForApi } from '@/src/utils/formatters';

export default function RegisterStockScreen() {
  const { theme } = useThemeMode();
  const { priceDecimalPlaces } = useSettings();
  const { width } = useWindowDimensions();
  const { isOffline } = useNetwork();
  const isMobile = width < 768;

  const { ingredients: availableIngredients, refetch: refetchIngredients } = useIngredients();
  const { inventory, refetch: refetchInventory } = useInventory();

  // Mode: purchase (with cost & avg calculation) or initial adjustment (only balance)
  const [entryMode, setEntryMode] = useState<StockEntryMode>('purchase');
  const [items, setItems] = useState<StockEntryItem[]>([createEmptyStockEntryItem()]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [savingIndex, setSavingIndex] = useState(1);
  const [savingTotal, setSavingTotal] = useState(1);
  const [isSubmitSuccessful, setIsSubmitSuccessful] = useState(false);

  // Form Draft Persistence via kvStorage (MMKV)
  const {
    hasDraft,
    hasSavedDraftOnMount,
    draftTimestamp,
    saveDraft,
    clearDraft,
    discardDraft,
    restoreDraft,
  } = useFormDraft<StockRegisterDraft>(STOCK_REGISTER_DRAFT_KEY);

  const [isDraftDismissed, setIsDraftDismissed] = useState(false);
  const isDraftBannerVisible = hasSavedDraftOnMount && hasDraft && !isDraftDismissed;
  const isInitialMount = useRef(true);

  // Auto-save draft on form state changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (isSubmitting || isSubmitSuccessful) {
      return;
    }

    const hasMeaningfulContent =
      items.length > 1 ||
      items.some(
        (it) =>
          it.selectedIngredientId ||
          it.quantityInput.trim() ||
          it.totalCostInput.trim() ||
          it.notesInput.trim() ||
          it.packageSize.trim() ||
          it.expirationDate !== null,
      );

    if (hasMeaningfulContent) {
      saveDraft({
        entryMode,
        items: items.map(serializeStockEntryItem),
      });
    }
  }, [items, entryMode, isSubmitting, isSubmitSuccessful, saveDraft]);

  const handleRestoreDraft = useCallback(() => {
    const draft = restoreDraft();
    if (draft && Array.isArray(draft.items) && draft.items.length > 0) {
      setEntryMode(draft.entryMode || 'purchase');
      setItems(draft.items.map(deserializeStockEntryItem));
    }
    setIsDraftDismissed(true);
  }, [restoreDraft]);

  const handleDiscardDraft = useCallback(() => {
    discardDraft();
    setItems([createEmptyStockEntryItem()]);
    setIsDraftDismissed(true);
  }, [discardDraft]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refetchIngredients(), refetchInventory()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Add a new empty ingredient entry form
  const handleAddItem = useCallback(() => {
    setItems((prev) => [...prev, createEmptyStockEntryItem()]);
  }, []);

  // Remove an entry form by unique ID
  const handleRemoveItem = useCallback((id: string) => {
    setItems((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((it) => it.id !== id);
    });
  }, []);

  // Update a specific item in the array
  const handleUpdateItem = useCallback((updated: StockEntryItem) => {
    setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
  }, []);

  // Unsaved changes detector
  const hasUnsavedChanges = useMemo(() => {
    if (isSubmitting || isSubmitSuccessful) return false;
    return (
      items.length > 1 ||
      items.some(
        (it) =>
          it.selectedIngredientId ||
          it.quantityInput.trim() ||
          it.totalCostInput.trim() ||
          it.notesInput.trim() ||
          it.packageSize.trim() ||
          it.expirationDate !== null,
      )
    );
  }, [isSubmitting, isSubmitSuccessful, items]);

  const { allowNextNavigation } = useUnsavedChangesWarning(hasUnsavedChanges, {
    title: 'Descartar entrada de estoque?',
    message:
      'Você já preencheu informações sobre esta movimentação de estoque. Deseja realmente sair e descartar os dados inseridos?',
    confirmText: 'Descartar e sair',
    cancelText: 'Continuar preenchendo',
  });

  // Calculate total batch cost for purchase mode
  const totalBatchCost = useMemo(() => {
    let costSum = 0;
    for (const it of items) {
      const parsed = parseFloat(it.totalCostInput.replace(',', '.')) || 0;
      if (parsed > 0) {
        costSum += parsed;
      }
    }
    return costSum;
  }, [items]);

  // Submit multiple entries sequentially with error isolation
  const handleSubmit = async () => {
    if (isOffline) {
      Alert.alert(
        'Modo Offline',
        'Registrar compras e ajustes de estoque requer conexão com a internet.',
      );
      return;
    }

    // Mark all as touched for validation styling
    setItems((prev) => prev.map((it) => ({ ...it, hasTouchedIngredient: true })));

    // Validate each item
    const validationErrors: string[] = [];
    items.forEach((it, idx) => {
      const itemNum = idx + 1;
      const qty = parseFloat(it.quantityInput.replace(',', '.')) || 0;
      const cost = parseFloat(it.totalCostInput.replace(',', '.')) || 0;

      if (!it.selectedIngredientId) {
        validationErrors.push(`Insumo #${itemNum}: Selecione um insumo da lista.`);
      } else if (isNaN(qty) || qty <= 0) {
        validationErrors.push(`Insumo #${itemNum}: Informe uma quantidade válida maior que zero.`);
      } else if (entryMode === 'purchase' && (isNaN(cost) || cost <= 0)) {
        validationErrors.push(
          `Insumo #${itemNum}: Informe o valor total pago para cálculo do custo unitário.`,
        );
      }
    });

    if (validationErrors.length > 0) {
      Alert.alert(
        'Campos Obrigatórios',
        validationErrors.slice(0, 3).join('\n') +
          (validationErrors.length > 3
            ? `\n...e mais ${validationErrors.length - 3} aviso(s). Corrija os dados para continuar.`
            : ''),
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setSavingTotal(items.length);

      const succeededIds: string[] = [];
      const failedMessages: string[] = [];

      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        setSavingIndex(i + 1);

        const parsedQty = parseFloat(it.quantityInput.replace(',', '.')) || 0;
        const parsedCost = parseFloat(it.totalCostInput.replace(',', '.')) || 0;
        const formattedExpDate = formatDateForApi(it.expirationDate);

        try {
          if (entryMode === 'purchase') {
            await InventoryService.registerPurchase({
              ingredientId: Number(it.selectedIngredientId),
              quantity: parsedQty,
              totalCost: parsedCost,
              expirationDate: formattedExpDate,
            });
          } else {
            await InventoryService.registerAdjustment({
              ingredientId: Number(it.selectedIngredientId),
              realQuantity: parsedQty,
              notes: it.notesInput.trim() || undefined,
            });
          }
          succeededIds.push(it.id);
        } catch (err: unknown) {
          const apiErr = err as {
            response?: { data?: { message?: string } };
            message?: string;
          };
          const msg =
            apiErr?.response?.data?.message ||
            apiErr?.message ||
            `Não foi possível registrar o insumo #${i + 1}.`;
          failedMessages.push(`Insumo #${i + 1}: ${msg}`);
        }
      }

      // Re-fetch inventory once after batch execution
      await refetchInventory();

      if (failedMessages.length === 0) {
        // All succeeded
        clearDraft();
        setIsSubmitSuccessful(true);
        allowNextNavigation();

        const successTitle = entryMode === 'purchase' ? 'Compras Registradas!' : 'Ajustes Salvos!';
        const successMessage =
          items.length > 1
            ? `${items.length} movimentações de estoque foram registradas com sucesso!`
            : entryMode === 'purchase'
              ? 'Entrada de compra registrada com sucesso!'
              : 'Saldo de estoque ajustado com sucesso!';

        Alert.alert(successTitle, successMessage, [
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
        // Partial or complete failure: preserve failed items so user doesn't lose work
        const remainingItems = items.filter((it) => !succeededIds.includes(it.id));
        setItems(remainingItems.length > 0 ? remainingItems : [createEmptyStockEntryItem()]);

        if (remainingItems.length > 0) {
          saveDraft({
            entryMode,
            items: remainingItems.map(serializeStockEntryItem),
          });
        }

        if (succeededIds.length > 0) {
          Alert.alert(
            'Sucesso Parcial',
            `${succeededIds.length} insumo(s) salvo(s) com sucesso, porém ${failedMessages.length} apresentaram erro:\n\n${failedMessages.join('\n')}\n\nOs itens com erro foram mantidos na tela para que você possa corrigir e tentar novamente.`,
          );
        } else {
          Alert.alert(
            'Erro ao Registrar',
            `Não foi possível salvar os registros no estoque:\n\n${failedMessages.join('\n')}`,
          );
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitButtonTitle = useMemo(() => {
    const count = items.length;
    if (entryMode === 'purchase') {
      return count > 1 ? `Salvar ${count} Compras no Estoque` : 'Salvar Compra no Estoque';
    }
    return count > 1 ? `Salvar ${count} Ajustes de Estoque` : 'Salvar Ajuste de Estoque';
  }, [entryMode, items.length]);

  const submittingStatusText = useMemo(() => {
    if (savingTotal > 1) {
      return `Salvando insumo ${savingIndex} de ${savingTotal}...`;
    }
    return 'Salvando no estoque...';
  }, [savingIndex, savingTotal]);

  const styles = useMemo(() => createStyles(theme, isMobile), [theme, isMobile]);

  return (
    <>
      <Stack.Screen options={{ title: 'Cadastrar no Estoque' }} />

      <KeyboardAwareScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bottomOffset={64}
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
              Cadastre compras ou ajustes de insumos da sua cozinha, sejam itens novos ou já
              cadastrados no catálogo.
            </Text>
          </View>

          <OfflineBanner
            isVisible={isOffline}
            message="Você está offline. Operações de compra e ajuste de estoque requerem conexão com a internet."
          />

          {/* Draft Recovery Banner */}
          <DraftRecoveryBanner
            isVisible={isDraftBannerVisible}
            draftTimestamp={draftTimestamp}
            onRestore={handleRestoreDraft}
            onDiscard={handleDiscardDraft}
            title="Rascunho de entrada em estoque encontrado"
            subtitle="Você possui registros não salvos da última sessão. Deseja restaurar a lista de insumos?"
          />

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
                style={[styles.modeTabText, entryMode === 'adjustment' && styles.modeTabTextActive]}
              >
                Ajuste de Saldo
              </Text>
            </TouchableOpacity>
          </View>

          {/* List of Stock Entry Cards (spacious, uncompressed fieldsets) */}
          <View style={styles.entriesList}>
            {items.map((entryItem, index) => (
              <StockEntryCard
                key={entryItem.id}
                item={entryItem}
                index={index}
                totalItems={items.length}
                entryMode={entryMode}
                availableIngredients={availableIngredients}
                inventory={inventory}
                priceDecimalPlaces={priceDecimalPlaces}
                isMobile={isMobile}
                onChange={handleUpdateItem}
                onRemove={handleRemoveItem}
              />
            ))}
          </View>

          {/* Button to expand a new ingredient form in the same screen */}
          <TouchableOpacity
            style={styles.btnAddItem}
            onPress={handleAddItem}
            disabled={isSubmitting}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Adicionar outro insumo"
          >
            <MaterialCommunityIcons
              name="plus-circle-outline"
              size={22}
              color={theme.colors.primary}
            />
            <Text style={styles.btnAddItemText}>Adicionar Outro Insumo</Text>
          </TouchableOpacity>

          {/* Batch total highlight for multi-item purchases */}
          {items.length > 1 && entryMode === 'purchase' && totalBatchCost > 0 && (
            <View style={styles.batchTotalBox}>
              <Text style={styles.batchTotalLabel}>Total da Compra ({items.length} insumos):</Text>
              <Text style={styles.batchTotalValue}>
                {formatCurrency(totalBatchCost, priceDecimalPlaces)}
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            {isSubmitting ? (
              <View style={styles.submittingContainer}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={styles.submittingText}>{submittingStatusText}</Text>
              </View>
            ) : (
              <CustomButton
                title={submitButtonTitle}
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
              isDisabled={isSubmitting}
            />
          </View>
        </View>
      </KeyboardAwareScrollView>
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
      maxWidth: 640,
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.rounded.lg,
      padding: isMobile ? 16 : 24,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      ...theme.shadows.soft,
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
      backgroundColor: theme.colors.surfaceContainerLow,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      marginBottom: 10,
    },
    headline: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 22,
      fontWeight: 'bold',
      color: theme.colors.espressoDark,
      textAlign: 'center',
      marginBottom: 4,
    },
    subheadline: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      lineHeight: 18,
      paddingHorizontal: 8,
    },
    modeTabs: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surfaceContainerLow,
      borderRadius: theme.rounded.md,
      padding: 4,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    modeTab: {
      flex: 1,
      minHeight: 48,
      height: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.rounded.sm,
      gap: 8,
    },
    modeTabActive: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      ...theme.shadows.soft,
    },
    modeTabText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
    },
    modeTabTextActive: {
      color: theme.colors.primary,
      fontWeight: '700',
    },
    entriesList: {
      width: '100%',
      gap: 20,
    },
    btnAddItem: {
      width: '100%',
      minHeight: 50,
      height: 50,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.rounded.default,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.surfaceContainerLow,
      gap: 8,
      marginVertical: 4,
    },
    btnAddItemText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    batchTotalBox: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.parchment,
      borderRadius: theme.rounded.default,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    batchTotalLabel: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.espressoDark,
    },
    batchTotalValue: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.tertiary,
    },
    actionButtonsContainer: {
      width: '100%',
      gap: 10,
      marginTop: 4,
    },
    submittingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 50,
      gap: 10,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderRadius: theme.rounded.default,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    submittingText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.espressoDark,
    },
    btnSubmit: {
      width: '100%',
      height: 50,
      minHeight: 48,
      borderRadius: theme.rounded.default,
      margin: 0,
    },
    btnCancel: {
      width: '100%',
      height: 50,
      minHeight: 48,
      borderRadius: theme.rounded.default,
      margin: 0,
    },
  });
