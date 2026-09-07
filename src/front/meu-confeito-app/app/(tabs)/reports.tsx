import { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';

export default function ReportsScreen() {
  const { theme } = useThemeMode();
  const [isRefreshing, setIsRefreshing] = useState(false);

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
            Em breve você poderá acompanhar aqui relatórios detalhados de custos de produção,
            consumo de ingredientes e lucratividade.
          </Text>
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
      maxWidth: 380,
    },
    iconCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.pitchBackground,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 18,
    },
    title: {
      fontFamily: 'Playfair Display SC',
      fontSize: 22,
      fontWeight: 'bold',
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      fontFamily: 'Inter',
      fontSize: 14,
      color: theme.colors.text,
      opacity: 0.75,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 16,
    },
    pullHint: {
      fontFamily: 'Inter',
      fontSize: 12,
      color: theme.colors.placeholder,
      textAlign: 'center',
    },
  });
