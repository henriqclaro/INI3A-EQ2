import { useMemo } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

import { MaterialSymbol } from '@/src/components/common';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';

export interface CustomizeRecipeModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  recipeTitle: string;
}

export function CustomizeRecipeModal({
  isVisible,
  onClose,
  onConfirm,
  recipeTitle,
}: CustomizeRecipeModalProps) {
  const { theme } = useThemeMode();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const styles = useMemo(() => createStyles(theme, isDesktop), [theme, isDesktop]);

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Fechar modal" />

        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <MaterialSymbol name="fork_right" size={26} color={theme.colors.primary} />
            </View>
            <View style={styles.headerTextGroup}>
              <Text style={styles.title}>Personalizar Receita</Text>
              <Text style={styles.subtitle}>Criar sua versão a partir de uma receita pública</Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Fechar"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <MaterialSymbol name="close" size={22} color={theme.colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.bodyScroll}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Source Recipe Highlight Card */}
            <View style={styles.sourceCard}>
              <View style={styles.sourceBadge}>
                <MaterialSymbol name="public" size={13} color={theme.colors.onPrimaryFixed} />
                <Text style={styles.sourceBadgeText}>Receita Pública da Comunidade</Text>
              </View>
              <Text style={styles.sourceTitle} numberOfLines={2}>
                {recipeTitle}
              </Text>
            </View>

            {/* Explanation items */}
            <View style={styles.explanationList}>
              <View style={styles.explanationItem}>
                <View style={styles.itemIconContainer}>
                  <MaterialSymbol name="move_to_inbox" size={20} color={theme.colors.primary} />
                </View>
                <View style={styles.itemTextCol}>
                  <Text style={styles.itemHeading}>Importação automática</Text>
                  <Text style={styles.itemBody}>
                    Todos os ingredientes, quantidades, modo de preparo e rendimento originais serão
                    carregados diretamente para edição.
                  </Text>
                </View>
              </View>

              <View style={styles.explanationItem}>
                <View style={styles.itemIconContainer}>
                  <MaterialSymbol name="design_services" size={20} color={theme.colors.primary} />
                </View>
                <View style={styles.itemTextCol}>
                  <Text style={styles.itemHeading}>Liberdade total de edição</Text>
                  <Text style={styles.itemBody}>
                    Ajuste etapas, substitua ingredientes por itens do seu catálogo e adeque os
                    custos à sua própria confeitaria.
                  </Text>
                </View>
              </View>

              <View style={styles.explanationItem}>
                <View style={styles.itemIconContainer}>
                  <MaterialSymbol name="link" size={20} color={theme.colors.primary} />
                </View>
                <View style={styles.itemTextCol}>
                  <Text style={styles.itemHeading}>Vínculo com a original preservado</Text>
                  <Text style={styles.itemBody}>
                    Sua nova receita exibirá um selo especial de personalização e sempre conterá um
                    link de volta para a receita pública original.
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionsFooter}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Cancelar personalização"
            >
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={onConfirm}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Confirmar e abrir editor de receita"
            >
              <MaterialSymbol name="edit" size={18} color={theme.colors.onPrimary} />
              <Text style={styles.confirmBtnText}>Personalizar e Editar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (theme: AppTheme, isDesktop: boolean) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: isDesktop ? 24 : 16,
      backgroundColor: theme.colors.backdrop,
    },
    backdrop: {
      ...StyleSheet.absoluteFill,
    },
    card: {
      width: '100%',
      maxWidth: 520,
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.rounded.xl,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      overflow: 'hidden',
      maxHeight: '90%',
      ...theme.shadows.soft,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
      gap: 14,
    },
    iconCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTextGroup: {
      flex: 1,
    },
    title: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.espressoDark,
      letterSpacing: 0.3,
    },
    subtitle: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
    },
    closeBtn: {
      width: 48,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.rounded.full,
    },
    bodyScroll: {
      maxHeight: 400,
    },
    bodyContent: {
      padding: 20,
      gap: 16,
    },
    sourceCard: {
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.lg,
      padding: 14,
      gap: 6,
    },
    sourceBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: theme.colors.primaryFixed,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: theme.rounded.full,
      gap: 5,
    },
    sourceBadgeText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.onPrimaryFixed,
    },
    sourceTitle: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 17,
      fontWeight: '600',
      color: theme.colors.espressoDark,
    },
    explanationList: {
      gap: 14,
      marginTop: 4,
    },
    explanationItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    itemIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.surfaceContainer,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    itemTextCol: {
      flex: 1,
    },
    itemHeading: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.espressoDark,
      marginBottom: 2,
    },
    itemBody: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 18,
    },
    actionsFooter: {
      flexDirection: isDesktop ? 'row' : 'column-reverse',
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surfaceContainerLowest,
      gap: 10,
    },
    cancelBtn: {
      width: isDesktop ? 'auto' : '100%',
      minHeight: 48,
      paddingHorizontal: 20,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.rounded.default,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    cancelBtnText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
    },
    confirmBtn: {
      width: isDesktop ? 'auto' : '100%',
      minHeight: 48,
      paddingHorizontal: 22,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      borderRadius: theme.rounded.default,
      gap: 8,
      ...theme.shadows.soft,
    },
    confirmBtnText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.onPrimary,
    },
  });
