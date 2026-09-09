import { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';
import { PlannedProductionItem, PurchaseProjectionData } from '@/src/types/analytics';
import { formatCurrency, formatQuantity } from '@/src/utils/formatters';

import { AddPlannedRecipeModal } from './AddPlannedRecipeModal';

export interface PurchaseProjectionSectionProps {
  plannedProductions: PlannedProductionItem[];
  projection: PurchaseProjectionData | null;
  isCalculating: boolean;
  hasError: boolean;
  errorMessage: string | null;
  onAddPlannedProduction: (item: PlannedProductionItem) => void;
  onUpdateYield: (recipeId: string, yieldVal: number) => void;
  onRemovePlannedProduction: (recipeId: string) => void;
  onClearPlannedProductions: () => void;
  onCalculate: () => void;
  isDesktop?: boolean;
}

export function PurchaseProjectionSection({
  plannedProductions,
  projection,
  isCalculating,
  hasError,
  errorMessage,
  onAddPlannedProduction,
  onUpdateYield,
  onRemovePlannedProduction,
  onClearPlannedProductions,
  onCalculate,
  isDesktop = false,
}: PurchaseProjectionSectionProps) {
  const { theme } = useThemeMode();
  const styles = useMemo(() => createStyles(theme, isDesktop), [theme, isDesktop]);

  const [isAddModalVisible, setIsAddModalVisible] = useState(false);

  const hasPlannedRecipes = plannedProductions.length > 0;
  const hasProjection = Boolean(projection);
  const hasDeficitItems = Boolean(projection && projection.items.length > 0);

  const excludedRecipeIds = useMemo(
    () => plannedProductions.map((p) => p.recipeId),
    [plannedProductions],
  );

  return (
    <View style={styles.container}>
      {/* Header Panel */}
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View style={styles.headerTextGroup}>
            <Text style={styles.sectionHeading}>Previsão de Compras</Text>
            <Text style={styles.sectionSubtitle}>
              Simule a explosão de receitas planejadas e descubra exatamente o que falta no seu
              estoque e quanto irá gastar.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.addRecipeBtn}
            onPress={() => setIsAddModalVisible(true)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Adicionar receita ao planejamento de compras"
          >
            <MaterialCommunityIcons name="plus" size={20} color={theme.colors.white} />
            <Text style={styles.addRecipeBtnText}>Adicionar Receita</Text>
          </TouchableOpacity>
        </View>

        {/* Planned Recipes List */}
        {!hasPlannedRecipes ? (
          <View style={styles.emptyPlanCard}>
            <MaterialCommunityIcons
              name="basket-plus-outline"
              size={36}
              color={theme.colors.outline}
            />
            <Text style={styles.emptyPlanTitle}>Nenhuma receita adicionada ao plano</Text>
            <Text style={styles.emptyPlanSubtitle}>
              Clique em &quot;Adicionar Receita&quot; acima para selecionar o que pretende produzir
              e calcular a demanda de ingredientes faltantes.
            </Text>
          </View>
        ) : (
          <View style={styles.plannedList}>
            <Text style={styles.plannedListTitle}>Receitas Planejadas:</Text>
            {plannedProductions.map((item) => (
              <View key={item.recipeId} style={styles.plannedItemCard}>
                <View style={styles.itemInfoCol}>
                  <Text style={styles.recipeTitleText} numberOfLines={1}>
                    {item.recipeTitle || 'Receita'}
                  </Text>
                  <Text style={styles.recipeYieldSubtext}>
                    Rendimento: {item.targetYield} {item.yieldUnit || 'un'}
                  </Text>
                </View>

                {/* Yield Stepper */}
                <View style={styles.stepperGroup}>
                  <TouchableOpacity
                    style={styles.stepMiniBtn}
                    onPress={() => onUpdateYield(item.recipeId, Math.max(1, item.targetYield - 1))}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Diminuir rendimento planejado"
                  >
                    <MaterialCommunityIcons
                      name="minus"
                      size={16}
                      color={theme.colors.espressoDark}
                    />
                  </TouchableOpacity>

                  <Text style={styles.stepYieldValue}>{item.targetYield}</Text>

                  <TouchableOpacity
                    style={styles.stepMiniBtn}
                    onPress={() => onUpdateYield(item.recipeId, item.targetYield + 1)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Aumentar rendimento planejado"
                  >
                    <MaterialCommunityIcons
                      name="plus"
                      size={16}
                      color={theme.colors.espressoDark}
                    />
                  </TouchableOpacity>
                </View>

                {/* Remove Button */}
                <TouchableOpacity
                  style={styles.removeItemBtn}
                  onPress={() => onRemovePlannedProduction(item.recipeId)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`Remover receita ${item.recipeTitle} do plano`}
                >
                  <MaterialCommunityIcons
                    name="trash-can-outline"
                    size={20}
                    color={theme.colors.error}
                  />
                </TouchableOpacity>
              </View>
            ))}

            {/* Action Buttons */}
            <View style={styles.planActionsRow}>
              <TouchableOpacity
                style={styles.clearPlanBtn}
                onPress={onClearPlannedProductions}
                activeOpacity={0.7}
                disabled={isCalculating}
                accessibilityRole="button"
                accessibilityLabel="Limpar receitas planejadas"
              >
                <Text style={styles.clearPlanBtnText}>Limpar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.calculateBtn, isCalculating && styles.calculateBtnDisabled]}
                onPress={onCalculate}
                disabled={isCalculating}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Calcular insumos faltantes e projeção de compras"
              >
                {isCalculating ? (
                  <ActivityIndicator size="small" color={theme.colors.white} />
                ) : (
                  <MaterialCommunityIcons name="calculator" size={18} color={theme.colors.white} />
                )}
                <Text style={styles.calculateBtnText}>
                  {isCalculating ? 'Calculando...' : 'Calcular Insumos Faltantes'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Error Banner */}
      {hasError && (
        <View style={styles.errorCard}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={20}
            color={theme.colors.error}
          />
          <Text style={styles.errorText}>
            {errorMessage || 'Erro ao calcular a projeção de compras.'}
          </Text>
        </View>
      )}

      {/* Projection Results */}
      {hasProjection && projection && (
        <View style={styles.resultsContainer}>
          {/* Result KPI Cards */}
          <View style={styles.resultKpiGrid}>
            <View style={styles.resultKpiCard}>
              <View style={styles.kpiTopRow}>
                <Text style={styles.kpiLabel}>Insumos em Falta</Text>
                <MaterialCommunityIcons
                  name="alert-circle-outline"
                  size={20}
                  color={
                    projection.totalItemsToPurchase > 0 ? theme.colors.error : theme.colors.tertiary
                  }
                />
              </View>
              <Text style={styles.resultKpiValue}>
                {projection.totalItemsToPurchase}{' '}
                {projection.totalItemsToPurchase === 1 ? 'item' : 'itens'}
              </Text>
              <Text style={styles.kpiSubtitle}>
                {projection.totalItemsToPurchase > 0
                  ? 'Exigem aquisição para atender à produção'
                  : 'Nenhum ingrediente em falta'}
              </Text>
            </View>

            <View style={styles.resultKpiCard}>
              <View style={styles.kpiTopRow}>
                <Text style={styles.kpiLabel}>Gasto Estimado</Text>
                <MaterialCommunityIcons
                  name="currency-usd"
                  size={20}
                  color={theme.colors.primary}
                />
              </View>
              <Text style={styles.resultKpiValue}>
                {formatCurrency(projection.totalEstimatedExpenditure)}
              </Text>
              <Text style={styles.kpiSubtitle}>Baseado no histórico de compras do seu estoque</Text>
            </View>
          </View>

          {/* 100% Stock Sufficient Banner */}
          {!hasDeficitItems && (
            <View style={styles.allCoveredCard}>
              <MaterialCommunityIcons
                name="check-decagram"
                size={32}
                color={theme.colors.tertiary}
              />
              <View style={styles.allCoveredTextGroup}>
                <Text style={styles.allCoveredTitle}>Estoque 100% Abastecido!</Text>
                <Text style={styles.allCoveredSubtitle}>
                  Você já possui todos os insumos necessários em quantidade suficiente para fabricar
                  essas produções planejadas. Nenhuma compra adicional necessária.
                </Text>
              </View>
            </View>
          )}

          {/* Deficit Items Table / List */}
          {hasDeficitItems && (
            <View style={styles.deficitCard}>
              <View style={styles.deficitHeader}>
                <Text style={styles.deficitTitle}>Lista de Insumos para Comprar</Text>
                <Text style={styles.deficitSubtitle}>
                  Quantidades faltantes calculadas após dedução do saldo atual em estoque
                </Text>
              </View>

              <View style={styles.deficitList}>
                {projection.items.map((item) => (
                  <View key={item.ingredientId} style={styles.deficitRow}>
                    <View style={styles.deficitItemMain}>
                      <View style={styles.deficitItemTitleRow}>
                        <Text style={styles.deficitItemName}>{item.name}</Text>
                        {item.unestimated && (
                          <View style={styles.unestimatedBadge}>
                            <Text style={styles.unestimatedText}>Sem custo base</Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.deficitItemMetaRow}>
                        <Text style={styles.deficitMetaText}>
                          Necessário: {formatQuantity(item.requiredQuantity, item.unit)}
                        </Text>
                        <Text style={styles.metaDivider}>•</Text>
                        <Text style={styles.deficitMetaText}>
                          Estoque atual: {formatQuantity(item.currentQuantity, item.unit)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.deficitItemValues}>
                      <View style={styles.deficitQuantityPill}>
                        <Text style={styles.deficitQuantityLabel}>Falta:</Text>
                        <Text style={styles.deficitQuantityValue}>
                          {formatQuantity(item.deficitQuantity, item.unit)}
                        </Text>
                      </View>

                      <Text style={styles.estimatedCostText}>
                        {item.unestimated ? '—' : formatCurrency(item.estimatedCost)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      {/* Modal */}
      <AddPlannedRecipeModal
        isVisible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
        onAdd={onAddPlannedProduction}
        excludedRecipeIds={excludedRecipeIds}
      />
    </View>
  );
}

const createStyles = (theme: AppTheme, isDesktop: boolean) =>
  StyleSheet.create({
    container: {
      width: '100%',
      gap: 16,
    },
    headerCard: {
      width: '100%',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.lg,
      padding: isDesktop ? 20 : 16,
      gap: 16,
      ...theme.shadows.soft,
    },
    headerRow: {
      flexDirection: isDesktop ? 'row' : 'column',
      alignItems: isDesktop ? 'center' : 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
    },
    headerTextGroup: {
      flex: 1,
      gap: 2,
    },
    sectionHeading: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: isDesktop ? 20 : 18,
      fontWeight: '700',
      color: theme.colors.espressoDark,
    },
    sectionSubtitle: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 18,
    },
    addRecipeBtn: {
      minHeight: theme.spacing.touchable,
      paddingHorizontal: 16,
      backgroundColor: theme.colors.primary,
      borderRadius: theme.rounded.default,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      alignSelf: isDesktop ? 'center' : 'stretch',
    },
    addRecipeBtnText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.white,
    },
    emptyPlanCard: {
      width: '100%',
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.md,
      padding: 24,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      textAlign: 'center',
    },
    emptyPlanTitle: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.espressoDark,
    },
    emptyPlanSubtitle: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      lineHeight: 18,
      maxWidth: 420,
    },
    plannedList: {
      gap: 10,
    },
    plannedListTitle: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.espressoDark,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    plannedItemCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.default,
      padding: 12,
      gap: 12,
    },
    itemInfoCol: {
      flex: 1,
      gap: 2,
    },
    recipeTitleText: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.espressoDark,
    },
    recipeYieldSubtext: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    stepperGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.default,
      overflow: 'hidden',
    },
    stepMiniBtn: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepYieldValue: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.espressoDark,
      minWidth: 32,
      textAlign: 'center',
    },
    removeItemBtn: {
      minWidth: theme.spacing.touchable,
      minHeight: theme.spacing.touchable,
      alignItems: 'center',
      justifyContent: 'center',
    },
    planActionsRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: 12,
      marginTop: 8,
    },
    clearPlanBtn: {
      minHeight: theme.spacing.touchable,
      paddingHorizontal: 16,
      borderRadius: theme.rounded.default,
      alignItems: 'center',
      justifyContent: 'center',
    },
    clearPlanBtnText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
    },
    calculateBtn: {
      minHeight: theme.spacing.touchable,
      paddingHorizontal: 20,
      backgroundColor: theme.colors.primary,
      borderRadius: theme.rounded.default,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    calculateBtnDisabled: {
      opacity: 0.6,
    },
    calculateBtnText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.white,
    },
    errorCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: theme.colors.errorContainer,
      borderRadius: theme.rounded.default,
      padding: 12,
      borderWidth: 1,
      borderColor: theme.colors.error,
    },
    errorText: {
      flex: 1,
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onErrorContainer,
    },
    resultsContainer: {
      width: '100%',
      gap: 16,
    },
    resultKpiGrid: {
      width: '100%',
      flexDirection: isDesktop ? 'row' : 'column',
      gap: 12,
    },
    resultKpiCard: {
      flex: 1,
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.lg,
      padding: 16,
      gap: 6,
      ...theme.shadows.soft,
    },
    kpiTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    kpiLabel: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    resultKpiValue: {
      fontFamily: theme.typography.headlineLg.fontFamily,
      fontSize: 22,
      fontWeight: '700',
      color: theme.colors.espressoDark,
    },
    kpiSubtitle: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    allCoveredCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.chips.success.background,
      borderWidth: 1,
      borderColor: theme.colors.tertiary,
      borderRadius: theme.rounded.lg,
      padding: 16,
      gap: 14,
    },
    allCoveredTextGroup: {
      flex: 1,
      gap: 2,
    },
    allCoveredTitle: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.chips.success.text,
    },
    allCoveredSubtitle: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.chips.success.text,
      lineHeight: 18,
    },
    deficitCard: {
      width: '100%',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.lg,
      padding: isDesktop ? 20 : 16,
      gap: 16,
      ...theme.shadows.soft,
    },
    deficitHeader: {
      gap: 2,
    },
    deficitTitle: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.espressoDark,
    },
    deficitSubtitle: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    deficitList: {
      width: '100%',
    },
    deficitRow: {
      flexDirection: isDesktop ? 'row' : 'column',
      alignItems: isDesktop ? 'center' : 'flex-start',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.surfaceContainerHigh,
      gap: 8,
    },
    deficitItemMain: {
      flex: 1,
      gap: 4,
    },
    deficitItemTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    deficitItemName: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.espressoDark,
    },
    unestimatedBadge: {
      backgroundColor: theme.colors.surfaceContainerHigh,
      borderWidth: 1,
      borderColor: theme.colors.warning,
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: theme.rounded.default,
    },
    unestimatedText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 10,
      fontWeight: '600',
      color: theme.colors.warning,
    },
    deficitItemMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    deficitMetaText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    metaDivider: {
      color: theme.colors.outline,
      fontSize: 12,
    },
    deficitItemValues: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      alignSelf: isDesktop ? 'center' : 'flex-end',
    },
    deficitQuantityPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: theme.rounded.default,
      gap: 4,
    },
    deficitQuantityLabel: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
    },
    deficitQuantityValue: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    estimatedCostText: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.espressoDark,
      minWidth: 80,
      textAlign: 'right',
    },
  });
