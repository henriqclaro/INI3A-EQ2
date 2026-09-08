import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { router } from 'expo-router';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useAuth } from '@/src/contexts/AuthContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';

export default function ReportsScreen() {
  const { theme } = useThemeMode();
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const styles = useMemo(() => createStyles(theme), [theme]);

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
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons
              name="chart-timeline-variant"
              size={48}
              color={theme.colors.primary}
            />
          </View>
          <Text style={styles.title}>Relatórios e Métricas</Text>
          <Text style={styles.subtitle}>
            Acompanhe a fabricação das suas receitas, custos de insumos e histórico de produção.
          </Text>

          <TouchableOpacity
            style={styles.productionsActionCard}
            onPress={() => router.push('/productions')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Abrir histórico de produções de receitas"
          >
            <View style={styles.cardIconBox}>
              <MaterialCommunityIcons name="pot-steam" size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.cardTextBox}>
              <Text style={styles.cardTitle}>Histórico de Produções</Text>
              <Text style={styles.cardSubtitle}>
                Consulte lotes fabricados, custos operacionais e consumo de estoque
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={22}
              color={theme.colors.onSurfaceVariant}
            />
          </TouchableOpacity>

          <Text style={styles.pullHint}>Puxe para baixo para atualizar</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContainer: {
      flexGrow: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
      paddingVertical: 32,
    },
    content: {
      alignItems: 'center',
      maxWidth: 420,
      width: '100%',
    },
    iconCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 18,
      ...theme.shadows.soft,
    },
    title: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 22,
      fontWeight: '600',
      color: theme.colors.espressoDark,
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 20,
    },
    productionsActionCard: {
      width: '100%',
      minHeight: 64,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.lg,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginBottom: 24,
      gap: 12,
      ...theme.shadows.soft,
    },
    cardIconBox: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.secondaryContainer,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardTextBox: {
      flex: 1,
    },
    cardTitle: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.espressoDark,
      marginBottom: 2,
    },
    cardSubtitle: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 16,
    },
    pullHint: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      color: theme.colors.outline,
      textAlign: 'center',
    },
  });
