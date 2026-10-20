import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { KeyboardAvoidingView, KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { DateInput } from '@/src/components/common';
import { useSettings } from '@/src/contexts/SettingsContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';
import {
  AdjustmentRequest,
  InventoryItem,
  PurchaseRequest,
  WasteRequest,
} from '@/src/types/inventory';
import {
  formatCurrency,
  formatDate,
  formatDateForApi,
  formatQuantity,
  getIngredientDisplayUnit,
  isExpired,
} from '@/src/utils/formatters';

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
  const { priceDecimalPlaces } = useSettings();
  const [activeTab, setActiveTab] = useState<StockOperationType>(initialMode);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQty = Number(item.currentQuantity) || 0;
  const unitCost = Number(item.costPerBaseUnit) || 0;
  const baseUnit = getIngredientDisplayUnit(item.ingredient);
  const ingredientName = item.ingredient?.name || 'Ingrediente';
  const isItemExpired = currentQty > 0 && isExpired(item.expirationDate);

  // Form states initialized directly from props without effect
  const [quantityInput, setQuantityInput] = useState(() => {
    if (initialMode === 'adjust') return String(item.currentQuantity);
    if (initialMode === 'waste' && isItemExpired && currentQty > 0) {
      return String(currentQty);
    }
    return '';
  });
  const [costInput, setCostInput] = useState('');
  const [notesInput, setNotesInput] = useState(() => {
    if (initialMode === 'waste' && isItemExpired) {
      return item.expirationDate
        ? `Descarte por validade vencida em ${formatDate(item.expirationDate)}`
        : 'Descarte por validade vencida';
    }
    return '';
  });
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);

  const styles = useMemo(() => createStyles(theme), [theme]);

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

      // Format optional expiration date for API request (YYYY-MM-DD)
      const formattedExpDate = formatDateForApi(expirationDate);

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
      <KeyboardAvoidingView behavior="padding" automaticOffset style={styles.avoidContainer}>
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
                if (isItemExpired && currentQty > 0) {
                  setQuantityInput(String(currentQty));
                  if (!notesInput) {
                    setNotesInput(
                      item.expirationDate
                        ? `Descarte por validade vencida em ${formatDate(item.expirationDate)}`
                        : 'Descarte por validade vencida',
                    );
                  }
                } else {
                  setQuantityInput('');
                }
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

          <KeyboardAwareScrollView
            style={styles.scrollArea}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bottomOffset={24}
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
                      placeholderTextColor={theme.colors.placeholder}
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
                    placeholderTextColor={theme.colors.placeholder}
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
                      placeholderTextColor={theme.colors.placeholder}
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
                      placeholderTextColor={theme.colors.placeholder}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                {/* Calculated unit cost preview */}
                <View style={styles.previewBox}>
                  <Text style={styles.previewBoxLabel}>Custo unitário desta compra:</Text>
                  <Text style={styles.previewBoxValue}>
                    {calculatedNewUnitCost > 0
                      ? `${formatCurrency(calculatedNewUnitCost, priceDecimalPlaces)} / ${baseUnit}`
                      : 'Informe quantidade e valor total'}
                  </Text>
                </View>

                <DateInput
                  label="Data de Validade (Opcional)"
                  value={expirationDate}
                  onChangeDate={setExpirationDate}
                  placeholder="DD/MM/AAAA"
                  isClearable
                />
              </View>
            )}

            {/* TAB 3: WASTE */}
            {isWasteMode && (
              <View style={styles.formContainer}>
                {isItemExpired ? (
                  <View style={styles.expiredBanner}>
                    <MaterialCommunityIcons
                      name="alert-decagram"
                      size={22}
                      color={theme.colors.error}
                      style={styles.expiredBannerIcon}
                    />
                    <View style={styles.expiredBannerContent}>
                      <Text style={styles.expiredBannerTitle}>Insumo com validade vencida!</Text>
                      <Text style={styles.expiredBannerSubtitle}>
                        Venceu em {formatDate(item.expirationDate)}. O descarte total foi
                        pré-preenchido para incentivar a segurança alimentar e evitar o uso de
                        insumos impróprios.
                      </Text>
                    </View>
                  </View>
                ) : (
                  <Text style={styles.formExplainer}>
                    Registre ingredientes perdidos por validade vencida, avarias ou sobras de
                    produção.
                  </Text>
                )}

                <View style={styles.fieldWrapper}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>Quantidade Perdida ({baseUnit}) *</Text>
                    {currentQty > 0 && (
                      <TouchableOpacity
                        style={[
                          styles.quickFillBtn,
                          isItemExpired ? styles.quickFillBtnExpired : undefined,
                        ]}
                        onPress={() => {
                          setQuantityInput(String(currentQty));
                          if (!notesInput) {
                            setNotesInput(
                              isItemExpired && item.expirationDate
                                ? `Descarte por validade vencida em ${formatDate(item.expirationDate)}`
                                : 'Descarte total do estoque',
                            );
                          }
                        }}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel={`Preencher com todo o estoque atual: ${formatQuantity(currentQty, baseUnit)}`}
                      >
                        <MaterialCommunityIcons
                          name={isItemExpired ? 'trash-can-outline' : 'lightning-bolt-outline'}
                          size={14}
                          color={isItemExpired ? theme.colors.error : theme.colors.primary}
                        />
                        <Text
                          style={[
                            styles.quickFillBtnText,
                            isItemExpired ? styles.quickFillBtnTextExpired : undefined,
                          ]}
                        >
                          {isItemExpired ? 'Descartar estoque total' : 'Todo o saldo'} (
                          {formatQuantity(currentQty, baseUnit)})
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
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
                      placeholder={currentQty > 0 ? `Ex: ${currentQty}` : '0'}
                      placeholderTextColor={theme.colors.placeholder}
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

                {/* Quick filling options */}
                {currentQty > 0 && (
                  <View style={styles.quickOptionsContainer}>
                    <Text style={styles.quickOptionsLabel}>Preenchimento rápido:</Text>
                    <View style={styles.quickChipsRow}>
                      <TouchableOpacity
                        style={[
                          styles.quickChip,
                          parsedQty === currentQty && styles.quickChipActive,
                        ]}
                        onPress={() => {
                          setQuantityInput(String(currentQty));
                          if (!notesInput) {
                            setNotesInput(
                              isItemExpired && item.expirationDate
                                ? `Descarte por validade vencida em ${formatDate(item.expirationDate)}`
                                : 'Descarte total do estoque',
                            );
                          }
                        }}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons
                          name="check-all"
                          size={14}
                          color={
                            parsedQty === currentQty
                              ? theme.colors.primary
                              : theme.colors.onSurfaceVariant
                          }
                        />
                        <Text
                          style={[
                            styles.quickChipText,
                            parsedQty === currentQty && styles.quickChipTextActive,
                          ]}
                        >
                          Estoque total (100%)
                        </Text>
                      </TouchableOpacity>

                      {currentQty >= 2 && (
                        <TouchableOpacity
                          style={[
                            styles.quickChip,
                            parsedQty === Math.round((currentQty / 2) * 100) / 100 &&
                              styles.quickChipActive,
                          ]}
                          onPress={() => {
                            setQuantityInput(String(Math.round((currentQty / 2) * 100) / 100));
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.quickChipText,
                              parsedQty === Math.round((currentQty / 2) * 100) / 100 &&
                                styles.quickChipTextActive,
                            ]}
                          >
                            Metade (50%)
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                )}

                {/* Calculated loss value */}
                <View style={styles.previewBox}>
                  <Text style={styles.previewBoxLabel}>Prejuízo financeiro estimado:</Text>
                  <Text style={[styles.previewBoxValue, styles.previewNegative]}>
                    {calculatedLossValue > 0
                      ? formatCurrency(calculatedLossValue, priceDecimalPlaces)
                      : 'R$ 0,00'}
                  </Text>
                </View>

                <View style={styles.fieldWrapper}>
                  <Text style={styles.label}>Motivo da Perda (Opcional)</Text>
                  <TextInput
                    style={styles.textArea}
                    value={notesInput}
                    onChangeText={setNotesInput}
                    placeholder="Ex: Pacote danificado, vencido..."
                    placeholderTextColor={theme.colors.placeholder}
                    maxLength={255}
                    multiline
                  />
                </View>
              </View>
            )}
          </KeyboardAwareScrollView>

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
                      : isItemExpired && parsedQty === currentQty
                        ? 'Descartar Lote Vencido'
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
    expiredBanner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: theme.colors.errorContainer,
      borderRadius: theme.rounded.sm,
      borderWidth: 1,
      borderColor: theme.colors.error,
      padding: 12,
      gap: 10,
    },
    expiredBannerIcon: {
      marginTop: 2,
    },
    expiredBannerContent: {
      flex: 1,
      gap: 3,
    },
    expiredBannerTitle: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.onErrorContainer,
    },
    expiredBannerSubtitle: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 11,
      color: theme.colors.onErrorContainer,
      lineHeight: 16,
    },
    labelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    quickFillBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: theme.rounded.full,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    quickFillBtnExpired: {
      backgroundColor: theme.colors.errorContainer,
      borderColor: theme.colors.error,
    },
    quickFillBtnText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    quickFillBtnTextExpired: {
      color: theme.colors.onErrorContainer,
    },
    quickOptionsContainer: {
      gap: 6,
      marginTop: 2,
    },
    quickOptionsLabel: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
    },
    quickChipsRow: {
      flexDirection: 'row',
      gap: 8,
      flexWrap: 'wrap',
    },
    quickChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: theme.rounded.sm,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surfaceContainerLow,
    },
    quickChipActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.surfaceContainerLowest,
    },
    quickChipText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
    },
    quickChipTextActive: {
      color: theme.colors.primary,
      fontWeight: '700',
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
