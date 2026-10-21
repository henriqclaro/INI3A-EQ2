import { memo, useMemo } from 'react';
import {
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
  useWindowDimensions,
} from 'react-native';

import { MaterialSymbol } from '@/src/components/common';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';

export interface AddStockCardProps {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  isMobile?: boolean;
}

export const AddStockCard = memo(function AddStockCard({
  onPress,
  style,
  isMobile: isMobileProp,
}: AddStockCardProps) {
  const { theme } = useThemeMode();
  const { width } = useWindowDimensions();

  const isMobile = isMobileProp ?? width < 768;
  const styles = useMemo(() => createStyles(theme, isMobile), [theme, isMobile]);

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel="Cadastrar novo insumo no estoque"
      accessibilityHint="Abre o formulário para cadastrar um novo insumo"
    >
      <View style={styles.contentRow}>
        <View style={styles.iconWrapper}>
          <MaterialSymbol name="add_box" size={isMobile ? 26 : 28} color={theme.colors.primary} />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>Precisa de outro insumo?</Text>
          <Text style={styles.subtitle}>
            Cadastre novos ingredientes, embalagens e itens para manter seus custos e estoque sempre
            atualizados.
          </Text>
        </View>
      </View>

      <View style={styles.button}>
        <MaterialSymbol name="add" size={18} color={theme.colors.onPrimary} />
        <Text style={styles.buttonText}>Novo Insumo</Text>
      </View>
    </TouchableOpacity>
  );
});

const createStyles = (theme: AppTheme, isMobile: boolean) =>
  StyleSheet.create({
    card: {
      width: '100%',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.rounded.lg,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: isMobile ? 20 : 20,
      flexDirection: isMobile ? 'column' : 'row',
      alignItems: isMobile ? 'stretch' : 'center',
      justifyContent: 'space-between',
      gap: isMobile ? 18 : 20,
      ...theme.shadows.soft,
      ...Platform.select({
        web: {
          cursor: 'pointer',
        },
      }),
    },
    contentRow: {
      flex: isMobile ? undefined : 1,
      flexDirection: 'row',
      alignItems: isMobile ? 'flex-start' : 'center',
      gap: isMobile ? 14 : 16,
    },
    iconWrapper: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.secondaryContainer,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      marginTop: isMobile ? 2 : 0,
    },
    textContainer: {
      flex: 1,
      gap: 2,
    },
    title: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: isMobile ? 17 : 18,
      fontWeight: '600',
      color: theme.colors.espressoDark,
      lineHeight: isMobile ? 23 : 22,
      marginBottom: isMobile ? 3 : 0,
    },
    subtitle: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      lineHeight: isMobile ? 19 : 18,
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
    },
    button: {
      width: isMobile ? '100%' : undefined,
      height: 48,
      minHeight: 48,
      paddingHorizontal: 20,
      borderRadius: theme.rounded.default,
      backgroundColor: theme.colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: isMobile ? 8 : 6,
      ...theme.shadows.glow,
    },
    buttonText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      color: theme.colors.onPrimary,
    },
  });
