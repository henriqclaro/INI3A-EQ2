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

import { RecipeSmallView } from '@/src/components';
import { useAuth } from '@/src/contexts/AuthContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { usePublicBakerProfile, usePublicShowcase } from '@/src/hooks/useBakerProfile';
import { AppTheme } from '@/src/theme/themes';
import { formatPhoneInput } from '@/src/utils/validation';

export default function PublicProfileScreen() {
  const { theme } = useThemeMode();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { width } = useWindowDimensions();

  const isDesktop = width >= 768;
  const isBakerRole = user?.role?.trim().toUpperCase() === 'BAKER';

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
    showcase,
    isLoading: isLoadingShowcase,
    refetch: refetchShowcase,
  } = usePublicShowcase(targetUserId);

  const isLoading = isLoadingProfile || isLoadingShowcase;

  const styles = useMemo(() => createStyles(theme, isDesktop), [theme, isDesktop]);

  const handleRefresh = async () => {
    await Promise.all([refetchProfile(), refetchShowcase()]);
  };

  const handleOpenWhatsApp = async () => {
    if (!publicProfile?.whatsapp) return;
    const cleanDigits = publicProfile.whatsapp.replace(/\D/g, '');
    const phoneWithCountry = cleanDigits.startsWith('55') ? cleanDigits : `55${cleanDigits}`;
    const url = `https://wa.me/${phoneWithCountry}`;

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(`tel:${publicProfile.whatsapp}`);
      }
    } catch (error) {
      console.error('Error opening WhatsApp link:', error);
      Alert.alert('Contato WhatsApp', `Número: ${formatPhoneInput(publicProfile.whatsapp)}`);
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
                    cachePolicy="memory-disk"
                    recyclingKey={publicProfile.pfpUrl}
                    transition={150}
                  />
                ) : (
                  <View style={[styles.avatar, styles.placeholderAvatar]}>
                    <MaterialCommunityIcons name="account" size={64} color={theme.colors.outline} />
                  </View>
                )}

                <View style={styles.publicBadge}>
                  <MaterialCommunityIcons
                    name="storefront-outline"
                    size={14}
                    color={theme.colors.chips.success.text}
                  />
                  <Text style={styles.publicBadgeText}>Perfil Público</Text>
                </View>
              </View>

              <Text style={styles.bakerName}>
                {publicProfile.publicName?.trim() || publicProfile.name}
              </Text>

              {publicProfile.publicName?.trim() &&
              publicProfile.publicName.trim() !== publicProfile.name ? (
                <View style={styles.accountAttributionRow}>
                  <MaterialCommunityIcons
                    name="account-outline"
                    size={14}
                    color={theme.colors.onSurfaceVariant}
                  />
                  <Text style={styles.accountAttributionText}>
                    Conta pública: {publicProfile.name}
                  </Text>
                </View>
              ) : null}

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

              {/* Baker Tags & Specialties */}
              {publicProfile.tags && publicProfile.tags.length > 0 ? (
                <View style={styles.tagsContainer}>
                  {publicProfile.tags.map((tag) => (
                    <View key={tag.id} style={styles.tagChip}>
                      <MaterialCommunityIcons
                        name="tag-outline"
                        size={12}
                        color={theme.colors.secondary}
                      />
                      <Text style={styles.tagChipText}>{tag.name}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {/* Action buttons (WhatsApp, Instagram) */}
              <View style={styles.actionsContainer}>
                {publicProfile.whatsapp ? (
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
                      color={theme.colors.onPrimary}
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
                    <MaterialCommunityIcons
                      name="instagram"
                      size={20}
                      color={theme.colors.onSurface}
                    />
                    <Text style={styles.actionBtnSecondaryText}>
                      {publicProfile.instagram.startsWith('@')
                        ? publicProfile.instagram
                        : `@${publicProfile.instagram}`}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            {/* Showcase Section */}
            <View style={styles.recipesSection}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleGroup}>
                  <MaterialCommunityIcons
                    name="storefront-outline"
                    size={20}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.sectionTitle}>Vitrine de Destaques</Text>
                </View>

                <View style={styles.sectionHeaderActions}>
                  <Text style={styles.recipeCountBadge}>
                    {showcase.length} {showcase.length === 1 ? 'destaque' : 'destaques'}
                  </Text>

                  {isOwnProfile ? (
                    <TouchableOpacity
                      style={styles.manageShowcaseBtn}
                      onPress={() => router.push('/edit-profile')}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel="Gerenciar vitrine de receitas"
                    >
                      <MaterialCommunityIcons
                        name="pencil-outline"
                        size={14}
                        color={theme.colors.primary}
                      />
                      <Text style={styles.manageShowcaseBtnText}>Gerenciar</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>

              {isLoadingShowcase ? (
                <View style={styles.recipesLoading}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                </View>
              ) : showcase.length === 0 ? (
                <View style={styles.emptyRecipesCard}>
                  <MaterialCommunityIcons
                    name="storefront-outline"
                    size={36}
                    color={theme.colors.onSurfaceVariant}
                  />
                  <Text style={styles.emptyRecipesTitle}>Nenhum produto na vitrine</Text>
                  <Text style={styles.emptyRecipesSubtitle}>
                    {isOwnProfile
                      ? 'Adicione receitas na vitrine através da edição de perfil para exibi-las em destaque aqui.'
                      : 'Este confeiteiro ainda não configurou uma vitrine de produtos.'}
                  </Text>
                  {isOwnProfile ? (
                    <TouchableOpacity
                      style={styles.addShowcaseEmptyBtn}
                      onPress={() => router.push('/edit-profile')}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel="Configurar vitrine de produtos"
                    >
                      <MaterialCommunityIcons
                        name="plus"
                        size={16}
                        color={theme.colors.onPrimary}
                      />
                      <Text style={styles.addShowcaseEmptyBtnText}>Configurar Vitrine</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : (
                <View style={styles.recipesGrid}>
                  {showcase.map((item) => (
                    <View key={item.recipeId} style={styles.recipeCardWrapper}>
                      <RecipeSmallView
                        title={item.recipe.title}
                        coverUrl={item.recipe.coverUrl}
                        rating={item.recipe.averageRating}
                        totalReviews={item.recipe.totalReviews}
                        isClickable={isBakerRole}
                        onPress={
                          isBakerRole
                            ? () => {
                                router.push({
                                  pathname: '/single-recipe',
                                  params: { recipeId: item.recipeId },
                                });
                              }
                            : undefined
                        }
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
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.md,
      padding: 14,
      marginBottom: 16,
      gap: 12,
    },
    previewIconWrapper: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.surfaceContainerLowest,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    previewTextContainer: {
      flex: 1,
    },
    previewTitle: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.espressoDark,
      marginBottom: 2,
    },
    previewSubtitle: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 16,
    },
    previewEditBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: theme.rounded.sm,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surfaceContainerLowest,
      minHeight: 48,
    },
    previewEditText: {
      fontFamily: theme.typography.labelMd.fontFamily,
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
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.rounded.lg,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      marginTop: 16,
      ...theme.shadows.soft,
    },
    errorIconWrapper: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    errorTitle: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.espressoDark,
      marginBottom: 8,
      textAlign: 'center',
    },
    errorSubtitle: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 20,
      maxWidth: 360,
    },
    activateBtn: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: theme.rounded.default,
      minHeight: 48,
      justifyContent: 'center',
      alignItems: 'center',
      ...theme.shadows.glow,
    },
    activateBtnText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.onPrimary,
    },
    contentWrapper: {
      gap: 20,
    },
    bakerCard: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.rounded.lg,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: 24,
      alignItems: 'center',
      width: '100%',
      ...theme.shadows.soft,
    },
    avatarContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      position: 'relative',
      marginBottom: 12,
    },
    avatar: {
      width: 110,
      height: 110,
      borderRadius: 55,
      borderWidth: 3,
      borderColor: theme.colors.primary,
      alignSelf: 'center',
    },
    placeholderAvatar: {
      backgroundColor: theme.colors.surfaceContainerLow,
      alignItems: 'center',
      justifyContent: 'center',
    },
    publicBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: theme.colors.chips.success.background,
      borderWidth: 1,
      borderColor: theme.colors.tertiaryFixed,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: theme.rounded.full,
      alignSelf: 'center',
      marginTop: 8,
    },
    publicBadgeText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.chips.success.text,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    bakerName: {
      fontFamily: theme.typography.headlineLg.fontFamily,
      fontSize: 24,
      fontWeight: '600',
      color: theme.colors.espressoDark,
      textAlign: 'center',
      marginTop: 8,
    },
    accountAttributionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      marginTop: 4,
    },
    accountAttributionText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
    locationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 6,
    },
    locationText: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
    bioContainer: {
      marginTop: 14,
      paddingHorizontal: 12,
      width: '100%',
      maxWidth: 520,
    },
    bioText: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 14,
      color: theme.colors.onSurface,
      textAlign: 'center',
      lineHeight: 22,
      fontStyle: 'italic',
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 6,
      marginTop: 14,
      paddingHorizontal: 8,
      maxWidth: 520,
    },
    tagChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: theme.rounded.full,
      gap: 4,
    },
    tagChipText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.espressoDark,
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
      borderRadius: theme.rounded.default,
      minHeight: 48,
      minWidth: 140,
    },
    actionBtnPrimary: {
      backgroundColor: theme.colors.primary,
      ...theme.shadows.glow,
    },
    actionBtnPrimaryText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.onPrimary,
    },
    actionBtnSecondary: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    actionBtnSecondaryText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.onSurface,
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
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.espressoDark,
    },
    sectionTitleGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    sectionHeaderActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    recipeCountBadge: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    manageShowcaseBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: theme.rounded.full,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surfaceContainerLow,
    },
    manageShowcaseBtnText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    recipesLoading: {
      paddingVertical: 24,
      alignItems: 'center',
    },
    emptyRecipesCard: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.rounded.md,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: 24,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      ...theme.shadows.soft,
    },
    emptyRecipesTitle: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.espressoDark,
    },
    emptyRecipesSubtitle: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      lineHeight: 18,
    },
    addShowcaseEmptyBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: theme.rounded.default,
      minHeight: 48,
      marginTop: 8,
      ...theme.shadows.glow,
    },
    addShowcaseEmptyBtnText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.onPrimary,
    },
    recipesGrid: {
      gap: 16,
    },
    recipeCardWrapper: {
      width: '100%',
    },
  });
