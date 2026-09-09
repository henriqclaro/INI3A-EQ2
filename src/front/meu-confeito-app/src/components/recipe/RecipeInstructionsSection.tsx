import { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';
import { RecipeInstructionStep } from '@/src/types/recipe';

export interface RecipeInstructionsSectionProps {
  instructions: RecipeInstructionStep[];
}

export const RecipeInstructionsSection = memo(function RecipeInstructionsSection({
  instructions,
}: RecipeInstructionsSectionProps) {
  const { theme } = useThemeMode();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.cardBox}>
      <View style={styles.cardHeader}>
        <MaterialCommunityIcons name="pot-steam-outline" size={22} color={theme.colors.primary} />
        <Text style={styles.cardTitle}>Modo de Preparo</Text>
      </View>

      {instructions.length > 0 ? (
        instructions.map((instruction, index) => (
          <View key={instruction.step || index} style={styles.stepRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepText}>{instruction.step || index + 1}</Text>
            </View>
            <View style={styles.stepBody}>
              {Boolean(instruction.title) && (
                <Text style={styles.stepTitle}>{instruction.title}</Text>
              )}
              <Text style={styles.stepContent}>{instruction.description}</Text>
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.emptyCardText}>Nenhuma instrução de preparo informada.</Text>
      )}
    </View>
  );
});

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    cardBox: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.rounded.lg,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: 18,
      gap: 14,
      ...theme.shadows.soft,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
      paddingBottom: 10,
    },
    cardTitle: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 19,
      fontWeight: 'bold',
      color: theme.colors.espressoDark,
    },
    emptyCardText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 14,
      fontStyle: 'italic',
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      paddingVertical: 12,
    },
    stepRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      paddingVertical: 6,
    },
    stepBadge: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.colors.surfaceContainerLow,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    stepText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontWeight: 'bold',
      fontSize: 14,
      color: theme.colors.primary,
    },
    stepBody: {
      flex: 1,
      gap: 2,
    },
    stepTitle: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.espressoDark,
    },
    stepContent: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 14,
      lineHeight: 22,
      color: theme.colors.text,
    },
  });
