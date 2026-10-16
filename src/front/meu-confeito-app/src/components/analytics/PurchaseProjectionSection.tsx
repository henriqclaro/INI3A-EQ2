import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';
import { PlannedProductionItem, PurchaseProjectionData } from '@/src/types/analytics';
import { formatCurrency, formatQuantity } from '@/src/utils/formatters';
import { ShoppingListItem, shareShoppingList } from '@/src/utils/share';

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
  isDesktop: isDesktopProp,
}: PurchaseProjectionSectionProps) {
  const { theme } = useThemeMode();
  const { width } = useWindowDimensions();
  const isDesktop = isDesktopProp ?? width >= 768;
  const styles = useMemo(() => createStyles(theme, isDesktop), [theme, isDesktop]);

  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const hasPlannedRecipes = plannedProductions.length > 0;
  const hasProjection = Boolean(projection);
  const hasDeficitItems = Boolean(projection && projection.items.length > 0);

  const excludedRecipeIds = useMemo(
    () => plannedProductions.map((p) => p.recipeId),
    [plannedProductions],
  );

  const handleShareShoppingList = useCallback(async () => {
    if (!projection || projection.items.length === 0 || isSharing) return;

    setIsSharing(true);
    try {
      const shoppingItems: ShoppingListItem[] = projection.items.map((item) => ({
        name: item.name,
        quantity: formatQuantity(item.deficitQuantity),
        unit: item.unit || 'un',
      }));

      const plannedRecipes = plannedProductions.map((p) => ({
        title: p.recipeTitle || 'Receita',
        targetYield: p.targetYield,
        yieldUnit: p.yieldUnit,
      }));

      await shareShoppingList(shoppingItems, 'Insumos para Comprar • Previsão de Demanda', {
        plannedRecipes,
      });
    } finally {
      setIsSharing(false);
    }
  }, [projection, plannedProductions, isSharing]);

  const renderOriginChips = (origins?: ('OWN' | 'SAVED' | 'DOWNLOADED')[]) => {
    if (!origins || origins.length === 0) return null;

    return (
      <View style={styles.originsRow}>
        {origins.map((origin) => (
          <View
            key={origin}
            style={[
              styles.originChip,
              origin === 'OWN' && styles.originChipOwn,
              origin === 'SAVED' && styles.originChipSaved,
              origin === 'DOWNLOADED' && styles.originChipDownloaded,
            ]}
          >
            {origin === 'SAVED' && (
              <MaterialCommunityIcons
                name="bookmark-outline"
                size={11}
                color={theme.colors.secondary}
              />
            )}
            {origin === 'DOWNLOADED' && (
              <MaterialCommunityIcons
                name="cloud-check-outline"
                size={11}
                color={theme.colors.tertiary}
              />
            )}
            <Text
              style={[
                styles.originChipText,
                origin === 'OWN' && styles.originChipTextOwn,
                origin === 'SAVED' && styles.originChipTextSaved,
                origin === 'DOWNLOADED' && styles.originChipTextDownloaded,
              ]}
            >
              {origin === 'OWN' ? 'Própria' : origin === 'SAVED' ? 'Salva' : 'Baixada'}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header Panel */}
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View style={styles.headerTextGroup}>
            <Text style={styles.sectionHeading}>Previsão de Compras</Text>
            <Text style={styles.sectionSubtitle}>
              Simule a explosão de receitas planejadas (próprias, salvas ou baixadas) e descubra
              exatamente o que falta no seu estoque e quanto irá gastar.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.addRecipeBtn}
            onPress={() => setIsAddModalVisible(true)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Adicionar receita ao planejamento de compras"
          >
            <MaterialCommunityIcons name="plus" size={20} color={theme.colors.onPrimary} />
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
              Clique em &quot;Adicionar Receita&quot; acima para selecionar receitas próprias,
              salvas ou baixadas e calcular a demanda de insumos faltantes.
            </Text>
          </View>
        ) : (
          <View style={styles.plannedList}>
            <Text style={styles.plannedListTitle}>Receitas Planejadas:</Text>
            {plannedProductions.map((item) =>
              isDesktop ? (
                /* Desktop Planned Recipe Row */
                <View key={item.recipeId} style={styles.plannedItemCard}>
                  <View style={styles.itemInfoCol}>
                    <View style={styles.recipeTitleRow}>
                      <Text style={styles.recipeTitleText} numberOfLines={1}>
                        {item.recipeTitle || 'Receita'}
                      </Text>
                      {renderOriginChips(item.origins)}
                    </View>
                    <Text style={styles.recipeYieldSubtext}>
                      Rendimento: {item.targetYield} {item.yieldUnit || 'un'}
                    </Text>
                  </View>

                  {/* Yield Stepper */}
                  <View style={styles.stepperGroup}>
                    <TouchableOpacity
                      style={styles.stepMiniBtn}
                      onPress={() =>
                        onUpdateYield(item.recipeId, Math.max(1, item.targetYield - 1))
                      }
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel="Diminuir rendimento planejado"
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
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
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
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
              ) : (
                /* Mobile Planned Recipe Card */
                <View key={item.recipeId} style={styles.plannedItemCardMobile}>
                  <View style={styles.plannedMobileHeader}>
                    <View style={styles.plannedMobileTitleGroup}>
                      <Text style={styles.recipeTitleText} numberOfLines={2}>
                        {item.recipeTitle || 'Receita'}
                      </Text>
                      {renderOriginChips(item.origins)}
                    </View>

                    <TouchableOpacity
                      style={styles.removeItemBtnMobile}
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

                  <View style={styles.plannedMobileDivider} />

                  <View style={styles.plannedMobileBottomRow}>
                    <View style={styles.plannedMobileYieldInfo}>
                      <Text style={styles.plannedMobileYieldLabel}>Rendimento a produzir:</Text>
                      <Text style={styles.plannedMobileYieldUnit}>{item.yieldUnit || 'un'}</Text>
                    </View>

                    <View style={styles.stepperGroupMobile}>
                      <TouchableOpacity
                        style={styles.stepMiniBtnMobile}
                        onPress={() =>
                          onUpdateYield(item.recipeId, Math.max(1, item.targetYield - 1))
                        }
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel="Diminuir rendimento planejado"
                        hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                      >
                        <MaterialCommunityIcons
                          name="minus"
                          size={18}
                          color={theme.colors.espressoDark}
                        />
                      </TouchableOpacity>

                      <Text style={styles.stepYieldValueMobile}>{item.targetYield}</Text>

                      <TouchableOpacity
                        style={styles.stepMiniBtnMobile}
                        onPress={() => onUpdateYield(item.recipeId, item.targetYield + 1)}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel="Aumentar rendimento planejado"
                        hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                      >
                        <MaterialCommunityIcons
                          name="plus"
                          size={18}
                          color={theme.colors.espressoDark}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ),
            )}

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
                  <ActivityIndicator size="small" color={theme.colors.onPrimary} />
                ) : (
                  <MaterialCommunityIcons
                    name="calculator"
                    size={18}
                    color={theme.colors.onPrimary}
                  />
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
              <View style={styles.deficitHeaderRow}>
                <View style={styles.deficitHeaderTextGroup}>
                  <Text style={styles.deficitTitle}>Lista de Insumos para Comprar</Text>
                  <Text style={styles.deficitSubtitle}>
                    Quantidades faltantes calculadas após dedução do saldo atual em estoque
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.shareListBtn}
                  onPress={handleShareShoppingList}
                  disabled={isSharing}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Compartilhar lista de compras de insumos faltantes"
                >
                  {isSharing ? (
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                  ) : (
                    <MaterialCommunityIcons
                      name="share-variant-outline"
                      size={18}
                      color={theme.colors.primary}
                    />
                  )}
                  <Text style={styles.shareListBtnText}>
                    {isSharing
                      ? 'Compartilhando...'
                      : isDesktop
                        ? 'Compartilhar Lista'
                        : 'Compartilhar Lista de Compras'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.deficitList}>
                {projection.items.map((item) =>
                  isDesktop ? (
                    /* Desktop Deficit Table Row */
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
                  ) : (
                    /* Mobile Deficit Card */
                    <View key={item.ingredientId} style={styles.deficitItemCardMobile}>
                      <View style={styles.deficitMobileTopRow}>
                        <View style={styles.deficitMobileNameCol}>
                          <Text style={styles.deficitItemNameMobile} numberOfLines={2}>
                            {item.name}
                          </Text>
                          {item.unestimated && (
                            <View style={styles.unestimatedBadge}>
                              <Text style={styles.unestimatedText}>Sem custo base</Text>
                            </View>
                          )}
                        </View>

                        <View style={styles.deficitMobileCostCol}>
                          <Text style={styles.deficitMobileCostLabel}>Custo est.</Text>
                          <Text style={styles.deficitMobileCostValue}>
                            {item.unestimated ? '—' : formatCurrency(item.estimatedCost)}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.deficitMobileMetricsBar}>
                        <View style={styles.deficitMobileMetricBox}>
                          <Text style={styles.deficitMobileMetricLabel}>Necessário</Text>
                          <Text style={styles.deficitMobileMetricValue}>
                            {formatQuantity(item.requiredQuantity, item.unit)}
                          </Text>
                        </View>

                        <View style={styles.deficitMobileMetricDivider} />

                        <View style={styles.deficitMobileMetricBox}>
                          <Text style={styles.deficitMobileMetricLabel}>Em Estoque</Text>
                          <Text style={styles.deficitMobileMetricValue}>
                            {formatQuantity(item.currentQuantity, item.unit)}
                          </Text>
                        </View>

                        <View style={styles.deficitMobileMetricDivider} />

                        <View
                          style={[
                            styles.deficitMobileMetricBox,
                            styles.deficitMobileMetricBoxAlert,
                          ]}
                        >
                          <Text style={styles.deficitMobileMetricLabelAlert}>A Comprar</Text>
                          <Text style={styles.deficitMobileMetricValueAlert}>
                            {formatQuantity(item.deficitQuantity, item.unit)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ),
                )}
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
      alignItems: isDesktop ? 'center' : 'stretch',
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
      color: theme.colors.onPrimary,
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
    recipeTitleRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 6,
    },
    originsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 4,
    },
    originChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: theme.rounded.full,
      borderWidth: 1,
    },
    originChipOwn: {
      backgroundColor: theme.colors.chips.primary.background,
      borderColor: theme.colors.outlineVariant,
    },
    originChipSaved: {
      backgroundColor: theme.colors.chips.secondary.background,
      borderColor: theme.colors.outlineVariant,
    },
    originChipDownloaded: {
      backgroundColor: theme.colors.chips.success.background,
      borderColor: theme.colors.outlineVariant,
    },
    originChipText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 10,
      fontWeight: '600',
    },
    originChipTextOwn: {
      color: theme.colors.chips.primary.text,
    },
    originChipTextSaved: {
      color: theme.colors.chips.secondary.text,
    },
    originChipTextDownloaded: {
      color: theme.colors.chips.success.text,
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
    plannedItemCardMobile: {
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.md,
      padding: 12,
      gap: 10,
    },
    plannedMobileHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 8,
    },
    plannedMobileTitleGroup: {
      flex: 1,
      gap: 6,
    },
    removeItemBtnMobile: {
      minWidth: theme.spacing.touchable,
      minHeight: theme.spacing.touchable,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: -6,
      marginRight: -6,
    },
    plannedMobileDivider: {
      height: 1,
      backgroundColor: theme.colors.surfaceContainerHigh,
    },
    plannedMobileBottomRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    plannedMobileYieldInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    plannedMobileYieldLabel: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
    },
    plannedMobileYieldUnit: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      color: theme.colors.outline,
    },
    stepperGroupMobile: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.default,
      overflow: 'hidden',
    },
    stepMiniBtnMobile: {
      width: 42,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepYieldValueMobile: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.espressoDark,
      minWidth: 36,
      textAlign: 'center',
    },
    planActionsRow: {
      flexDirection: 'row',
      justifyContent: isDesktop ? 'flex-end' : 'flex-start',
      alignItems: 'center',
      gap: 10,
      marginTop: 8,
      width: '100%',
    },
    clearPlanBtn: {
      flexShrink: 0,
      minHeight: theme.spacing.touchable,
      paddingHorizontal: isDesktop ? 16 : 14,
      borderRadius: theme.rounded.default,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surfaceContainerLowest,
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
      flex: isDesktop ? undefined : 1,
      flexShrink: 0,
      minHeight: theme.spacing.touchable,
      paddingHorizontal: isDesktop ? 24 : 16,
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
      color: theme.colors.onPrimary,
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
    deficitHeaderRow: {
      flexDirection: isDesktop ? 'row' : 'column',
      alignItems: isDesktop ? 'center' : 'stretch',
      justifyContent: 'space-between',
      gap: 12,
    },
    deficitHeaderTextGroup: {
      flex: 1,
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
    shareListBtn: {
      minHeight: theme.spacing.touchable,
      paddingHorizontal: 16,
      borderRadius: theme.rounded.default,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: isDesktop
        ? theme.colors.surfaceContainerLowest
        : theme.colors.surfaceContainerLow,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      alignSelf: isDesktop ? 'center' : 'stretch',
    },
    shareListBtnText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    deficitList: {
      width: '100%',
    },
    deficitRow: {
      flexDirection: 'row',
      alignItems: 'center',
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
      alignSelf: 'flex-start',
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
      alignSelf: 'center',
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
    deficitItemCardMobile: {
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.md,
      padding: 12,
      gap: 10,
      marginBottom: 10,
    },
    deficitMobileTopRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 8,
    },
    deficitMobileNameCol: {
      flex: 1,
      alignItems: 'flex-start',
      gap: 4,
    },
    deficitItemNameMobile: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.espressoDark,
    },
    deficitMobileCostCol: {
      alignItems: 'flex-end',
      gap: 2,
    },
    deficitMobileCostLabel: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 10,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
      textTransform: 'uppercase',
    },
    deficitMobileCostValue: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.espressoDark,
    },
    deficitMobileMetricsBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.default,
      paddingVertical: 8,
      paddingHorizontal: 4,
    },
    deficitMobileMetricBox: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
    },
    deficitMobileMetricLabel: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 10,
      fontWeight: '500',
      color: theme.colors.onSurfaceVariant,
    },
    deficitMobileMetricValue: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.espressoDark,
      textAlign: 'center',
    },
    deficitMobileMetricDivider: {
      width: 1,
      height: 24,
      backgroundColor: theme.colors.surfaceContainerHigh,
    },
    deficitMobileMetricBoxAlert: {
      borderRadius: theme.rounded.sm,
      backgroundColor: theme.colors.chips.primary.background,
      paddingVertical: 2,
      marginHorizontal: 2,
    },
    deficitMobileMetricLabelAlert: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 10,
      fontWeight: '700',
      color: theme.colors.chips.primary.text,
    },
    deficitMobileMetricValueAlert: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.chips.primary.text,
      textAlign: 'center',
    },
  });
