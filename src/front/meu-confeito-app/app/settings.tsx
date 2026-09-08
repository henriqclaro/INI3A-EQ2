import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Stack } from 'expo-router';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { InteractionSettingsCard, SettingsSection, ThemeToggleCard } from '@/src/components';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';

interface PlannedFeatureItem {
  id: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  subtitle: string;
}

const PLANNED_FEATURES: PlannedFeatureItem[] = [
  {
    id: 'units',
    icon: 'scale',
    title: 'Unidades de Medida Padrão',
    subtitle: 'Definir unidades padrão (g, kg, ml, xícaras) para novos cadastros',
  },
  {
    id: 'notifications',
    icon: 'bell-outline',
    title: 'Alertas de Validade do Estoque',
    subtitle: 'Receber avisos preventivos de insumos próximos ao vencimento',
  },
  {
    id: 'financial',
    icon: 'calculator-variant-outline',
    title: 'Margem de Lucro Padrão',
    subtitle: 'Valores sugeridos automaticamente ao criar novas fichas técnicas',
  },
];

export default function SettingsScreen() {
  const { theme } = useThemeMode();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < theme.breakpoints.sm;

  const styles = useMemo(() => createStyles(theme, isSmallScreen), [theme, isSmallScreen]);

  return (
    <>
      <Stack.Screen options={{ title: 'Configurações' }} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrapper}>
          {/* Header Editorial Stamp */}
          <View style={styles.headerBlock}>
            <Text style={styles.headerTitle}>Configurações</Text>
            <Text style={styles.headerSubtitle}>
              Personalize a aparência do Meu Confeito e configure sua experiência na cozinha
              digital.
            </Text>
          </View>

          {/* Section 1: Appearance & Theme Toggle */}
          <SettingsSection
            title="Aparência"
            description="Alterne entre o tema claro artesanal e o tema escuro aconchegante"
            icon="palette-outline"
          >
            <ThemeToggleCard />
          </SettingsSection>

          {/* Section 2: Navigation & Haptics */}
          <SettingsSection
            title="Gestos e Resposta Tátil"
            description="Controle a navegação por deslizamento e o retorno de vibração do aplicativo"
            icon="cellphone-sound"
          >
            <InteractionSettingsCard />
          </SettingsSection>

          {/* Section 3: Planned Features (Extensible Architecture) */}
          <SettingsSection
            title="Preferências Operacionais"
            description="Recursos e personalizações em desenvolvimento para as próximas versões"
            icon="tune-variant"
          >
            <View style={styles.plannedCard}>
              <View style={styles.plannedCardHeader}>
                <MaterialCommunityIcons name="clock-fast" size={20} color={theme.colors.primary} />
                <Text style={styles.plannedCardTitle}>Em Breve na Cozinha Digital</Text>
              </View>

              <Text style={styles.plannedCardSubtitle}>
                Estamos preparando novos controles para tornar sua rotina de confeitaria ainda mais
                prática e automatizada.
              </Text>

              <View style={styles.plannedList}>
                {PLANNED_FEATURES.map((item, index) => {
                  const isLastItem = index === PLANNED_FEATURES.length - 1;
                  return (
                    <View
                      key={item.id}
                      style={[styles.plannedItemRow, !isLastItem && styles.plannedItemBorder]}
                    >
                      <View style={styles.plannedIconBox}>
                        <MaterialCommunityIcons
                          name={item.icon}
                          size={18}
                          color={theme.colors.onSurfaceVariant}
                        />
                      </View>
                      <View style={styles.plannedItemTextCol}>
                        <Text style={styles.plannedItemTitle}>{item.title}</Text>
                        <Text style={styles.plannedItemSubtitle}>{item.subtitle}</Text>
                      </View>
                      <View style={styles.soonBadge}>
                        <Text style={styles.soonBadgeText}>Em breve</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </SettingsSection>

          {/* Section 3: App Info & About */}
          <SettingsSection
            title="Sobre o Aplicativo"
            description="Informações da versão e suporte"
            icon="information-outline"
          >
            <View style={styles.aboutCard}>
              <View style={styles.aboutHeader}>
                <View style={styles.brandBadge}>
                  <MaterialCommunityIcons
                    name="cake-variant-outline"
                    size={24}
                    color={theme.colors.primary}
                  />
                </View>
                <View style={styles.brandTextWrapper}>
                  <Text style={styles.brandName}>Meu Confeito</Text>
                  <Text style={styles.appVersion}>Versão 1.0.0 (Beta)</Text>
                </View>
              </View>

              <Text style={styles.aboutDescription}>
                Desenvolvido especialmente para confeiteiras e confeiteiros independentes que buscam
                precisão no cálculo de custos e valorização do seu trabalho artesanal.
              </Text>
            </View>
          </SettingsSection>
        </View>
      </ScrollView>
    </>
  );
}

const createStyles = (theme: AppTheme, isSmallScreen: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      paddingHorizontal: isSmallScreen ? theme.spacing.marginMobile : theme.spacing.marginTablet,
      paddingTop: theme.spacing.space4,
      paddingBottom: theme.spacing.space16,
      alignItems: 'center',
    },
    contentWrapper: {
      width: '100%',
      maxWidth: 680,
      gap: theme.spacing.space6,
    },
    headerBlock: {
      marginTop: theme.spacing.space2,
      marginBottom: theme.spacing.space1,
    },
    headerTitle: {
      fontFamily: theme.typography.headlineLg.fontFamily,
      fontSize: 26,
      fontWeight: '600',
      color: theme.colors.espressoDark,
      letterSpacing: 0.5,
    },
    headerSubtitle: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 15,
      color: theme.colors.onSurfaceVariant,
      marginTop: 6,
      lineHeight: 22,
    },
    plannedCard: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.lg,
      padding: theme.spacing.space5,
      width: '100%',
      ...theme.shadows.soft,
    },
    plannedCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.space2,
      marginBottom: theme.spacing.space2,
    },
    plannedCardTitle: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.espressoDark,
    },
    plannedCardSubtitle: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 18,
      marginBottom: theme.spacing.space4,
    },
    plannedList: {
      backgroundColor: theme.colors.surfaceContainerLow,
      borderRadius: theme.rounded.md,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      overflow: 'hidden',
    },
    plannedItemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.space3,
      minHeight: 52,
      gap: theme.spacing.space3,
    },
    plannedItemBorder: {
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
    },
    plannedIconBox: {
      width: 34,
      height: 34,
      borderRadius: theme.rounded.sm,
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },
    plannedItemTextCol: {
      flex: 1,
      gap: 2,
    },
    plannedItemTitle: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.espressoDark,
    },
    plannedItemSubtitle: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 16,
    },
    soonBadge: {
      backgroundColor: theme.colors.chips.secondary.background,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: theme.rounded.full,
    },
    soonBadgeText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 10,
      fontWeight: '700',
      color: theme.colors.chips.secondary.text,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    aboutCard: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.lg,
      padding: theme.spacing.space5,
      width: '100%',
      ...theme.shadows.soft,
    },
    aboutHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.space3,
      marginBottom: theme.spacing.space3,
    },
    brandBadge: {
      width: 44,
      height: 44,
      borderRadius: theme.rounded.md,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },
    brandTextWrapper: {
      flex: 1,
      gap: 2,
    },
    brandName: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.espressoDark,
    },
    appVersion: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    aboutDescription: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      lineHeight: 20,
      color: theme.colors.onSurfaceVariant,
    },
  });
