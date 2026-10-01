import { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { CustomButton, MenuOptionButton } from '@/src/components';
import { useAuth } from '@/src/contexts/AuthContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { useMyBakerProfile } from '@/src/hooks/useBakerProfile';
import { AppTheme } from '@/src/theme/themes';

export default function ProfileScreen() {
  const { theme } = useThemeMode();
  const { user, signOut } = useAuth();
  const { width } = useWindowDimensions();
  const isBakerRole = user?.role?.trim().toUpperCase() === 'BAKER';
  const isDesktop = width >= 768;
  const { bakerProfile, hasBakerProfile, isLoading, refetch } = useMyBakerProfile(isBakerRole);

  const styles = useMemo(() => createStyles(theme, isDesktop), [theme, isDesktop]);

  useFocusEffect(
    useCallback(() => {
      if (isBakerRole) {
        refetch().catch((error) =>
          console.error('Error refetching baker profile on focus:', error),
        );
      }
    }, [isBakerRole, refetch]),
  );

  async function handleLogOut() {
    Alert.alert('Sair da Conta', 'Deseja realmente encerrar sua sessão?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
            router.replace('/');
          } catch (error) {
            console.error('Error signing out: ', error);
            Alert.alert('Erro', 'Erro ao sair da conta. Tente novamente.');
          }
        },
      },
    ]);
  }

  const locationSummary = useMemo(() => {
    if (!bakerProfile) return '';
    const parts = [bakerProfile.neighborhood, bakerProfile.city].filter(Boolean);
    return parts.join(', ');
  }, [bakerProfile]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={isBakerRole ? refetch : async () => {}}
          tintColor={theme.colors.primary}
          colors={[theme.colors.primary]}
        />
      }
    >
      <View style={styles.contentWrapper}>
        {/* Main Profile Card Container */}
        <View style={styles.card}>
          <View style={styles.avatarWrapper}>
            {user?.pfpUrl ? (
              <Image
                source={{ uri: user.pfpUrl }}
                alt="Foto de Perfil"
                style={styles.image}
                contentFit="cover"
                cachePolicy="memory-disk"
                recyclingKey={user.pfpUrl}
                transition={150}
              />
            ) : (
              <View style={[styles.image, styles.placeholderImage]}>
                <MaterialCommunityIcons name="account" size={64} color={theme.colors.placeholder} />
              </View>
            )}

            {/* Small Badge indicating Public vs Private Profile (bakers only) */}
            {isBakerRole &&
              (hasBakerProfile ? (
                <View style={styles.publicBadge}>
                  <View style={styles.chipDot} />
                  <Text style={styles.publicBadgeText}>Perfil Público</Text>
                </View>
              ) : (
                <View style={styles.privateBadge}>
                  <MaterialCommunityIcons
                    name="lock-outline"
                    size={12}
                    color={theme.colors.onSurfaceVariant}
                  />
                  <Text style={styles.privateBadgeText}>Perfil Privado</Text>
                </View>
              ))}
          </View>

          <Text style={styles.userName}>{user?.name || 'Usuário'}</Text>

          <View style={styles.roleBadge}>
            <Text style={styles.userRole}>{isBakerRole ? 'Confeiteira(o)' : 'Cliente'}</Text>
          </View>

          {user?.email ? (
            <View style={styles.emailRow}>
              <MaterialCommunityIcons
                name="email-outline"
                size={14}
                color={theme.colors.placeholder}
              />
              <Text style={styles.email}>{user.email}</Text>
            </View>
          ) : null}

          {isBakerRole && locationSummary ? (
            <View style={styles.locationRow}>
              <MaterialCommunityIcons
                name="map-marker-outline"
                size={14}
                color={theme.colors.secondary}
              />
              <Text style={styles.locationText}>{locationSummary}</Text>
            </View>
          ) : null}

          {/* Action buttons inside the card */}
          <View style={styles.cardActions}>
            <CustomButton
              title="Editar Perfil"
              variant="primary"
              style={styles.cardButton}
              onPress={() => router.push('/edit-profile')}
            />

            {isBakerRole &&
              (hasBakerProfile ? (
                <CustomButton
                  title="Visualizar Perfil Público"
                  variant="secondary"
                  style={styles.cardButton}
                  onPress={() =>
                    router.push({
                      pathname: '/public-profile',
                      params: { id: user?.id },
                    })
                  }
                />
              ) : (
                <View style={styles.activatePromptContainer}>
                  <Text style={styles.activatePromptText}>
                    Seu perfil está privado. Torne-o público para divulgar suas receitas e receber
                    encomendas de clientes.
                  </Text>
                  <CustomButton
                    title="Perfil Comercial"
                    variant="dashed"
                    style={styles.cardButton}
                    onPress={() =>
                      router.push({
                        pathname: '/edit-profile',
                        params: { focusCommercial: 'true' },
                      })
                    }
                  />
                </View>
              ))}
          </View>
        </View>

        {/* OUTSIDE the container: Menu options with extracted buttons */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>Atalhos & Preferências</Text>

          {/* Shortcut to search bakers nearby (Customers only) */}
          {!isBakerRole && (
            <MenuOptionButton
              title="Buscar Confeitarias"
              subtitle="Encontre confeitarias e artesãos de doces próximos a você"
              icon="store-search-outline"
              onPress={() => router.push('/search-bakers')}
            />
          )}

          {/* Saved Recipes Button (Bakers only) */}
          {isBakerRole && (
            <MenuOptionButton
              title="Receitas Salvas"
              subtitle="Suas receitas favoritas guardadas da comunidade"
              icon="bookmark-multiple-outline"
              onPress={() => router.push('/saved-recipes')}
            />
          )}

          {/* Button to visualize how public profile looks (Bakers only) */}
          {isBakerRole && hasBakerProfile ? (
            <MenuOptionButton
              title="Prévia do Perfil Comercial"
              subtitle="Veja exatamente como os clientes visualizam sua página"
              icon="eye-outline"
              onPress={() =>
                router.push({
                  pathname: '/public-profile',
                  params: { id: user?.id },
                })
              }
            />
          ) : null}

          {/* Settings Screen Option */}
          <MenuOptionButton
            title="Configurações"
            subtitle="Aparência, tema e preferências do aplicativo"
            icon="cog-outline"
            onPress={() => router.push('/settings')}
          />

          {/* Log Out Option */}
          <MenuOptionButton
            title="Sair da Conta"
            subtitle="Encerrar sessão com segurança neste dispositivo"
            icon="logout"
            isDestructive={true}
            onPress={handleLogOut}
          />
        </View>

        {isLoading ? (
          <View style={styles.loadingIndicator}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const createStyles = (theme: AppTheme, isDesktop: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      paddingHorizontal: isDesktop ? 32 : theme.spacing.marginMobile,
      paddingTop: isDesktop ? 32 : theme.spacing.marginMobile,
      paddingBottom: isDesktop ? 40 : theme.spacing.space16,
      alignItems: 'center',
    },
    contentWrapper: {
      width: '100%',
      maxWidth: isDesktop ? 960 : 480,
      flexDirection: isDesktop ? 'row' : 'column',
      alignItems: isDesktop ? 'flex-start' : 'center',
      gap: isDesktop ? 24 : theme.spacing.space5,
    },
    card: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.lg,
      paddingVertical: theme.spacing.space6,
      paddingHorizontal: theme.spacing.space5,
      alignItems: 'center',
      width: isDesktop ? undefined : '100%',
      flex: isDesktop ? 0.44 : undefined,
      ...theme.shadows.soft,
    },
    avatarWrapper: {
      alignItems: 'center',
      marginBottom: theme.spacing.space2,
      position: 'relative',
    },
    image: {
      width: 110,
      height: 110,
      borderRadius: theme.rounded.full,
      borderWidth: 3,
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.surfaceContainerLow,
      marginBottom: theme.spacing.space2,
    },
    placeholderImage: {
      backgroundColor: theme.colors.surfaceContainerLow,
      justifyContent: 'center',
      alignItems: 'center',
    },
    publicBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.colors.chips.success.background,
      borderRadius: theme.rounded.full,
      paddingHorizontal: 12,
      paddingVertical: 4,
      alignSelf: 'center',
    },
    chipDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.colors.tertiary,
    },
    publicBadgeText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.chips.success.text,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    privateBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: theme.colors.surfaceContainerHigh,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.full,
      paddingHorizontal: 10,
      paddingVertical: 4,
      alignSelf: 'center',
    },
    privateBadgeText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
      letterSpacing: 0.5,
    },
    userName: {
      fontFamily: theme.typography.headlineLg.fontFamily,
      fontSize: 24,
      fontWeight: '600',
      color: theme.colors.espressoDark,
      textAlign: 'center',
      letterSpacing: 0.6,
      marginTop: theme.spacing.space1,
    },
    roleBadge: {
      backgroundColor: theme.colors.chips.primary.background,
      borderRadius: theme.rounded.full,
      paddingHorizontal: 10,
      paddingVertical: 3,
      marginTop: theme.spacing.space1,
      alignSelf: 'center',
    },
    userRole: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.chips.primary.text,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    emailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: theme.spacing.space2,
    },
    email: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: theme.spacing.space1,
    },
    locationText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurface,
    },
    cardActions: {
      width: '100%',
      marginTop: theme.spacing.space4,
      alignItems: 'center',
      gap: theme.spacing.space2,
    },
    cardButton: {
      width: '100%',
      margin: 0,
      height: 48,
      borderRadius: theme.rounded.default,
    },
    activatePromptContainer: {
      width: '100%',
      backgroundColor: theme.colors.parchment,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.md,
      padding: theme.spacing.space3,
      marginTop: theme.spacing.space1,
      alignItems: 'center',
      gap: theme.spacing.space2,
    },
    activatePromptText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      color: theme.colors.onSurface,
      textAlign: 'center',
      lineHeight: 18,
    },
    menuSection: {
      width: isDesktop ? undefined : '100%',
      flex: isDesktop ? 0.56 : undefined,
      gap: theme.spacing.space3,
    },
    menuSectionTitle: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.espressoDark,
      letterSpacing: 0.5,
      marginLeft: theme.spacing.space1,
      marginBottom: 2,
    },
    loadingIndicator: {
      paddingVertical: theme.spacing.space3,
      alignItems: 'center',
    },
  });
