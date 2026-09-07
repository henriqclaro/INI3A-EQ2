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
import { useRegisterProduction } from '@/src/hooks/useProductions';
import { AppTheme } from '@/src/theme/themes';
import { ProductionItem } from '@/src/types/production';

export interface ProduceRecipeModalProps {
  isVisible: boolean;
  recipe: {
    id: string;
    title: string;
    baseYield: number | string;
    yieldUnit?: string;
  } | null;
  onClose: () => void;
  onSuccess: (production: ProductionItem) => void;
}

interface ProduceRecipeModalContentProps {
  recipe: NonNullable<ProduceRecipeModalProps['recipe']>;
  onClose: () => void;
  onSuccess: (production: ProductionItem) => void;
}

function ProduceRecipeModalContent({ recipe, onClose, onSuccess }: ProduceRecipeModalContentProps) {
  const { theme } = useThemeMode();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [yieldProduced, setYieldProduced] = useState(String(recipe.baseYield || '1'));
  const [expirationDate, setExpirationDate] = useState('');

  const { registerProduction, isLoading: isSubmitting } = useRegisterProduction();

  const baseYieldNum = Number(recipe.baseYield) || 1;
  const yieldNum = parseFloat(yieldProduced.replace(',', '.')) || 0;
  const scaleFactor =
    yieldNum > 0 && baseYieldNum > 0 ? (yieldNum / baseYieldNum).toFixed(2) : '1.00';

  const handleConfirm = async () => {
    if (isNaN(yieldNum) || yieldNum <= 0) {
      Alert.alert('Quantidade Inválida', 'Informe uma quantidade válida maior que zero.');
      return;
    }

    const trimmedDate = expirationDate.trim();
    if (trimmedDate.length > 0) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(trimmedDate)) {
        Alert.alert(
          'Data Inválida',
          'A data de validade deve estar no formato AAAA-MM-DD (ex: 2026-10-15).',
        );
        return;
      }
    }

    try {
      const res = await registerProduction({
        recipeId: recipe.id,
        yieldProduced: yieldNum,
        expirationDate: trimmedDate || undefined,
      });

      onSuccess(res.data.production);
      onClose();
    } catch (err: unknown) {
      const apiErr = err as {
        response?: {
          data?: {
            code?: string;
            message?: string;
          };
        };
        message?: string;
      };

      if (apiErr?.response?.data?.code === 'INSUFFICIENT_STOCK') {
        Alert.alert(
          'Estoque Insuficiente',
          apiErr.response.data.message ||
            'Você não possui ingredientes suficientes no estoque para esta produção. Verifique suas quantidades no Estoque.',
        );
      } else {
        const errorMsg =
          apiErr?.response?.data?.message ||
          apiErr?.message ||
          'Não foi possível registrar a produção.';
        Alert.alert('Erro na Produção', errorMsg);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.modalOverlay}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <View style={styles.modalHeaderTitleGroup}>
            <MaterialCommunityIcons name="pot-steam" size={22} color={theme.colors.primary} />
            <Text style={styles.modalTitle} numberOfLines={1}>
              Produzir Receita
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            accessibilityRole="button"
            accessibilityLabel="Fechar modal"
          >
            <MaterialCommunityIcons name="close" size={20} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.recipeBanner}>
            <Text style={styles.recipeBannerTitle}>{recipe.title}</Text>
            <Text style={styles.recipeBannerSubtitle}>
              Rendimento padrão: {recipe.baseYield} {recipe.yieldUnit || 'UN'}
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Quantidade a Produzir ({recipe.yieldUnit || 'UN'}) *</Text>
            <TextInput
              style={styles.textInput}
              placeholder={`Ex: ${recipe.baseYield || '12'}`}
              placeholderTextColor={theme.colors.placeholder}
              keyboardType="numeric"
              value={yieldProduced}
              onChangeText={setYieldProduced}
            />
            <View style={styles.scaleRow}>
              <MaterialCommunityIcons name="scale-balance" size={14} color={theme.colors.primary} />
              <Text style={styles.scaleText}>
                Fator de escala: <Text style={styles.scaleTextBold}>{scaleFactor}x</Text> da receita
                base
              </Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Data de Validade do Lote (opcional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="AAAA-MM-DD (ex: 2026-10-20)"
              placeholderTextColor={theme.colors.placeholder}
              value={expirationDate}
              onChangeText={setExpirationDate}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.infoBox}>
            <MaterialCommunityIcons
              name="information-outline"
              size={18}
              color={theme.colors.primary}
              style={styles.infoIcon}
            />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTextBold}>Ao registrar a produção:</Text>
              <Text style={styles.infoText}>
                • Os insumos necessários serão baixados do estoque automaticamente.
              </Text>
              <Text style={styles.infoText}>
                • O custo unitário e total será calculado com base nos preços dos insumos.
              </Text>
              <Text style={styles.infoText}>
                • Você pode cancelar a produção para devolver os ingredientes ao estoque.
              </Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={onClose}
            disabled={isSubmitting}
            accessibilityRole="button"
            accessibilityLabel="Cancelar"
          >
            <Text style={styles.cancelBtnText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={handleConfirm}
            disabled={isSubmitting}
            accessibilityRole="button"
            accessibilityLabel="Confirmar Produção"
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={theme.colors.secondaryText} />
            ) : (
              <>
                <MaterialCommunityIcons name="check" size={18} color={theme.colors.secondaryText} />
                <Text style={styles.confirmBtnText}>Confirmar</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

export function ProduceRecipeModal({
  isVisible,
  recipe,
  onClose,
  onSuccess,
}: ProduceRecipeModalProps) {
  if (!isVisible || !recipe) return null;

  return (
    <Modal visible={isVisible} transparent animationType="fade" onRequestClose={onClose}>
      <ProduceRecipeModalContent recipe={recipe} onClose={onClose} onSuccess={onSuccess} />
    </Modal>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.colors.backdrop || 'rgba(64, 36, 43, 0.4)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    modalContent: {
      width: '100%',
      maxWidth: 480,
      backgroundColor: theme.colors.background,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.secBorder,
      padding: 20,
      maxHeight: '90%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.secBorder,
      paddingBottom: 12,
    },
    modalHeaderTitleGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    modalTitle: {
      fontFamily: 'Playfair Display SC',
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.primary,
      flex: 1,
    },
    closeBtn: {
      minWidth: 48,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scrollContent: {
      paddingBottom: 10,
    },
    recipeBanner: {
      backgroundColor: theme.colors.pitchBackground,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.colors.secBorder,
      padding: 12,
      marginBottom: 16,
    },
    recipeBannerTitle: {
      fontFamily: 'Inter',
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 2,
    },
    recipeBannerSubtitle: {
      fontFamily: 'Inter',
      fontSize: 13,
      color: theme.colors.placeholder,
    },
    inputGroup: {
      marginBottom: 14,
    },
    label: {
      fontFamily: 'Inter',
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 6,
    },
    textInput: {
      backgroundColor: theme.colors.pitchBackground,
      borderWidth: 1,
      borderColor: theme.colors.lightGray,
      borderRadius: 8,
      paddingHorizontal: 12,
      height: 48,
      fontSize: 15,
      color: theme.colors.text,
    },
    scaleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginTop: 4,
    },
    scaleText: {
      fontFamily: 'Inter',
      fontSize: 12,
      color: theme.colors.text,
      opacity: 0.8,
    },
    scaleTextBold: {
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    infoBox: {
      flexDirection: 'row',
      backgroundColor: theme.colors.pitchBackground,
      borderWidth: 1,
      borderColor: theme.colors.secBorder,
      borderRadius: 10,
      padding: 12,
      marginTop: 6,
      marginBottom: 16,
      gap: 8,
    },
    infoIcon: {
      marginTop: 2,
    },
    infoTextContainer: {
      flex: 1,
      gap: 3,
    },
    infoTextBold: {
      fontFamily: 'Inter',
      fontSize: 12,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 2,
    },
    infoText: {
      fontFamily: 'Inter',
      fontSize: 11,
      color: theme.colors.text,
      opacity: 0.8,
      lineHeight: 16,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 8,
    },
    cancelBtn: {
      flex: 1,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.pitchBackground,
      borderWidth: 1,
      borderColor: theme.colors.lightGray,
      borderRadius: 8,
    },
    cancelBtnText: {
      fontFamily: 'Inter',
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
    },
    confirmBtn: {
      flex: 1.5,
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
      gap: 6,
    },
    confirmBtnText: {
      fontFamily: 'Inter',
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.secondaryText,
    },
  });
