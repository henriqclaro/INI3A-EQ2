import { useEffect, useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSettings } from '@/src/contexts/SettingsContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';
import { RecipeInstructionStep, RecipeItem } from '@/src/types';
import { shareRecipeSummary } from '@/src/utils/share';

import { RecipeScalerBar } from './RecipeScalerBar';

export interface KitchenModeModalProps {
  isVisible: boolean;
  onClose: () => void;
  recipeTitle: string;
  baseYield: number;
  yieldUnit: string;
  prepTimeMinutes?: number | string | null;
  scaleFactor: number;
  onScaleChange: (scale: number) => void;
  items: RecipeItem[];
  instructions: RecipeInstructionStep[];
}

export function KitchenModeModal({
  isVisible,
  onClose,
  recipeTitle,
  baseYield,
  yieldUnit,
  prepTimeMinutes,
  scaleFactor,
  onScaleChange,
  items,
  instructions,
}: KitchenModeModalProps) {
  const { theme } = useThemeMode();
  const { triggerHaptic } = useSettings();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [activeTab, setActiveTab] = useState<'ingredients' | 'steps'>('ingredients');
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set());
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // Screen keep-awake management while kitchen mode is open
  useEffect(() => {
    if (isVisible) {
      activateKeepAwakeAsync('kitchen-mode').catch(() => {});
    } else {
      deactivateKeepAwake('kitchen-mode').catch(() => {});
    }

    return () => {
      deactivateKeepAwake('kitchen-mode').catch(() => {});
    };
  }, [isVisible]);

  const toggleIngredient = (id: string) => {
    triggerHaptic('light');
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleStep = (stepNumber: number) => {
    triggerHaptic('light');
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepNumber)) {
        next.delete(stepNumber);
      } else {
        next.add(stepNumber);
      }
      return next;
    });
  };

  const totalSteps = instructions.length;
  const completedStepsCount = completedSteps.size;
  const progressPercent = totalSteps > 0 ? Math.round((completedStepsCount / totalSteps) * 100) : 0;

  const handleShare = () => {
    triggerHaptic('light');
    const scaledYield = baseYield
      ? (baseYield * scaleFactor).toFixed(2).replace(/\.00$/, '')
      : null;
    const scaledItems = items.map((it) => ({
      ...it,
      quantity: parseFloat(((Number(it.quantity) || 0) * scaleFactor).toFixed(2)),
    }));
    shareRecipeSummary({
      title: recipeTitle,
      baseYield: scaledYield,
      yieldUnit,
      prepTimeMinutes,
      items: scaledItems,
      instructions,
    });
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.awakeBadge}>
              <MaterialCommunityIcons
                name="sun-clock-outline"
                size={14}
                color={theme.colors.onPrimary}
              />
              <Text style={styles.awakeBadgeText}>Tela Sempre Ativa</Text>
            </View>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {recipeTitle}
            </Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={handleShare}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Compartilhar resumo da receita"
            >
              <MaterialCommunityIcons
                name="share-variant-outline"
                size={22}
                color={theme.colors.onSurface}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Sair do modo cozinha"
            >
              <MaterialCommunityIcons name="close" size={24} color={theme.colors.onSurface} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Scaler Bar */}
        <View style={styles.scalerWrapper}>
          <RecipeScalerBar
            baseYield={baseYield}
            yieldUnit={yieldUnit}
            scaleFactor={scaleFactor}
            onScaleChange={onScaleChange}
          />
        </View>

        {/* Tabs switcher */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'ingredients' && styles.tabBtnActive]}
            onPress={() => {
              triggerHaptic('selection');
              setActiveTab('ingredients');
            }}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Ver lista de ingredientes do modo cozinha"
          >
            <MaterialCommunityIcons
              name="silverware-fork-knife"
              size={18}
              color={
                activeTab === 'ingredients' ? theme.colors.onPrimary : theme.colors.onSurfaceVariant
              }
            />
            <Text
              style={[styles.tabBtnText, activeTab === 'ingredients' && styles.tabBtnTextActive]}
            >
              Ingredientes ({checkedIngredients.size}/{items.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'steps' && styles.tabBtnActive]}
            onPress={() => {
              triggerHaptic('selection');
              setActiveTab('steps');
            }}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Ver etapas de preparo do modo cozinha"
          >
            <MaterialCommunityIcons
              name="format-list-checks"
              size={18}
              color={activeTab === 'steps' ? theme.colors.onPrimary : theme.colors.onSurfaceVariant}
            />
            <Text style={[styles.tabBtnText, activeTab === 'steps' && styles.tabBtnTextActive]}>
              Preparo ({completedStepsCount}/{totalSteps})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
          <Text style={styles.progressText}>{progressPercent}% concluído</Text>
        </View>

        {/* Scroll Content */}
        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={styles.contentInner}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'ingredients' ? (
            <View style={styles.listContainer}>
              <Text style={styles.sectionSubtitle}>
                Toque nos ingredientes conforme adicionar à bancada:
              </Text>
              {items.map((item, index) => {
                const itemKey = item.id ? String(item.id) : `item-${index}`;
                const isChecked = checkedIngredients.has(itemKey);
                const itemName = item.ingredient?.name || item.subRecipe?.title || 'Insumo';
                const scaledQty = parseFloat((Number(item.quantity) * scaleFactor).toFixed(2));

                return (
                  <TouchableOpacity
                    key={itemKey}
                    style={[styles.itemCard, isChecked && styles.itemCardChecked]}
                    onPress={() => toggleIngredient(itemKey)}
                    activeOpacity={0.8}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isChecked }}
                    accessibilityLabel={`${itemName}, ${scaledQty} ${item.unit}`}
                  >
                    <View
                      style={[styles.checkboxCircle, isChecked && styles.checkboxCircleChecked]}
                    >
                      {isChecked && (
                        <MaterialCommunityIcons
                          name="check"
                          size={18}
                          color={theme.colors.onPrimary}
                        />
                      )}
                    </View>

                    <View style={styles.itemTextCol}>
                      <Text style={[styles.itemTitle, isChecked && styles.itemTitleChecked]}>
                        {itemName}
                      </Text>
                      <Text style={[styles.itemQuantity, isChecked && styles.itemQuantityChecked]}>
                        {scaledQty} {item.unit}
                        {item.notes ? ` • ${item.notes}` : ''}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.listContainer}>
              <Text style={styles.sectionSubtitle}>Toque na etapa para marcar como concluída:</Text>
              {instructions.map((step) => {
                const isDone = completedSteps.has(step.step);

                return (
                  <TouchableOpacity
                    key={step.step}
                    style={[styles.stepCard, isDone && styles.stepCardDone]}
                    onPress={() => toggleStep(step.step)}
                    activeOpacity={0.8}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isDone }}
                    accessibilityLabel={`Etapa ${step.step}: ${step.title || step.description}`}
                  >
                    <View style={[styles.stepBadge, isDone && styles.stepBadgeDone]}>
                      {isDone ? (
                        <MaterialCommunityIcons
                          name="check-bold"
                          size={16}
                          color={theme.colors.onTertiary}
                        />
                      ) : (
                        <Text style={styles.stepBadgeNumber}>{step.step}</Text>
                      )}
                    </View>

                    <View style={styles.stepTextCol}>
                      {step.title ? (
                        <Text style={[styles.stepTitle, isDone && styles.stepTitleDone]}>
                          {step.title}
                        </Text>
                      ) : null}
                      <Text style={[styles.stepDescription, isDone && styles.stepDescriptionDone]}>
                        {step.description}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surfaceContainerLowest,
    },
    headerLeft: {
      flex: 1,
      marginRight: 12,
      gap: 2,
    },
    awakeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: theme.rounded.full,
      gap: 4,
    },
    awakeBadgeText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 10,
      fontWeight: '600',
      color: theme.colors.onPrimary,
    },
    headerTitle: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.espressoDark,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    headerIconBtn: {
      width: 48,
      height: 48,
      borderRadius: theme.rounded.default,
      backgroundColor: theme.colors.surfaceContainerLow,
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeBtn: {
      width: 48,
      height: 48,
      borderRadius: theme.rounded.default,
      backgroundColor: theme.colors.surfaceContainerLow,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scalerWrapper: {
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    tabsRow: {
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 16,
      marginBottom: 8,
    },
    tabBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.default,
      minHeight: 48,
      paddingHorizontal: 8,
    },
    tabBtnActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    tabBtnText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
    },
    tabBtnTextActive: {
      color: theme.colors.onPrimary,
    },
    progressContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      marginBottom: 8,
    },
    progressTrack: {
      flex: 1,
      height: 6,
      backgroundColor: theme.colors.surfaceContainerHigh,
      borderRadius: theme.rounded.full,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: theme.colors.tertiary,
      borderRadius: theme.rounded.full,
    },
    progressText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.tertiary,
    },
    contentScroll: {
      flex: 1,
    },
    contentInner: {
      paddingHorizontal: 16,
      paddingBottom: 48,
    },
    sectionSubtitle: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 10,
    },
    listContainer: {
      gap: 10,
    },
    itemCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.lg,
      padding: 14,
      gap: 14,
      minHeight: 56,
      ...theme.shadows.soft,
    },
    itemCardChecked: {
      backgroundColor: theme.colors.surfaceContainerLow,
      opacity: 0.7,
    },
    checkboxCircle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: theme.colors.outline,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxCircleChecked: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    itemTextCol: {
      flex: 1,
      gap: 2,
    },
    itemTitle: {
      fontFamily: theme.typography.bodyLg.fontFamily,
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.espressoDark,
    },
    itemTitleChecked: {
      textDecorationLine: 'line-through',
      color: theme.colors.placeholder,
    },
    itemQuantity: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    itemQuantityChecked: {
      textDecorationLine: 'line-through',
      color: theme.colors.placeholder,
    },
    stepCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.lg,
      padding: 16,
      gap: 14,
      ...theme.shadows.soft,
    },
    stepCardDone: {
      backgroundColor: theme.colors.surfaceContainerLow,
      opacity: 0.75,
    },
    stepBadge: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.primaryFixed,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    stepBadgeDone: {
      backgroundColor: theme.colors.tertiaryFixed,
    },
    stepBadgeNumber: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.onPrimaryFixed,
    },
    stepTextCol: {
      flex: 1,
      gap: 4,
    },
    stepTitle: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.espressoDark,
    },
    stepTitleDone: {
      textDecorationLine: 'line-through',
      color: theme.colors.placeholder,
    },
    stepDescription: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 15,
      lineHeight: 22,
      color: theme.colors.onSurface,
    },
    stepDescriptionDone: {
      textDecorationLine: 'line-through',
      color: theme.colors.placeholder,
    },
  });
