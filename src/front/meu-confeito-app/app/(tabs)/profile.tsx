import { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
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
  const { bakerProfile, hasBakerProfile, isLoading, refetch } = useMyBakerProfile();

  const styles = useMemo(() => createStyles(theme), [theme]);

  useFocusEffect(
    useCallback(() => {
      refetch().catch((error) => console.error('Error refetching baker profile on focus:', error));
    }, [refetch]),
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

  const isBakerRole = user?.role === 'BAKER';

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
          onRefresh={refetch}
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
              />
            ) : (
              <View style={[styles.image, styles.placeholderImage]}>
                <MaterialCommunityIcons name="account" size={64} color={theme.colors.placeholder} />
              </View>
            )}

            {/* Small Badge indicating Public vs Private Profile */}
            {hasBakerProfile ? (
              <View style={styles.publicBadge}>
                <MaterialCommunityIcons name="earth" size={13} color={theme.colors.primary} />
                <Text style={styles.publicBadgeText}>Perfil Público</Text>
              </View>
            ) : (
              <View style={styles.privateBadge}>
                <MaterialCommunityIcons
                  name="lock-outline"
                  size={13}
                  color={theme.colors.mediumGray}
                />
                <Text style={styles.privateBadgeText}>Perfil Privado</Text>
              </View>
            )}
          </View>

          <Text style={styles.userName}>{user?.name || 'Usuário'}</Text>

          <Text style={styles.userRole}>{isBakerRole ? 'Confeiteira(o)' : 'Cliente'}</Text>

          {user?.email ? (
            <View style={styles.emailRow}>
              <MaterialCommunityIcons
                name="email-outline"
                size={14}
                color={theme.colors.mediumGray}
              />
              <Text style={styles.email}>{user.email}</Text>
            </View>
          ) : null}

          {locationSummary ? (
            <View style={styles.locationRow}>
              <MaterialCommunityIcons
                name="map-marker-outline"
                size={14}
                color={theme.colors.primary}
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

            {hasBakerProfile ? (
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
            ) : isBakerRole ? (
              <View style={styles.activatePromptContainer}>
                <Text style={styles.activatePromptText}>
                  Seu perfil está privado. Torne-o público para divulgar suas receitas e receber
                  encomendas de clientes.
                </Text>
                <CustomButton
                  title="Tornar Perfil Público"
                  variant="dashed"
                  style={styles.cardButton}
                  onPress={() => router.push('/edit-profile')}
                />
              </View>
            ) : null}
          </View>
        </View>

        {/* OUTSIDE the container: Menu options with extracted buttons */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>Atalhos & Preferências</Text>

          {/* Extracted Saved Recipes Button into the new MenuOptionButton component */}
          <MenuOptionButton
            title="Receitas Salvas"
            subtitle="Suas receitas favoritas guardadas da comunidade"
            icon="bookmark-multiple-outline"
            onPress={() => router.push('/saved-recipes')}
          />

          {/* Button to visualize how public profile looks */}
          {hasBakerProfile ? (
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

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 60,
      alignItems: 'center',
    },
    contentWrapper: {
      width: '100%',
      maxWidth: 480,
      gap: 20,
    },
    card: {
      backgroundColor: theme.colors.pitchBackground,
      borderWidth: 1,
      borderColor: theme.colors.secBorder,
      borderRadius: 16,
      paddingVertical: 24,
      paddingHorizontal: 20,
      alignItems: 'center',
      width: '100%',
    },
    avatarWrapper: {
      alignItems: 'center',
      marginBottom: 10,
      position: 'relative',
    },
    image: {
      width: 110,
      height: 110,
      borderRadius: 55,
      borderWidth: 3,
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.lightGray,
      marginBottom: 8,
    },
    placeholderImage: {
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    publicBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.secBorder,
      borderRadius: 9999,
      paddingHorizontal: 10,
      paddingVertical: 4,
      alignSelf: 'center',
    },
    publicBadgeText: {
      fontFamily: 'Inter',
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.primary,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    privateBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.lightGray,
      borderRadius: 9999,
      paddingHorizontal: 10,
      paddingVertical: 4,
      alignSelf: 'center',
    },
    privateBadgeText: {
      fontFamily: 'Inter',
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.darkGray,
      letterSpacing: 0.5,
    },
    userName: {
      fontFamily: 'Playfair Display SC',
      fontSize: 22,
      fontWeight: 'bold',
      color: theme.colors.text,
      textAlign: 'center',
      letterSpacing: 0.5,
      marginTop: 4,
    },
    userRole: {
      fontFamily: 'Inter',
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.primary,
      marginTop: 2,
      textAlign: 'center',
    },
    emailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 6,
    },
    email: {
      fontFamily: 'Inter',
      fontSize: 13,
      color: theme.colors.darkGray,
      textAlign: 'center',
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 4,
    },
    locationText: {
      fontFamily: 'Inter',
      fontSize: 13,
      color: theme.colors.text,
      opacity: 0.8,
    },
    cardActions: {
      width: '100%',
      marginTop: 16,
      alignItems: 'center',
      gap: 10,
    },
    cardButton: {
      width: '100%',
      margin: 0,
      height: 50,
      borderRadius: 10,
    },
    activatePromptContainer: {
      width: '100%',
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.secBorder,
      borderRadius: 10,
      padding: 12,
      marginTop: 6,
      alignItems: 'center',
      gap: 8,
    },
    activatePromptText: {
      fontFamily: 'Inter',
      fontSize: 12,
      color: theme.colors.text,
      textAlign: 'center',
      lineHeight: 18,
      opacity: 0.85,
    },
    menuSection: {
      width: '100%',
      gap: 12,
    },
    menuSectionTitle: {
      fontFamily: 'Inter',
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.darkGray,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginLeft: 4,
      marginBottom: 2,
    },
    loadingIndicator: {
      paddingVertical: 12,
      alignItems: 'center',
    },
  });
