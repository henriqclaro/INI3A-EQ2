import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';
import {
  AdjustmentRequest,
  InventoryItem,
  PurchaseRequest,
  WasteRequest,
} from '@/src/types/inventory';
import { formatCurrency, formatQuantity } from '@/src/utils/formatters';

export type StockOperationType = 'adjust' | 'purchase' | 'waste';

interface StockOperationModalProps {
  isOpen: boolean;
  item: InventoryItem | null;
  initialMode?: StockOperationType;
  onClose: () => void;
  onRegisterAdjustment: (data: AdjustmentRequest) => Promise<unknown>;
  onRegisterPurchase: (data: PurchaseRequest) => Promise<unknown>;
  onRegisterWaste: (data: WasteRequest) => Promise<unknown>;
}

interface StockOperationModalFormProps {
  item: InventoryItem;
  initialMode: StockOperationType;
  onClose: () => void;
  onRegisterAdjustment: (data: AdjustmentRequest) => Promise<unknown>;
  onRegisterPurchase: (data: PurchaseRequest) => Promise<unknown>;
  onRegisterWaste: (data: WasteRequest) => Promise<unknown>;
}

const StockOperationModalForm = ({
  item,
  initialMode,
  onClose,
  onRegisterAdjustment,
  onRegisterPurchase,
  onRegisterWaste,
}: StockOperationModalFormProps) => {
  const { theme } = useThemeMode();
  const [activeTab, setActiveTab] = useState<StockOperationType>(initialMode);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states initialized directly from props without effect
  const [quantityInput, setQuantityInput] = useState(
    initialMode === 'adjust' ? String(item.currentQuantity) : '',
  );
  const [costInput, setCostInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [expirationDateInput, setExpirationDateInput] = useState('');

  const styles = useMemo(() => createStyles(theme), [theme]);

  const currentQty = Number(item.currentQuantity) || 0;
  const unitCost = Number(item.costPerBaseUnit) || 0;
  const baseUnit = item.ingredient?.baseUnit || 'un';
  const ingredientName = item.ingredient?.name || 'Ingrediente';

  const isAdjustMode = activeTab === 'adjust';
  const isPurchaseMode = activeTab === 'purchase';
  const isWasteMode = activeTab === 'waste';

  // Derived calculations
  const parsedQty = parseFloat(quantityInput.replace(',', '.')) || 0;
  const parsedCost = parseFloat(costInput.replace(',', '.')) || 0;

  // For adjustment
  const deltaQty = parsedQty - currentQty;

  // For purchase
  const calculatedNewUnitCost = parsedQty > 0 && parsedCost > 0 ? parsedCost / parsedQty : 0;

  // For waste
  const calculatedLossValue = parsedQty > 0 ? parsedQty * unitCost : 0;
  const hasWasteOverflow = isWasteMode && parsedQty > currentQty;

  const handleSubmit = async () => {
    if (isAdjustMode) {
      if (isNaN(parsedQty) || parsedQty < 0) {
        Alert.alert('Valor Inválido', 'A quantidade real em estoque não pode ser negativa.');
        return;
      }

      try {
        setIsSubmitting(true);
        await onRegisterAdjustment({
          ingredientId: item.ingredientId,
          realQuantity: parsedQty,
          notes: notesInput.trim() || undefined,
        });
        onClose();
      } catch (err: unknown) {
        const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
        Alert.alert('Erro', apiErr.response?.data?.message || 'Falha ao registrar ajuste.');
      } finally {
        setIsSubmitting(false);
      }
    } else if (isPurchaseMode) {
      if (isNaN(parsedQty) || parsedQty <= 0) {
        Alert.alert('Quantidade Inválida', 'Informe uma quantidade comprada maior que zero.');
        return;
      }
      if (isNaN(parsedCost) || parsedCost <= 0) {
        Alert.alert('Custo Inválido', 'Informe um valor total de custo maior que zero.');
        return;
      }

      // Check date format if provided
      let formattedExpDate: string | undefined = undefined;
      if (expirationDateInput.trim()) {
        const cleaned = expirationDateInput.trim();
        // Check YYYY-MM-DD or DD/MM/YYYY
        if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
          formattedExpDate = cleaned;
        } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleaned)) {
          const [d, m, y] = cleaned.split('/');
          formattedExpDate = `${y}-${m}-${d}`;
        } else {
          Alert.alert(
            'Data Inválida',
            'Informe a data de validade no formato DD/MM/AAAA ou AAAA-MM-DD.',
          );
          return;
        }
      }

      try {
        setIsSubmitting(true);
        await onRegisterPurchase({
          ingredientId: item.ingredientId,
          quantity: parsedQty,
          totalCost: parsedCost,
          expirationDate: formattedExpDate,
        });
        onClose();
      } catch (err: unknown) {
        const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
        Alert.alert('Erro', apiErr.response?.data?.message || 'Falha ao registrar compra.');
      } finally {
        setIsSubmitting(false);
      }
    } else if (isWasteMode) {
      if (isNaN(parsedQty) || parsedQty <= 0) {
        Alert.alert('Quantidade Inválida', 'Informe uma quantidade de perda maior que zero.');
        return;
      }
      if (parsedQty > currentQty) {
        Alert.alert(
          'Saldo Insuficiente',
          `A perda não pode ser maior que o saldo em estoque (${formatQuantity(currentQty, baseUnit)}).`,
        );
        return;
      }

      try {
        setIsSubmitting(true);
        await onRegisterWaste({
          ingredientId: item.ingredientId,
          quantity: parsedQty,
          notes: notesInput.trim() || undefined,
        });
        onClose();
      } catch (err: unknown) {
        const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
        Alert.alert('Erro', apiErr.response?.data?.message || 'Falha ao registrar perda.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <View style={styles.overlay}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.avoidContainer}
      >
        <View style={styles.modalCard}>
          {/* Modal Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleArea}>
              <Text style={styles.title} numberOfLines={1}>
                {ingredientName}
              </Text>
              <Text style={styles.subtitle}>
                Saldo Atual: {formatQuantity(currentQty, baseUnit)}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Fechar modal"
            >
              <MaterialCommunityIcons name="close" size={24} color={theme.colors.onSurface} />
            </TouchableOpacity>
          </View>

          {/* Segmented Tab Controls */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tabBtn, isAdjustMode && styles.tabBtnActive]}
              onPress={() => {
                setActiveTab('adjust');
                setQuantityInput(String(currentQty));
              }}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="tune-variant"
                size={16}
                color={isAdjustMode ? theme.colors.primary : theme.colors.onSurfaceVariant}
              />
              <Text style={[styles.tabText, isAdjustMode && styles.tabTextActive]}>Ajuste</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, isPurchaseMode && styles.tabBtnActive]}
              onPress={() => {
                setActiveTab('purchase');
                setQuantityInput('');
              }}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="cart-plus"
                size={16}
                color={isPurchaseMode ? theme.colors.primary : theme.colors.onSurfaceVariant}
              />
              <Text style={[styles.tabText, isPurchaseMode && styles.tabTextActive]}>
                + Entrada
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, isWasteMode && styles.tabBtnActive]}
              onPress={() => {
                setActiveTab('waste');
                setQuantityInput('');
              }}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="trash-can-outline"
                size={16}
                color={isWasteMode ? theme.colors.primary : theme.colors.onSurfaceVariant}
              />
              <Text style={[styles.tabText, isWasteMode && styles.tabTextActive]}>- Perda</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollArea}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* TAB 1: ADJUSTMENT */}
            {isAdjustMode && (
              <View style={styles.formContainer}>
                <Text style={styles.formExplainer}>
                  Atualize a contagem física real presente na cozinha.
                </Text>

                <View style={styles.fieldWrapper}>
                  <Text style={styles.label}>Nova Quantidade Real ({baseUnit}) *</Text>
                  <View style={styles.inputWithSuffix}>
                    <TextInput
                      style={styles.textInput}
                      value={quantityInput}
                      onChangeText={setQuantityInput}
                      placeholder="0"
                      placeholderTextColor={theme.colors.onSurfaceVariant}
                      keyboardType="numeric"
                    />
                    <View style={styles.suffixBadge}>
                      <Text style={styles.suffixText}>{baseUnit}</Text>
                    </View>
                  </View>
                </View>

                {/* Delta Preview */}
                <View style={styles.previewBox}>
                  <Text style={styles.previewBoxLabel}>Variação da contagem:</Text>
                  <Text
                    style={[
                      styles.previewBoxValue,
                      deltaQty > 0
                        ? styles.previewPositive
                        : deltaQty < 0
                          ? styles.previewNegative
                          : undefined,
                    ]}
                  >
                    {deltaQty > 0
                      ? `+${formatQuantity(deltaQty, baseUnit)} (Sobra)`
                      : deltaQty < 0
                        ? `${formatQuantity(deltaQty, baseUnit)} (Falta)`
                        : 'Sem alteração'}
                  </Text>
                </View>

                <View style={styles.fieldWrapper}>
                  <Text style={styles.label}>Observação / Motivo (Opcional)</Text>
                  <TextInput
                    style={styles.textArea}
                    value={notesInput}
                    onChangeText={setNotesInput}
                    placeholder="Ex: Contagem mensal da despensa..."
                    placeholderTextColor={theme.colors.onSurfaceVariant}
                    maxLength={255}
                    multiline
                  />
                </View>
              </View>
            )}

            {/* TAB 2: PURCHASE / ENTRY */}
            {isPurchaseMode && (
              <View style={styles.formContainer}>
                <Text style={styles.formExplainer}>
                  Cadastre uma nova compra deste ingrediente para somar ao saldo e recalcular o
                  custo médio ponderado.
                </Text>

                <View style={styles.fieldWrapper}>
                  <Text style={styles.label}>Quantidade Comprada ({baseUnit}) *</Text>
                  <View style={styles.inputWithSuffix}>
                    <TextInput
                      style={styles.textInput}
                      value={quantityInput}
                      onChangeText={setQuantityInput}
                      placeholder="Ex: 1000"
                      placeholderTextColor={theme.colors.onSurfaceVariant}
                      keyboardType="numeric"
                    />
                    <View style={styles.suffixBadge}>
                      <Text style={styles.suffixText}>{baseUnit}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.fieldWrapper}>
                  <Text style={styles.label}>Valor Total Pago (R$) *</Text>
                  <View style={styles.inputWithPrefix}>
                    <Text style={styles.prefixText}>R$</Text>
                    <TextInput
                      style={styles.textInput}
                      value={costInput}
                      onChangeText={setCostInput}
                      placeholder="0,00"
                      placeholderTextColor={theme.colors.onSurfaceVariant}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                {/* Calculated unit cost preview */}
                <View style={styles.previewBox}>
                  <Text style={styles.previewBoxLabel}>Custo unitário desta compra:</Text>
                  <Text style={styles.previewBoxValue}>
                    {calculatedNewUnitCost > 0
                      ? `${formatCurrency(calculatedNewUnitCost)} / ${baseUnit}`
                      : 'Informe quantidade e valor total'}
                  </Text>
                </View>

                <View style={styles.fieldWrapper}>
                  <Text style={styles.label}>Data de Validade (Opcional)</Text>
                  <TextInput
                    style={styles.singleInput}
                    value={expirationDateInput}
                    onChangeText={setExpirationDateInput}
                    placeholder="DD/MM/AAAA ou AAAA-MM-DD"
                    placeholderTextColor={theme.colors.onSurfaceVariant}
                  />
                </View>
              </View>
            )}

            {/* TAB 3: WASTE */}
            {isWasteMode && (
              <View style={styles.formContainer}>
                <Text style={styles.formExplainer}>
                  Registre ingredientes perdidos por validade vencida, avarias ou sobras de
                  produção.
                </Text>

                <View style={styles.fieldWrapper}>
                  <Text style={styles.label}>Quantidade Perdida ({baseUnit}) *</Text>
                  <View
                    style={[
                      styles.inputWithSuffix,
                      hasWasteOverflow ? styles.inputError : undefined,
                    ]}
                  >
                    <TextInput
                      style={styles.textInput}
                      value={quantityInput}
                      onChangeText={setQuantityInput}
                      placeholder="Ex: 200"
                      placeholderTextColor={theme.colors.onSurfaceVariant}
                      keyboardType="numeric"
                    />
                    <View style={styles.suffixBadge}>
                      <Text style={styles.suffixText}>{baseUnit}</Text>
                    </View>
                  </View>
                  {hasWasteOverflow && (
                    <Text style={styles.errorText}>
                      Quantidade não pode exceder o estoque atual (
                      {formatQuantity(currentQty, baseUnit)}).
                    </Text>
                  )}
                </View>

                {/* Calculated loss value */}
                <View style={styles.previewBox}>
                  <Text style={styles.previewBoxLabel}>Prejuízo financeiro estimado:</Text>
                  <Text style={[styles.previewBoxValue, styles.previewNegative]}>
                    {calculatedLossValue > 0 ? formatCurrency(calculatedLossValue) : 'R$ 0,00'}
                  </Text>
                </View>

                <View style={styles.fieldWrapper}>
                  <Text style={styles.label}>Motivo da Perda (Opcional)</Text>
                  <TextInput
                    style={styles.textArea}
                    value={notesInput}
                    onChangeText={setNotesInput}
                    placeholder="Ex: Pacote danificado, vencido..."
                    placeholderTextColor={theme.colors.onSurfaceVariant}
                    maxLength={255}
                    multiline
                  />
                </View>
              </View>
            )}
          </ScrollView>

          {/* Modal Actions */}
          <View style={styles.footerActions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              activeOpacity={0.8}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.submitBtn,
                isWasteMode ? styles.submitBtnDanger : styles.submitBtnPrimary,
              ]}
              onPress={handleSubmit}
              activeOpacity={0.8}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={theme.colors.onPrimary} />
              ) : (
                <Text style={styles.submitBtnText}>
                  {isAdjustMode
                    ? 'Salvar Ajuste'
                    : isPurchaseMode
                      ? 'Registrar Compra'
                      : 'Registrar Perda'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export const StockOperationModal = ({
  isOpen,
  item,
  initialMode = 'adjust',
  onClose,
  onRegisterAdjustment,
  onRegisterPurchase,
  onRegisterWaste,
}: StockOperationModalProps) => {
  if (!isOpen || !item) return null;

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <StockOperationModalForm
        key={`${item.ingredientId}-${initialMode}`}
        item={item}
        initialMode={initialMode}
        onClose={onClose}
        onRegisterAdjustment={onRegisterAdjustment}
        onRegisterPurchase={onRegisterPurchase}
        onRegisterWaste={onRegisterWaste}
      />
    </Modal>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: theme.colors.backdrop,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    avoidContainer: {
      width: '100%',
      maxWidth: 480,
      alignItems: 'center',
    },
    modalCard: {
      width: '100%',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.rounded.lg,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: 20,
      maxHeight: '90%',
      ...theme.shadows.modal,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
      paddingBottom: 12,
    },
    headerTitleArea: {
      flex: 1,
      marginRight: 8,
    },
    title: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.espressoDark,
    },
    subtitle: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
    },
    closeBtn: {
      width: 48,
      height: 48,
      justifyContent: 'center',
      alignItems: 'center',
    },
    tabsContainer: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surfaceContainerLow,
      borderRadius: theme.rounded.sm,
      padding: 4,
      marginVertical: 14,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    tabBtn: {
      flex: 1,
      height: 40,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.rounded.sm,
      gap: 6,
    },
    tabBtnActive: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      ...theme.shadows.soft,
    },
    tabText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
    },
    tabTextActive: {
      color: theme.colors.primary,
      fontWeight: '700',
    },
    scrollArea: {
      maxHeight: 340,
    },
    formContainer: {
      gap: 14,
      paddingVertical: 4,
    },
    formExplainer: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 18,
    },
    fieldWrapper: {
      width: '100%',
    },
    label: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: 6,
    },
    inputWithSuffix: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 48,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.sm,
      backgroundColor: theme.colors.surfaceContainerLowest,
      overflow: 'hidden',
    },
    inputWithPrefix: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 48,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.sm,
      backgroundColor: theme.colors.surfaceContainerLowest,
      paddingLeft: 12,
      overflow: 'hidden',
    },
    singleInput: {
      height: 48,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.sm,
      backgroundColor: theme.colors.surfaceContainerLowest,
      paddingHorizontal: 12,
      fontSize: 15,
      color: theme.colors.onSurface,
      fontFamily: theme.typography.bodyMd.fontFamily,
    },
    inputError: {
      borderColor: theme.colors.error,
    },
    errorText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 11,
      color: theme.colors.error,
      marginTop: 4,
    },
    prefixText: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
      marginRight: 4,
    },
    textInput: {
      flex: 1,
      height: '100%',
      paddingHorizontal: 12,
      fontSize: 15,
      color: theme.colors.onSurface,
      fontFamily: theme.typography.bodyMd.fontFamily,
    },
    suffixBadge: {
      backgroundColor: theme.colors.surfaceContainerLow,
      height: '100%',
      paddingHorizontal: 12,
      justifyContent: 'center',
      alignItems: 'center',
      borderLeftWidth: 1,
      borderLeftColor: theme.colors.outlineVariant,
    },
    suffixText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.onSurfaceVariant,
    },
    textArea: {
      minHeight: 70,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.sm,
      backgroundColor: theme.colors.surfaceContainerLowest,
      padding: 10,
      fontSize: 14,
      color: theme.colors.onSurface,
      fontFamily: theme.typography.bodyMd.fontFamily,
      textAlignVertical: 'top',
    },
    previewBox: {
      backgroundColor: theme.colors.surfaceContainerLow,
      borderRadius: theme.rounded.sm,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: 10,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    previewBoxLabel: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
    },
    previewBoxValue: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.onSurface,
    },
    previewPositive: {
      color: theme.colors.tertiary,
    },
    previewNegative: {
      color: theme.colors.error,
    },
    footerActions: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 18,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
      paddingTop: 14,
    },
    cancelBtn: {
      flex: 1,
      height: 48,
      borderRadius: theme.rounded.sm,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surfaceContainerLowest,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cancelBtnText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    submitBtn: {
      flex: 1.5,
      height: 48,
      borderRadius: theme.rounded.sm,
      justifyContent: 'center',
      alignItems: 'center',
    },
    submitBtnPrimary: {
      backgroundColor: theme.colors.primary,
      ...theme.shadows.glow,
    },
    submitBtnDanger: {
      backgroundColor: theme.colors.error,
    },
    submitBtnText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.onPrimary,
    },
  });
