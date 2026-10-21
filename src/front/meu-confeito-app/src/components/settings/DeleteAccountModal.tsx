import { memo, useMemo, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ActivityIndicator } from 'react-native-paper';

import { CustomButton } from '@/src/components/common';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';

export interface DeleteAccountModalProps {
  isVisible: boolean;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteAccountModal = memo(function DeleteAccountModal({
  isVisible,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteAccountModalProps) {
  const { theme } = useThemeMode();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [isAcknowledgeChecked, setIsAcknowledgeChecked] = useState(false);

  const handleClose = () => {
    if (!isDeleting) {
      setIsAcknowledgeChecked(false);
      onClose();
    }
  };

  const handleConfirm = () => {
    if (isAcknowledgeChecked) {
      onConfirm();
    }
  };

  return (
    <Modal visible={isVisible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalIconBadge}>
            <MaterialCommunityIcons
              name="delete-alert-outline"
              size={36}
              color={theme.colors.error}
            />
          </View>

          <Text style={styles.modalTitle}>Excluir Conta Permanentemente?</Text>

          <View style={styles.modalWarningBox}>
            <MaterialCommunityIcons
              name="alert-outline"
              size={18}
              color={theme.colors.onErrorContainer}
            />
            <Text style={styles.modalWarningText}>ATENÇÃO: ESTA AÇÃO NÃO PODE SER DESFEITA!</Text>
          </View>

          <Text style={styles.modalDescription}>
            Ao confirmar a exclusão, todos os seus dados serão apagados definitivamente:
          </Text>

          <View style={styles.consequencesList}>
            <View style={styles.consequenceItem}>
              <MaterialCommunityIcons
                name="close-circle-outline"
                size={16}
                color={theme.colors.error}
              />
              <Text style={styles.consequenceText}>
                Receitas e fichas técnicas não vinculadas excluídas definitivamente
              </Text>
            </View>
            <View style={styles.consequenceItem}>
              <MaterialCommunityIcons
                name="close-circle-outline"
                size={16}
                color={theme.colors.error}
              />
              <Text style={styles.consequenceText}>
                Foto de perfil apagada do armazenamento e dados pessoais anonimizados
              </Text>
            </View>
            <View style={styles.consequenceItem}>
              <MaterialCommunityIcons
                name="close-circle-outline"
                size={16}
                color={theme.colors.error}
              />
              <Text style={styles.consequenceText}>
                Perfil público de confeitaria e vitrine de destaques excluídos
              </Text>
            </View>
            <View style={styles.consequenceItem}>
              <MaterialCommunityIcons
                name="close-circle-outline"
                size={16}
                color={theme.colors.error}
              />
              <Text style={styles.consequenceText}>
                Todas as sessões ativas e tokens revogados imediatamente
              </Text>
            </View>
          </View>

          {/* Acknowledgment Checkbox */}
          <TouchableOpacity
            style={styles.checkboxRow}
            activeOpacity={0.7}
            onPress={() => setIsAcknowledgeChecked((prev) => !prev)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isAcknowledgeChecked }}
            accessibilityLabel="Confirmo que estou ciente da perda definitiva de todos os meus dados"
          >
            <MaterialCommunityIcons
              name={isAcknowledgeChecked ? 'checkbox-marked' : 'checkbox-blank-outline'}
              size={24}
              color={isAcknowledgeChecked ? theme.colors.error : theme.colors.placeholder}
            />
            <Text style={styles.checkboxLabel}>
              Estou ciente de que esta ação é definitiva e que perderei todos os meus dados.
            </Text>
          </TouchableOpacity>

          {/* Modal Actions */}
          <View style={styles.modalActions}>
            {isDeleting ? (
              <View style={styles.loadingWrapper}>
                <ActivityIndicator size="large" color={theme.colors.error} />
                <Text style={styles.loadingText}>Excluindo sua conta...</Text>
              </View>
            ) : (
              <>
                <CustomButton
                  title="Sim, Excluir Minha Conta"
                  variant="danger"
                  isDisabled={!isAcknowledgeChecked}
                  style={styles.confirmDeleteBtn}
                  onPress={handleConfirm}
                />

                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  activeOpacity={0.7}
                  onPress={handleClose}
                  accessibilityRole="button"
                  accessibilityLabel="Cancelar e manter minha conta"
                >
                  <Text style={styles.modalCancelBtnText}>Cancelar e Manter Conta</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
});

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    modalBackdrop: {
      flex: 1,
      backgroundColor: theme.colors.backdrop,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.space4,
    },
    modalCard: {
      width: '100%',
      maxWidth: 440,
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.rounded.xl,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: theme.spacing.space5,
      alignItems: 'center',
      gap: theme.spacing.space3,
      ...theme.shadows.glow,
    },
    modalIconBadge: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: theme.colors.errorContainer,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.spacing.space1,
    },
    modalTitle: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.espressoDark,
      textAlign: 'center',
    },
    modalWarningBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.colors.errorContainer,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: theme.rounded.sm,
      marginVertical: 2,
    },
    modalWarningText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      fontWeight: '800',
      color: theme.colors.onErrorContainer,
      letterSpacing: 0.5,
    },
    modalDescription: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      lineHeight: 18,
    },
    consequencesList: {
      width: '100%',
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.md,
      padding: theme.spacing.space3,
      gap: 8,
      marginVertical: theme.spacing.space1,
    },
    consequenceItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    consequenceText: {
      flex: 1,
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      color: theme.colors.espressoDark,
      lineHeight: 16,
    },
    checkboxRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      minHeight: theme.spacing.touchable,
      paddingVertical: 6,
      paddingHorizontal: 4,
      width: '100%',
    },
    checkboxLabel: {
      flex: 1,
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.espressoDark,
      lineHeight: 16,
    },
    modalActions: {
      width: '100%',
      alignItems: 'center',
      gap: theme.spacing.space2,
      marginTop: theme.spacing.space2,
    },
    confirmDeleteBtn: {
      width: '100%',
      marginVertical: 0,
    },
    modalCancelBtn: {
      minHeight: theme.spacing.touchable,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.space4,
    },
    modalCancelBtnText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
    },
    loadingWrapper: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.space4,
      gap: theme.spacing.space2,
    },
    loadingText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.error,
      fontWeight: '600',
    },
  });
