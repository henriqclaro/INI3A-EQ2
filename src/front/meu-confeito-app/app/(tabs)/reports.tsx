import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

import { router } from 'expo-router';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useAuth } from '@/src/contexts/AuthContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';

export default function ReportsScreen() {
  const { theme } = useThemeMode();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isDesktop = width >= 768;

  useEffect(() => {
    if (user?.role?.trim().toUpperCase() === 'CUSTOMER') {
      router.replace('/(tabs)/home');
    }
  }, [user]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    // Placeholder delay for future API reports integration
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  }, []);

  const styles = useMemo(() => createStyles(theme, isDesktop), [theme, isDesktop]);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        <View style={styles.content}>
          {/* Header Banner */}
          <View style={styles.headerSection}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons
                name="chart-timeline-variant"
                size={isDesktop ? 40 : 36}
                color={theme.colors.primary}
              />
            </View>
            <View style={styles.headerTextCol}>
              <Text style={styles.title}>Relatórios & Métricas</Text>
              <Text style={styles.subtitle}>
                Acompanhe a fabricação das suas receitas, custos operacionais e consumo de insumos
                em tempo real.
              </Text>
            </View>
          </View>

          {/* Action Dashboard Grid */}
          <View style={styles.dashboardGrid}>
            {/* Card 1: Produções */}
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/productions')}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Abrir histórico de produções de receitas"
            >
              <View style={styles.cardTopRow}>
                <View style={styles.cardIconBox}>
                  <MaterialCommunityIcons name="pot-steam" size={24} color={theme.colors.primary} />
                </View>
                <View style={styles.cardBadge}>
                  <Text style={styles.cardBadgeText}>Lotes & Custos</Text>
                </View>
              </View>
              <View style={styles.cardTextBox}>
                <Text style={styles.cardTitle}>Histórico de Produções</Text>
                <Text style={styles.cardSubtitle}>
                  Consulte lotes fabricados, custos operacionais detalhados e consumo do estoque.
                </Text>
              </View>
              <View style={styles.cardFooter}>
                <Text style={styles.cardActionText}>Acessar produções</Text>
                <MaterialCommunityIcons name="arrow-right" size={18} color={theme.colors.primary} />
              </View>
            </TouchableOpacity>

            {/* Card 2: Estoque */}
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/stock')}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Abrir gestão de estoque"
            >
              <View style={styles.cardTopRow}>
                <View style={styles.cardIconBox}>
                  <MaterialCommunityIcons
                    name="package-variant-closed"
                    size={24}
                    color={theme.colors.primary}
                  />
                </View>
                <View style={styles.cardBadge}>
                  <Text style={styles.cardBadgeText}>Insumos & Saldos</Text>
                </View>
              </View>
              <View style={styles.cardTextBox}>
                <Text style={styles.cardTitle}>Gestão de Estoque</Text>
                <Text style={styles.cardSubtitle}>
                  Monitore saldo atual, custos médios, compras recentes e alertas de validade.
                </Text>
              </View>
              <View style={styles.cardFooter}>
                <Text style={styles.cardActionText}>Acessar estoque</Text>
                <MaterialCommunityIcons name="arrow-right" size={18} color={theme.colors.primary} />
              </View>
            </TouchableOpacity>

            {/* Card 3: Receitas & Precificação */}
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/recipes')}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Abrir fichas técnicas e precificação de receitas"
            >
              <View style={styles.cardTopRow}>
                <View style={styles.cardIconBox}>
                  <MaterialCommunityIcons
                    name="book-open-page-variant-outline"
                    size={24}
                    color={theme.colors.primary}
                  />
                </View>
                <View style={styles.cardBadge}>
                  <Text style={styles.cardBadgeText}>Fichas Técnicas</Text>
                </View>
              </View>
              <View style={styles.cardTextBox}>
                <Text style={styles.cardTitle}>Fichas & Precificação</Text>
                <Text style={styles.cardSubtitle}>
                  Simule margens de lucro, custos de mão de obra e sugestão de preço por receita.
                </Text>
              </View>
              <View style={styles.cardFooter}>
                <Text style={styles.cardActionText}>Ver receitas</Text>
                <MaterialCommunityIcons name="arrow-right" size={18} color={theme.colors.primary} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Operational Advisory Banner */}
          <View style={styles.advisoryBanner}>
            <MaterialCommunityIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
              style={styles.advisoryIcon}
            />
            <View style={styles.advisoryContent}>
              <Text style={styles.advisoryTitle}>Rastreabilidade & Fichas Técnicas</Text>
              <Text style={styles.advisoryText}>
                Cada lote fabricado através do Meu Confeito deduz automaticamente os insumos do seu
                estoque e registra o custo exato dos ingredientes no momento da produção, garantindo
                que sua margem financeira seja sempre precisa.
              </Text>
            </View>
          </View>

          <Text style={styles.pullHint}>Puxe para baixo para atualizar</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: AppTheme, isDesktop: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContainer: {
      flexGrow: 1,
      alignItems: 'center',
      justifyContent: isDesktop ? 'flex-start' : 'center',
      paddingHorizontal: isDesktop ? 32 : 16,
      paddingVertical: isDesktop ? 32 : 24,
    },
    content: {
      alignItems: 'center',
      maxWidth: isDesktop ? 1040 : 440,
      width: '100%',
      gap: 24,
    },
    headerSection: {
      flexDirection: isDesktop ? 'row' : 'column',
      alignItems: isDesktop ? 'center' : 'center',
      width: '100%',
      gap: 16,
      textAlign: isDesktop ? 'left' : 'center',
      backgroundColor: theme.colors.surfaceContainerLowest,
      padding: isDesktop ? 24 : 20,
      borderRadius: theme.rounded.lg,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      ...theme.shadows.soft,
    },
    iconCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: theme.colors.secondaryContainer,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTextCol: {
      flex: isDesktop ? 1 : undefined,
      alignItems: isDesktop ? 'flex-start' : 'center',
    },
    title: {
      fontFamily: theme.typography.headlineLg.fontFamily,
      fontSize: isDesktop ? 24 : 22,
      fontWeight: '700',
      color: theme.colors.espressoDark,
      textAlign: isDesktop ? 'left' : 'center',
      marginBottom: 4,
    },
    subtitle: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      textAlign: isDesktop ? 'left' : 'center',
      lineHeight: 20,
    },
    dashboardGrid: {
      width: '100%',
      flexDirection: isDesktop ? 'row' : 'column',
      flexWrap: isDesktop ? 'wrap' : 'nowrap',
      gap: 16,
    },
    actionCard: {
      flex: isDesktop ? 1 : undefined,
      minWidth: isDesktop ? 300 : '100%',
      minHeight: 160,
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.lg,
      padding: 20,
      justifyContent: 'space-between',
      gap: 12,
      ...theme.shadows.soft,
    },
    cardTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    cardIconBox: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.secondaryContainer,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardBadge: {
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: theme.rounded.full,
    },
    cardBadgeText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    cardTextBox: {
      gap: 4,
    },
    cardTitle: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.espressoDark,
    },
    cardSubtitle: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 18,
    },
    cardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
      minHeight: 36,
    },
    cardActionText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    advisoryBanner: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: theme.colors.parchment,
      borderRadius: theme.rounded.md,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: 16,
      gap: 12,
    },
    advisoryIcon: {
      marginTop: 2,
    },
    advisoryContent: {
      flex: 1,
      gap: 4,
    },
    advisoryTitle: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.espressoDark,
    },
    advisoryText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      lineHeight: 18,
      color: theme.colors.onSurfaceVariant,
    },
    pullHint: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      color: theme.colors.outline,
      textAlign: 'center',
      marginTop: 4,
    },
  });
