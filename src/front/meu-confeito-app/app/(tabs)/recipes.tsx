import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
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

import { FloatingActionItem, FloatingButton, RecipeView } from '@/src/components';
import { useAuth } from '@/src/contexts/AuthContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { useUserRecipes } from '@/src/hooks/useRecipes';
import { AppTheme } from '@/src/theme/themes';

export default function RecipesScreen() {
  const { theme } = useThemeMode();
  const { user } = useAuth();
  const { recipes, isLoading, refetch } = useUserRecipes(user?.id);
  const { width } = useWindowDimensions();
  const [isSpeedDialOpen, setIsSpeedDialOpen] = useState(false);

  const isDesktop = width >= 768;

  const cardWidth = useMemo(() => {
    if (width >= 1200) {
      return (1200 - 48 - 48) / 4; // 4 columns on large desktop
    }
    if (width >= 960) {
      return (width - 48 - 32) / 3; // 3 columns on tablet / small desktop
    }
    if (width >= 768) {
      return (width - 48 - 16) / 2; // 2 columns on tablets
    }
    return undefined; // full width on mobile
  }, [width]);

  const speedDialActions: FloatingActionItem[] = useMemo(
    () => [
      {
        id: 'create-recipe',
        label: 'Criar Nova Receita',
        icon: 'notebook-plus-outline',
        variant: 'primary',
        onPress: () => router.push('/create-recipe'),
        accessibilityLabel: 'Criar nova receita',
      },
      {
        id: 'public-recipes',
        label: 'Buscar Receitas Públicas',
        icon: 'book-search-outline',
        variant: 'secondary',
        onPress: () => router.push('/public-recipes'),
        accessibilityLabel: 'Buscar receitas públicas',
      },
    ],
    [],
  );

  const styles = useMemo(() => createStyles(theme, isDesktop), [theme, isDesktop]);

  return (
    <View style={styles.container}>
      {isSpeedDialOpen && (
        <Pressable
          style={styles.backdrop}
          onPress={() => setIsSpeedDialOpen(false)}
          accessibilityRole="button"
          accessibilityLabel="Fechar menu de opções"
        />
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : recipes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <MaterialCommunityIcons name="chef-hat" size={44} color={theme.colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Seu caderno está esperando!</Text>
            <Text style={styles.emptySubtitle}>
              Você ainda não possui receitas cadastradas. Que tal registrar sua primeira receita ou
              buscar inspiração nas receitas públicas?
            </Text>
            <View style={styles.emptyActionsRow}>
              <TouchableOpacity
                style={styles.emptyPrimaryBtn}
                onPress={() => router.push('/create-recipe')}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons
                  name="notebook-plus-outline"
                  size={18}
                  color={theme.colors.secondaryText}
                />
                <Text style={styles.emptyPrimaryBtnText}>Criar Primeira Receita</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.emptySecondaryBtn}
                onPress={() => router.push('/public-recipes')}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons
                  name="book-search-outline"
                  size={18}
                  color={theme.colors.text}
                />
                <Text style={styles.emptySecondaryBtnText}>Ver Receitas Públicas</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.contentWrapper}>
            <View style={styles.gridContainer}>
              {recipes.map((recipe) => (
                <View
                  key={recipe.id}
                  style={[styles.cardWrapper, cardWidth ? { width: cardWidth } : null]}
                >
                  <RecipeView
                    title={recipe.title}
                    coverUrl={recipe.coverUrl}
                    tags={recipe.tags}
                    prepTimeMinutes={recipe.prepTimeMinutes}
                    onPress={() => {
                      router.push({ pathname: '/single-recipe', params: { recipeId: recipe.id } });
                    }}
                  />
                </View>
              ))}
            </View>

            {/* Bottom Suggestion Card */}
            <View style={styles.bottomSuggestionCard}>
              <View style={styles.suggestionHeader}>
                <View style={styles.suggestionIconWrapper}>
                  <MaterialCommunityIcons name="chef-hat" size={26} color={theme.colors.primary} />
                </View>
                <View style={styles.suggestionHeaderText}>
                  <Text style={styles.suggestionTitle}>Quer expandir seu cardápio?</Text>
                  <Text style={styles.suggestionSubtitle}>
                    Cadastre uma nova criação autoral ou descubra receitas compartilhadas pela
                    comunidade.
                  </Text>
                </View>
              </View>
              <View style={styles.suggestionButtonsRow}>
                <TouchableOpacity
                  style={styles.suggestionPrimaryBtn}
                  onPress={() => router.push('/create-recipe')}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons
                    name="notebook-plus-outline"
                    size={18}
                    color={theme.colors.secondaryText}
                  />
                  <Text style={styles.suggestionPrimaryBtnText}>Criar Nova Receita</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.suggestionSecondaryBtn}
                  onPress={() => router.push('/public-recipes')}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons
                    name="book-search-outline"
                    size={18}
                    color={theme.colors.text}
                  />
                  <Text style={styles.suggestionSecondaryBtnText}>Explorar Públicas</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <FloatingButton
        variant="primary"
        containerStyle={styles.button}
        actions={speedDialActions}
        isOpen={isSpeedDialOpen}
        onToggleOpen={setIsSpeedDialOpen}
        accessibilityLabel="Opções de receita"
      />
    </View>
  );
}

const createStyles = (theme: AppTheme, isDesktop: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    backdrop: {
      ...StyleSheet.absoluteFill,
      backgroundColor: theme.colors.backdrop,
      zIndex: 40,
    },
    scrollView: {
      flex: 1,
      width: '100%',
    },
    scrollContainer: {
      paddingHorizontal: isDesktop ? 24 : 16,
      paddingTop: 16,
      paddingBottom: 100,
      alignItems: 'center',
    },
    contentWrapper: {
      width: '100%',
      maxWidth: 1200,
      alignItems: 'center',
      gap: 24,
    },
    gridContainer: {
      flexDirection: isDesktop ? 'row' : 'column',
      flexWrap: isDesktop ? 'wrap' : 'nowrap',
      gap: 16,
      justifyContent: isDesktop ? 'flex-start' : 'center',
      alignItems: 'center',
      width: '100%',
    },
    cardWrapper: {
      width: '100%',
      maxWidth: isDesktop ? undefined : 480,
    },
    loadingContainer: {
      paddingTop: 80,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyContainer: {
      paddingTop: 48,
      paddingHorizontal: 20,
      alignItems: 'center',
      justifyContent: 'center',
      maxWidth: 480,
      width: '100%',
    },
    emptyIconCircle: {
      width: 76,
      height: 76,
      borderRadius: 38,
      backgroundColor: theme.colors.secondary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      marginBottom: 16,
    },
    emptyTitle: {
      color: theme.colors.text,
      fontFamily: 'Playfair Display SC',
      fontSize: 22,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 8,
    },
    emptySubtitle: {
      color: theme.colors.text,
      fontFamily: 'Inter',
      fontSize: 14,
      lineHeight: 20,
      opacity: 0.8,
      textAlign: 'center',
      marginBottom: 24,
    },
    emptyActionsRow: {
      width: '100%',
      gap: 12,
    },
    emptyPrimaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      minHeight: 48,
      borderRadius: 8,
      paddingHorizontal: 20,
      gap: 8,
    },
    emptyPrimaryBtnText: {
      color: theme.colors.secondaryText,
      fontFamily: 'Inter',
      fontSize: 15,
      fontWeight: '600',
    },
    emptySecondaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.pitchBackground,
      borderWidth: 1,
      borderColor: theme.colors.secBorder,
      minHeight: 48,
      borderRadius: 8,
      paddingHorizontal: 20,
      gap: 8,
    },
    emptySecondaryBtnText: {
      color: theme.colors.text,
      fontFamily: 'Inter',
      fontSize: 15,
      fontWeight: '600',
    },
    bottomSuggestionCard: {
      width: '100%',
      backgroundColor: theme.colors.pitchBackground,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.secBorder,
      padding: 20,
      marginTop: 8,
      gap: 16,
    },
    suggestionHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 14,
    },
    suggestionIconWrapper: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: theme.colors.secondary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    suggestionHeaderText: {
      flex: 1,
    },
    suggestionTitle: {
      fontFamily: 'Playfair Display SC',
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 4,
    },
    suggestionSubtitle: {
      fontFamily: 'Inter',
      fontSize: 13,
      lineHeight: 18,
      color: theme.colors.text,
      opacity: 0.8,
    },
    suggestionButtonsRow: {
      flexDirection: isDesktop ? 'row' : 'column',
      gap: 10,
    },
    suggestionPrimaryBtn: {
      flex: isDesktop ? 1 : undefined,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      minHeight: 48,
      borderRadius: 8,
      paddingHorizontal: 16,
      gap: 8,
    },
    suggestionPrimaryBtnText: {
      color: theme.colors.secondaryText,
      fontFamily: 'Inter',
      fontSize: 14,
      fontWeight: '600',
    },
    suggestionSecondaryBtn: {
      flex: isDesktop ? 1 : undefined,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.secBorder,
      minHeight: 48,
      borderRadius: 8,
      paddingHorizontal: 16,
      gap: 8,
    },
    suggestionSecondaryBtnText: {
      color: theme.colors.text,
      fontFamily: 'Inter',
      fontSize: 14,
      fontWeight: '600',
    },
    button: {
      position: 'absolute',
      bottom: 24,
      right: 24,
    },
  });
