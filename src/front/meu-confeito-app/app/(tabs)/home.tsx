import { useMemo } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { router } from 'expo-router';

import { CustomButton, NearbyBakersExplorer, RecipeSmallView } from '@/src/components';
import { useAuth } from '@/src/contexts/AuthContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { useUserRecipes } from '@/src/hooks/useRecipes';
import { AppTheme } from '@/src/theme/themes';

function CustomerHomeScreen() {
  const { theme } = useThemeMode();
  const { user } = useAuth();
  const styles = useMemo(() => createCustomerStyles(theme), [theme]);

  const firstName = user?.name ? user.name.split(' ')[0] : 'Cliente';

  return (
    <View style={styles.container}>
      <NearbyBakersExplorer
        hasIntroHeader={false}
        headerContent={
          <View style={styles.header}>
            <Text style={styles.title}>Olá, {firstName}!</Text>
            <Text style={styles.subtitle}>
              Descubra confeitarias e doces artesanais perto de você.
            </Text>
          </View>
        }
      />
    </View>
  );
}

function BakerHomeScreen() {
  const { theme } = useThemeMode();
  const { user } = useAuth();
  const { recipes, isLoading, refetch } = useUserRecipes(user?.id);

  const styles = useMemo(() => createBakerStyles(theme), [theme]);

  const firstName = user?.name ? user.name.split(' ')[0] : 'Confeiteiro';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Olá, {firstName}!</Text>
        <Text style={styles.subtitle}>Bem-vindo de volta.</Text>
      </View>

      <View style={styles.topicContainer}>
        <Text style={styles.topicTitle}>Suas Receitas</Text>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
        >
          {recipes.length > 0 ? (
            recipes.map((recipe) => (
              <RecipeSmallView
                key={recipe.id}
                title={recipe.title}
                coverUrl={recipe.coverUrl}
                prepTimeMinutes={recipe.prepTimeMinutes}
                onPress={() => {
                  router.push({ pathname: '/single-recipe', params: { recipeId: recipe.id } });
                }}
              />
            ))
          ) : (
            <Text style={styles.emptyText}>Você ainda não possui receitas públicas.</Text>
          )}
          <View style={styles.actionsContainer}>
            <CustomButton
              title="Estoque"
              onPress={() => router.push('/stock')}
              style={styles.actionBtn}
            />
            <CustomButton
              title="Histórico de Produções"
              variant="secondary"
              onPress={() => router.push('/productions')}
              style={styles.actionBtn}
            />
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const { user } = useAuth();
  const isCustomerRole = user?.role?.trim().toUpperCase() === 'CUSTOMER';

  if (isCustomerRole) {
    return <CustomerHomeScreen />;
  }

  return <BakerHomeScreen />;
}

const createCustomerStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      paddingHorizontal: theme.spacing.space1,
      paddingTop: theme.spacing.space2,
      paddingBottom: theme.spacing.space1,
    },
    title: {
      color: theme.colors.espressoDark,
      fontFamily: theme.typography.headlineXl.fontFamily,
      fontSize: 28,
      fontWeight: '600',
      marginBottom: 4,
    },
    subtitle: {
      color: theme.colors.onSurfaceVariant,
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 15,
      lineHeight: 20,
    },
  });

const createBakerStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingTop: 16,
    },
    header: {
      paddingHorizontal: 20,
      marginBottom: 20,
    },
    title: {
      color: theme.colors.espressoDark,
      fontFamily: theme.typography.headlineXl.fontFamily,
      fontSize: 32,
      fontWeight: '600',
      marginBottom: 5,
    },
    subtitle: {
      color: theme.colors.onSurfaceVariant,
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 16,
    },
    topicContainer: {
      flex: 1,
    },
    topicTitle: {
      color: theme.colors.espressoDark,
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 22,
      fontWeight: '600',
      paddingHorizontal: 20,
      marginBottom: 15,
    },
    scrollContainer: {
      paddingHorizontal: 20,
      gap: 15,
      paddingBottom: 20,
    },
    emptyText: {
      color: theme.colors.onSurfaceVariant,
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 15,
      fontStyle: 'italic',
      marginTop: 20,
    },
    actionsContainer: {
      alignItems: 'center',
      gap: 12,
      marginTop: 10,
    },
    actionBtn: {
      width: '100%',
      maxWidth: 320,
    },
  });
