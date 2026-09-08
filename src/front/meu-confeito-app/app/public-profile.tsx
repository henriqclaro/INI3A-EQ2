import { useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

import { Image } from 'expo-image';
import { Stack, router, useLocalSearchParams } from 'expo-router';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { RecipeView } from '@/src/components';
import { useAuth } from '@/src/contexts/AuthContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { usePublicBakerProfile } from '@/src/hooks/useBakerProfile';
import { useUserRecipes } from '@/src/hooks/useRecipes';
import { AppTheme } from '@/src/theme/themes';
import { formatPhoneInput } from '@/src/utils/validation';

export default function PublicProfileScreen() {
  const { theme } = useThemeMode();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { width } = useWindowDimensions();

  const isDesktop = width >= 768;

  const targetUserId = id || user?.id;
  const isOwnProfile = Boolean(user?.id && targetUserId === user.id);

  const {
    publicProfile,
    isLoading: isLoadingProfile,
    hasError,
    errorMessage,
    refetch: refetchProfile,
  } = usePublicBakerProfile(targetUserId);

  const {
    recipes,
    isLoading: isLoadingRecipes,
    refetch: refetchRecipes,
  } = useUserRecipes(targetUserId);

  const isLoading = isLoadingProfile || isLoadingRecipes;

  const styles = useMemo(() => createStyles(theme, isDesktop), [theme, isDesktop]);

  const handleRefresh = async () => {
    await Promise.all([refetchProfile(), refetchRecipes()]);
  };

  const handleOpenWhatsApp = async () => {
    if (!publicProfile?.phone) return;
    const cleanDigits = publicProfile.phone.replace(/\D/g, '');
    const phoneWithCountry = cleanDigits.startsWith('55') ? cleanDigits : `55${cleanDigits}`;
    const url = `https://wa.me/${phoneWithCountry}`;

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(`tel:${publicProfile.phone}`);
      }
    } catch (error) {
      console.error('Error opening phone link:', error);
      Alert.alert('Contato', `Telefone: ${formatPhoneInput(publicProfile.phone)}`);
    }
  };

  const handleOpenInstagram = async () => {
    if (!publicProfile?.instagram) return;
    const cleanHandle = publicProfile.instagram.replace('@', '').trim();
    const url = `https://instagram.com/${cleanHandle}`;

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Instagram', `@${cleanHandle}`);
      }
    } catch (error) {
      console.error('Error opening instagram link:', error);
      Alert.alert('Instagram', `@${cleanHandle}`);
    }
  };

  const locationText = useMemo(() => {
    const parts = [publicProfile?.neighborhood, publicProfile?.city].filter(Boolean);
    return parts.join(', ');
  }, [publicProfile?.city, publicProfile?.neighborhood]);

  return (
    <>
      <Stack.Screen
        options={{
          title: isOwnProfile ? 'Prévia do Perfil Público' : 'Perfil do Confeiteiro',
        }}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        {isOwnProfile && (
          <View style={styles.previewBanner}>
            <View style={styles.previewIconWrapper}>
              <MaterialCommunityIcons
                name="eye-check-outline"
                size={22}
                color={theme.colors.primary}
              />
            </View>
            <View style={styles.previewTextContainer}>
              <Text style={styles.previewTitle}>Visualização Pública Ativa</Text>
              <Text style={styles.previewSubtitle}>
                É assim que os clientes e a comunidade veem seu perfil. Seus dados privados (como
                e-mail) nunca são compartilhados.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.previewEditBtn}
              onPress={() => router.push('/edit-profile')}
              accessibilityRole="button"
              accessibilityLabel="Editar Perfil"
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="pencil-outline"
                size={16}
                color={theme.colors.primary}
              />
              <Text style={styles.previewEditText}>Editar</Text>
            </TouchableOpacity>
          </View>
        )}

        {isLoadingProfile ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : hasError || !publicProfile ? (
          <View style={styles.errorContainer}>
            <View style={styles.errorIconWrapper}>
              <MaterialCommunityIcons
                name="account-off-outline"
                size={48}
                color={theme.colors.primary}
              />
            </View>
            <Text style={styles.errorTitle}>Perfil Indisponível</Text>
            <Text style={styles.errorSubtitle}>
              {errorMessage ||
                'Este confeiteiro ainda não ativou um perfil público ou a conta não foi encontrada.'}
            </Text>
            {isOwnProfile && (
              <TouchableOpacity
                style={styles.activateBtn}
                onPress={() => router.push('/edit-profile')}
                activeOpacity={0.8}
              >
                <Text style={styles.activateBtnText}>Ativar Perfil Público</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.contentWrapper}>
            {/* Baker details card */}
            <View style={styles.bakerCard}>
              <View style={styles.avatarContainer}>
                {publicProfile.pfpUrl ? (
                  <Image
                    source={{ uri: publicProfile.pfpUrl }}
                    alt="Foto do Confeiteiro"
                    style={styles.avatar}
                    contentFit="cover"
                  />
                ) : (
                  <View style={[styles.avatar, styles.placeholderAvatar]}>
                    <MaterialCommunityIcons
                      name="account"
                      size={64}
                      color={theme.colors.mediumGray}
                    />
                  </View>
                )}

                <View style={styles.publicBadge}>
                  <MaterialCommunityIcons
                    name="storefront-outline"
                    size={14}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.publicBadgeText}>Perfil Público</Text>
                </View>
              </View>

              <Text style={styles.bakerName}>{publicProfile.name}</Text>

              {locationText ? (
                <View style={styles.locationContainer}>
                  <MaterialCommunityIcons
                    name="map-marker-outline"
                    size={16}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.locationText}>{locationText}</Text>
                </View>
              ) : null}

              {publicProfile.bio ? (
                <View style={styles.bioContainer}>
                  <Text style={styles.bioText}>{publicProfile.bio}</Text>
                </View>
              ) : null}

              {/* Action buttons (WhatsApp, Instagram) */}
              <View style={styles.actionsContainer}>
                {publicProfile.phone ? (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnPrimary]}
                    onPress={handleOpenWhatsApp}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel="Entrar em contato pelo WhatsApp"
                  >
                    <MaterialCommunityIcons
                      name="whatsapp"
                      size={20}
                      color={theme.colors.secondaryText}
                    />
                    <Text style={styles.actionBtnPrimaryText}>WhatsApp</Text>
                  </TouchableOpacity>
                ) : null}

                {publicProfile.instagram ? (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnSecondary]}
                    onPress={handleOpenInstagram}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel="Visitar perfil no Instagram"
                  >
                    <MaterialCommunityIcons name="instagram" size={20} color={theme.colors.text} />
                    <Text style={styles.actionBtnSecondaryText}>
                      {publicProfile.instagram.startsWith('@')
                        ? publicProfile.instagram
                        : `@${publicProfile.instagram}`}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            {/* Recipes Section */}
            <View style={styles.recipesSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Receitas Publicadas</Text>
                <Text style={styles.recipeCountBadge}>
                  {recipes.length} {recipes.length === 1 ? 'receita' : 'receitas'}
                </Text>
              </View>

              {isLoadingRecipes ? (
                <View style={styles.recipesLoading}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                </View>
              ) : recipes.length === 0 ? (
                <View style={styles.emptyRecipesCard}>
                  <MaterialCommunityIcons
                    name="book-open-page-variant-outline"
                    size={36}
                    color={theme.colors.placeholder}
                  />
                  <Text style={styles.emptyRecipesTitle}>Nenhuma receita disponível</Text>
                  <Text style={styles.emptyRecipesSubtitle}>
                    Este confeiteiro ainda não publicou receitas na comunidade.
                  </Text>
                </View>
              ) : (
                <View style={styles.recipesGrid}>
                  {recipes.map((recipe) => (
                    <View key={recipe.id} style={styles.recipeCardWrapper}>
                      <RecipeView
                        title={recipe.title}
                        coverUrl={recipe.coverUrl}
                        tags={recipe.tags}
                        prepTimeMinutes={recipe.prepTimeMinutes}
                        onPress={() => {
                          router.push({
                            pathname: '/single-recipe',
                            params: { recipeId: recipe.id },
                          });
                        }}
                      />
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </>
  );
}

const createStyles = (theme: AppTheme, isDesktop: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      paddingHorizontal: isDesktop ? 32 : 16,
      paddingTop: 16,
      paddingBottom: 60,
      maxWidth: 960,
      width: '100%',
      alignSelf: 'center',
    },
    previewBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.pitchBackground,
      borderWidth: 1,
      borderColor: theme.colors.secBorder,
      borderRadius: 12,
      padding: 14,
      marginBottom: 16,
      gap: 12,
    },
    previewIconWrapper: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.secBorder,
    },
    previewTextContainer: {
      flex: 1,
    },
    previewTitle: {
      fontFamily: 'Inter',
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 2,
    },
    previewSubtitle: {
      fontFamily: 'Inter',
      fontSize: 12,
      color: theme.colors.text,
      opacity: 0.8,
      lineHeight: 16,
    },
    previewEditBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.secBorder,
      backgroundColor: theme.colors.background,
      minHeight: 48,
    },
    previewEditText: {
      fontFamily: 'Inter',
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    loadingContainer: {
      paddingVertical: 80,
      alignItems: 'center',
      justifyContent: 'center',
    },
    errorContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
      paddingHorizontal: 24,
      backgroundColor: theme.colors.pitchBackground,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.secBorder,
      marginTop: 16,
    },
    errorIconWrapper: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.secBorder,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    errorTitle: {
      fontFamily: 'Playfair Display SC',
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    errorSubtitle: {
      fontFamily: 'Inter',
      fontSize: 14,
      color: theme.colors.text,
      opacity: 0.75,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 20,
      maxWidth: 360,
    },
    activateBtn: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
      minHeight: 48,
      justifyContent: 'center',
      alignItems: 'center',
    },
    activateBtnText: {
      fontFamily: 'Inter',
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.secondaryText,
    },
    contentWrapper: {
      gap: 20,
    },
    bakerCard: {
      backgroundColor: theme.colors.pitchBackground,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.secBorder,
      padding: 24,
      alignItems: 'center',
      width: '100%',
    },
    avatarContainer: {
      position: 'relative',
      marginBottom: 12,
    },
    avatar: {
      width: 110,
      height: 110,
      borderRadius: 55,
      borderWidth: 3,
      borderColor: theme.colors.primary,
    },
    placeholderAvatar: {
      backgroundColor: theme.colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    publicBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.secBorder,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 9999,
      alignSelf: 'center',
      marginTop: 8,
    },
    publicBadgeText: {
      fontFamily: 'Inter',
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.primary,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    bakerName: {
      fontFamily: 'Playfair Display SC',
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      textAlign: 'center',
      marginTop: 8,
    },
    locationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 6,
    },
    locationText: {
      fontFamily: 'Inter',
      fontSize: 14,
      color: theme.colors.text,
      opacity: 0.8,
    },
    bioContainer: {
      marginTop: 14,
      paddingHorizontal: 12,
      width: '100%',
      maxWidth: 520,
    },
    bioText: {
      fontFamily: 'Inter',
      fontSize: 14,
      color: theme.colors.text,
      textAlign: 'center',
      lineHeight: 22,
      fontStyle: 'italic',
      opacity: 0.9,
    },
    actionsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginTop: 20,
      justifyContent: 'center',
      width: '100%',
    },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
      minHeight: 48,
      minWidth: 140,
    },
    actionBtnPrimary: {
      backgroundColor: theme.colors.primary,
    },
    actionBtnPrimaryText: {
      fontFamily: 'Inter',
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.secondaryText,
    },
    actionBtnSecondary: {
      backgroundColor: theme.colors.pitchBackground,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    actionBtnSecondaryText: {
      fontFamily: 'Inter',
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
    },
    recipesSection: {
      width: '100%',
      marginTop: 8,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
      paddingHorizontal: 4,
    },
    sectionTitle: {
      fontFamily: 'Playfair Display SC',
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    recipeCountBadge: {
      fontFamily: 'Inter',
      fontSize: 12,
      color: theme.colors.darkGray,
    },
    recipesLoading: {
      paddingVertical: 24,
      alignItems: 'center',
    },
    emptyRecipesCard: {
      backgroundColor: theme.colors.pitchBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.secBorder,
      padding: 24,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    emptyRecipesTitle: {
      fontFamily: 'Playfair Display SC',
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    emptyRecipesSubtitle: {
      fontFamily: 'Inter',
      fontSize: 13,
      color: theme.colors.mediumGray,
      textAlign: 'center',
    },
    recipesGrid: {
      gap: 16,
    },
    recipeCardWrapper: {
      width: '100%',
    },
  });
