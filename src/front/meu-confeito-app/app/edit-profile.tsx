import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { Stack, router } from 'expo-router';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ActivityIndicator } from 'react-native-paper';

import { CustomButton, Input } from '@/src/components';
import { useAuth } from '@/src/contexts/AuthContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { useDeleteBakerProfile, useSaveBakerProfile } from '@/src/hooks/useBakerProfile';
import { useUserEdit } from '@/src/hooks/useUsers';
import { BakerProfileService } from '@/src/services/baker-profile';
import { UserEditData } from '@/src/services/user';
import { AppTheme } from '@/src/theme/themes';
import {
  BakerProfileLocation,
  BakerProfileRegisterInput,
  BakerProfileUpdateInput,
} from '@/src/types/baker-profile';
import {
  E164_REGEX,
  formatPhoneInput,
  isEmailValid,
  isNameValid,
  toE164,
} from '@/src/utils/validation';

export default function EditProfileScreen() {
  const { theme } = useThemeMode();
  const { user, updateUser } = useAuth();
  const isBakerRole = user?.role?.trim().toUpperCase() === 'BAKER';

  const { editUser, isLoading: isLoadingUserEdit } = useUserEdit();
  const [isLoadingInitialBaker, setIsLoadingInitialBaker] = useState<boolean>(isBakerRole);
  const [isTogglingPublic, setIsTogglingPublic] = useState<boolean>(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState<boolean>(false);

  const { saveBakerProfile, isSaving: isSavingBakerProfile } = useSaveBakerProfile();
  const { deleteBakerProfile, isDeleting: isDeletingBakerProfile } = useDeleteBakerProfile();

  // Basic user state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(formatPhoneInput(user?.phone || ''));

  // Baker profile state (Public Profile)
  const [isPublicProfile, setIsPublicProfile] = useState<boolean>(false);
  const [hasInitialBakerProfile, setHasInitialBakerProfile] = useState<boolean>(false);
  const [bio, setBio] = useState('');
  const [instagram, setInstagram] = useState('');
  const [city, setCity] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [locationCoords, setLocationCoords] = useState<BakerProfileLocation | null>(null);

  const [touched, setTouched] = useState({
    name: false,
    email: false,
    phone: false,
  });

  // Populate baker profile fields once loaded asynchronously
  useEffect(() => {
    let isMounted = true;

    if (!isBakerRole) {
      return;
    }

    async function loadBakerData() {
      try {
        const response = await BakerProfileService.getMyProfile();
        if (isMounted && response?.data?.bakerProfile) {
          const profile = response.data.bakerProfile;
          setIsPublicProfile(true);
          setHasInitialBakerProfile(true);
          setBio(profile.bio || '');
          setInstagram(profile.instagram || '');
          setCity(profile.city || '');
          setNeighborhood(profile.neighborhood || '');
          if (profile.location) {
            setLocationCoords({
              latitude: profile.location.latitude,
              longitude: profile.location.longitude,
            });
          }
        }
      } catch {
        if (isMounted) {
          setIsPublicProfile(false);
          setHasInitialBakerProfile(false);
        }
      } finally {
        if (isMounted) {
          setIsLoadingInitialBaker(false);
        }
      }
    }

    loadBakerData();

    return () => {
      isMounted = false;
    };
  }, [isBakerRole]);

  const styles = useMemo(() => createStyles(theme), [theme]);

  const isGlobalLoading =
    isLoadingInitialBaker ||
    isLoadingUserEdit ||
    isSavingBakerProfile ||
    isDeletingBakerProfile ||
    isTogglingPublic;

  const handlePhoneChange = (text: string) => {
    if (text.length < phone.length) {
      const rawClean = text.replace(/[^\d+]/g, '');
      setPhone(formatPhoneInput(rawClean));
      return;
    }
    setPhone(formatPhoneInput(text));
  };

  const isNameFieldValid = isNameValid(name);
  const isEmailFieldValid = isEmailValid(email);
  const isPhoneFieldValid = !phone.trim() || E164_REGEX.test(toE164(phone));
  const hasLocationCoords = Boolean(locationCoords);

  const nameError = useMemo(() => {
    if (!touched.name) return '';
    if (!name.trim()) return 'Nome completo é obrigatório.';
    if (!isNameFieldValid) return 'O nome deve ter pelo menos 3 caracteres.';
    return '';
  }, [isNameFieldValid, name, touched.name]);

  const emailError = useMemo(() => {
    if (!touched.email) return '';
    if (!email.trim()) return 'E-mail é obrigatório.';
    if (!isEmailFieldValid) return 'Informe um e-mail válido (ex: seu@email.com).';
    return '';
  }, [email, isEmailFieldValid, touched.email]);

  const phoneError = useMemo(() => {
    if (!touched.phone && !(isBakerRole && isPublicProfile)) return '';
    if (isBakerRole && isPublicProfile && !phone.trim()) {
      return 'Telefone é obrigatório para perfil comercial.';
    }
    if (phone.trim() && !E164_REGEX.test(toE164(phone))) {
      return 'Telefone incompleto ou inválido. Ex: (11) 99999-9999.';
    }
    return '';
  }, [isBakerRole, isPublicProfile, phone, touched.phone]);

  // Handles intuitive location detection using expo-location
  const handleFetchLocation = async () => {
    try {
      setIsFetchingLocation(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permissão de Localização',
          'A permissão de localização é necessária para capturar suas coordenadas e preencher cidade e bairro automaticamente.',
        );
        return;
      }

      const currentPosition = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords: BakerProfileLocation = {
        latitude: currentPosition.coords.latitude,
        longitude: currentPosition.coords.longitude,
      };
      setLocationCoords(coords);

      // Automatically fill city and neighborhood via reverse geocoding
      try {
        const addresses = await Location.reverseGeocodeAsync(coords);
        if (addresses && addresses.length > 0) {
          const addr = addresses[0];
          const detectedCity = addr.city || addr.subregion || '';
          const detectedNeighborhood = addr.district || addr.subregion || addr.street || '';

          if (detectedCity) {
            setCity(detectedCity);
          }
          if (detectedNeighborhood) {
            setNeighborhood(detectedNeighborhood);
          }

          Alert.alert(
            'Localização Identificada',
            `Coordenadas obtidas com sucesso!\n\nCidade: ${detectedCity || 'Não informada'}\nBairro: ${detectedNeighborhood || 'Não informado'}`,
          );
        } else {
          Alert.alert('Coordenadas Obtidas', 'Coordenadas GPS registradas com sucesso.');
        }
      } catch (geocodeError) {
        console.warn('Geocoding error:', geocodeError);
        Alert.alert('Coordenadas Obtidas', 'Coordenadas GPS registradas com sucesso.');
      }
    } catch (error) {
      console.error('Error fetching location:', error);
      Alert.alert(
        'Erro na Localização',
        'Não foi possível obter sua localização atual via GPS. Verifique se o GPS está ativado.',
      );
    } finally {
      setIsFetchingLocation(false);
    }
  };

  const handleClearLocation = () => {
    Alert.alert(
      'Remover Coordenadas',
      'Deseja remover as coordenadas GPS da sua confeitaria? (A cidade e o bairro permanecerão)',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover GPS',
          style: 'destructive',
          onPress: () => setLocationCoords(null),
        },
      ],
    );
  };

  // Immediate profile creation upon clicking to make profile public
  const handleTogglePublicProfile = (targetValue: boolean) => {
    if (targetValue) {
      const rawCleanPhone = phone.trim();
      if (!rawCleanPhone) {
        Alert.alert(
          'Telefone Necessário',
          'Para ativar seu perfil público de confeiteiro, é necessário cadastrar um telefone ou WhatsApp comercial para que seus clientes possam entrar em contato.',
          [
            {
              text: 'Preencher Telefone',
              onPress: () => setTouched((prev) => ({ ...prev, phone: true })),
            },
          ],
        );
        return;
      }

      if (!E164_REGEX.test(toE164(rawCleanPhone))) {
        Alert.alert(
          'Telefone Inválido',
          'Por favor, informe um telefone válido com DDD antes de ativar o perfil público.',
        );
        return;
      }

      Alert.alert(
        'Tornar Perfil Público?',
        'Ao ativar o perfil público, seu perfil comercial será criado e publicado imediatamente na plataforma. Suas informações comerciais (nome, bio, Instagram, localização e telefone) ficarão visíveis para todos os clientes.\n\nSeu e-mail permanecerá sempre confidencial. Deseja continuar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Ativar Imediatamente',
            onPress: async () => {
              try {
                setIsTogglingPublic(true);

                // 1. Ensure phone is persisted to user account first if changed
                const formattedPhone = toE164(rawCleanPhone);
                const userPayload: UserEditData = {};
                if (formattedPhone !== user?.phone) {
                  userPayload.phone = formattedPhone;
                }
                if (name.trim() && name.trim() !== user?.name) {
                  userPayload.name = name.trim();
                }

                if (Object.keys(userPayload).length > 0) {
                  const res = await editUser(userPayload, user!.id);
                  if (res?.data?.user) {
                    await updateUser(res.data.user);
                  } else {
                    await updateUser(userPayload);
                  }
                }

                // 2. Immediately send create request to API
                const createData: BakerProfileRegisterInput = {
                  bio: bio.trim() || null,
                  instagram: instagram.trim() ? instagram.trim().replace(/^@/, '') : null,
                  city: city.trim() || null,
                  neighborhood: neighborhood.trim() || null,
                  location: locationCoords || null,
                };

                await saveBakerProfile(createData, false);
                setIsPublicProfile(true);
                setHasInitialBakerProfile(true);

                Alert.alert(
                  'Perfil Público Ativado!',
                  'Seu perfil comercial foi criado com sucesso e agora está público! Você pode preencher mais informações abaixo e salvá-las.',
                );
              } catch (err) {
                console.error('Error creating public profile immediately:', err);
                Alert.alert(
                  'Erro ao Ativar',
                  'Não foi possível ativar seu perfil comercial no momento. Tente novamente.',
                );
              } finally {
                setIsTogglingPublic(false);
              }
            },
          },
        ],
      );
    } else {
      // Deactivating public profile immediately
      if (hasInitialBakerProfile) {
        Alert.alert(
          'Tornar Perfil Privado?',
          'Ao desativar seu perfil público, sua página comercial deixará de ser encontrada pelos clientes imediatamente. Suas informações públicas serão desativadas.',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Desativar e Tornar Privado',
              style: 'destructive',
              onPress: async () => {
                try {
                  setIsTogglingPublic(true);
                  await deleteBakerProfile();
                  setIsPublicProfile(false);
                  setHasInitialBakerProfile(false);
                  Alert.alert('Perfil Privado', 'Seu perfil foi desativado e agora está privado.');
                } catch (err) {
                  console.error('Error deactivating baker profile immediately:', err);
                  Alert.alert(
                    'Erro ao Desativar',
                    'Não foi possível desativar o perfil público. Tente novamente.',
                  );
                } finally {
                  setIsTogglingPublic(false);
                }
              },
            },
          ],
        );
      } else {
        setIsPublicProfile(false);
      }
    }
  };

  // The save button only serves to update profile information
  async function handleEdit() {
    setTouched({ name: true, email: true, phone: true });

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const formattedPhone = phone.trim() ? toE164(phone) : null;

    if (!trimmedName || trimmedName.length < 3) {
      Alert.alert('Nome inválido', 'O nome deve conter ao menos 3 caracteres.');
      return;
    }

    if (!isEmailValid(trimmedEmail)) {
      Alert.alert('E-mail inválido', 'Informe um e-mail em formato válido.');
      return;
    }

    if (isBakerRole && isPublicProfile && !formattedPhone) {
      Alert.alert(
        'Telefone obrigatório',
        'Para manter o perfil público ativo, é obrigatório cadastrar um telefone de contato.',
      );
      return;
    }

    if (phone.trim() && !E164_REGEX.test(toE164(phone))) {
      Alert.alert(
        'Telefone inválido',
        'O telefone deve estar em formato válido com DDD (ex: (11) 99999-9999).',
      );
      return;
    }

    if (isBakerRole && isPublicProfile) {
      if (bio.length > 500) {
        Alert.alert('Bio muito longa', 'A bio deve ter no máximo 500 caracteres.');
        return;
      }
      if (instagram.length > 100) {
        Alert.alert('Instagram inválido', 'O Instagram deve ter no máximo 100 caracteres.');
        return;
      }
      if (city.length > 100) {
        Alert.alert('Cidade inválida', 'O nome da cidade deve ter no máximo 100 caracteres.');
        return;
      }
      if (neighborhood.length > 100) {
        Alert.alert('Bairro inválido', 'O nome do bairro deve ter no máximo 100 caracteres.');
        return;
      }
    }

    try {
      // 1. Update basic user details if changed
      const userData: UserEditData = {};
      if (trimmedName !== user?.name) {
        userData.name = trimmedName;
      }
      if (trimmedEmail !== user?.email) {
        userData.email = trimmedEmail;
      }
      if (formattedPhone !== (user?.phone ?? null)) {
        userData.phone = formattedPhone;
      }

      if (Object.keys(userData).length > 0) {
        const response = await editUser(userData, user!.id);
        if (response?.data?.user) {
          await updateUser(response.data.user);
        } else {
          await updateUser(userData);
        }
      }

      // 2. The save button updates the public baker profile if it exists
      if (isBakerRole && isPublicProfile && hasInitialBakerProfile) {
        const profileUpdate: BakerProfileUpdateInput = {
          bio: bio.trim() || null,
          instagram: instagram.trim() ? instagram.trim().replace(/^@/, '') : null,
          city: city.trim() || null,
          neighborhood: neighborhood.trim() || null,
          location: locationCoords ?? null,
        };

        await saveBakerProfile(profileUpdate, true);
      }

      Alert.alert('Perfil Atualizado', 'Suas alterações foram atualizadas com sucesso!', [
        {
          text: 'OK',
          onPress: () => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.push('/(tabs)/profile');
            }
          },
        },
      ]);
    } catch (error: unknown) {
      console.error('Error updating profile: ', error);
      Alert.alert('Erro ao Salvar', 'Não foi possível salvar as alterações. Tente novamente.');
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Editar Perfil' }} />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets
        >
          <View style={styles.formWrapper}>
            {/* Account Information Card */}
            <View style={styles.card}>
              <View style={styles.avatarContainer}>
                {user?.pfpUrl ? (
                  <Image
                    source={{ uri: user?.pfpUrl }}
                    alt="Foto de Perfil"
                    style={styles.image}
                    contentFit="cover"
                  />
                ) : (
                  <View style={[styles.image, styles.placeholderImage]}>
                    <MaterialCommunityIcons
                      name="account"
                      size={64}
                      color={theme.colors.onSurfaceVariant}
                    />
                  </View>
                )}
                <Text style={styles.userName}>{user?.name}</Text>
                <Text style={styles.userRole}>{isBakerRole ? 'Confeiteira(o)' : 'Cliente'}</Text>
              </View>

              <Text style={styles.cardSectionHeader}>Informações da Conta</Text>

              {/* Name input */}
              <View style={styles.fieldWrapper}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>
                    Nome completo <Text style={styles.required}>*</Text>
                  </Text>
                  {touched.name && isNameFieldValid && (
                    <MaterialCommunityIcons
                      name="check-circle-outline"
                      size={16}
                      color={theme.colors.success}
                    />
                  )}
                </View>
                <Input
                  value={name}
                  placeholder="Nome completo (mín. 3 caracteres)"
                  autoCapitalize="words"
                  autoCorrect={false}
                  onChangeText={setName}
                  onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
                  containerStyle={[
                    styles.inputContainer,
                    !!nameError && styles.inputError,
                    touched.name && isNameFieldValid && styles.inputSuccess,
                  ]}
                  style={styles.inputText}
                  placeholderTextColor={theme.colors.placeholder}
                />
                <View style={styles.helperRow}>
                  {nameError ? (
                    <>
                      <MaterialCommunityIcons
                        name="alert-circle-outline"
                        size={14}
                        color={theme.colors.error}
                        style={styles.helperIcon}
                      />
                      <Text style={styles.errorText}>{nameError}</Text>
                    </>
                  ) : (
                    <Text style={styles.helperText}>Mínimo de 3 caracteres</Text>
                  )}
                </View>
              </View>

              {/* Email input (Private account data) */}
              <View style={styles.fieldWrapper}>
                <View style={styles.labelRow}>
                  <View style={styles.labelWithIcon}>
                    <Text style={styles.label}>
                      E-mail <Text style={styles.required}>*</Text>
                    </Text>
                    <MaterialCommunityIcons
                      name="lock-outline"
                      size={14}
                      color={theme.colors.onSurfaceVariant}
                    />
                  </View>
                  {touched.email && isEmailFieldValid && (
                    <MaterialCommunityIcons
                      name="check-circle-outline"
                      size={16}
                      color={theme.colors.success}
                    />
                  )}
                </View>
                <Input
                  value={email}
                  placeholder="exemplo@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onChangeText={setEmail}
                  onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                  containerStyle={[
                    styles.inputContainer,
                    !!emailError && styles.inputError,
                    touched.email && isEmailFieldValid && styles.inputSuccess,
                  ]}
                  style={styles.inputText}
                  placeholderTextColor={theme.colors.placeholder}
                />
                <View style={styles.helperRow}>
                  {emailError ? (
                    <>
                      <MaterialCommunityIcons
                        name="alert-circle-outline"
                        size={14}
                        color={theme.colors.error}
                        style={styles.helperIcon}
                      />
                      <Text style={styles.errorText}>{emailError}</Text>
                    </>
                  ) : (
                    <Text style={styles.helperText}>Confidencial: nunca exibido publicamente</Text>
                  )}
                </View>
              </View>

              {/* Phone input */}
              <View style={styles.fieldWrapper}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>
                    {isBakerRole ? 'Telefone / WhatsApp Comercial' : 'Telefone'}{' '}
                    {isBakerRole && isPublicProfile ? <Text style={styles.required}>*</Text> : null}
                  </Text>
                  {touched.phone && phone.trim() && isPhoneFieldValid && (
                    <MaterialCommunityIcons
                      name="check-circle-outline"
                      size={16}
                      color={theme.colors.success}
                    />
                  )}
                </View>
                <Input
                  value={phone}
                  placeholder="(11) 99999-9999"
                  keyboardType="phone-pad"
                  onChangeText={handlePhoneChange}
                  onBlur={() => setTouched((prev) => ({ ...prev, phone: true }))}
                  containerStyle={[
                    styles.inputContainer,
                    !!phoneError && styles.inputError,
                    touched.phone && phone.trim() && isPhoneFieldValid && styles.inputSuccess,
                  ]}
                  style={styles.inputText}
                  placeholderTextColor={theme.colors.placeholder}
                />
                <View style={styles.helperRow}>
                  {phoneError ? (
                    <>
                      <MaterialCommunityIcons
                        name="alert-circle-outline"
                        size={14}
                        color={theme.colors.error}
                        style={styles.helperIcon}
                      />
                      <Text style={styles.errorText}>{phoneError}</Text>
                    </>
                  ) : (
                    <Text style={styles.helperText}>
                      {isBakerRole && isPublicProfile
                        ? 'Obrigatório: clientes poderão enviar mensagem no WhatsApp'
                        : 'Opcional. Formato com DDD: (XX) 9XXXX-XXXX'}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Baker Profile / Public Profile Card */}
            {isBakerRole ? (
              <View style={styles.card}>
                <View style={styles.publicHeaderRow}>
                  <View style={styles.publicTitleWrapper}>
                    <Text style={styles.cardSectionHeader}>Perfil Comercial de Confeiteiro</Text>
                    <Text style={styles.publicSubtitle}>
                      Tornar seu perfil público para clientes
                    </Text>
                  </View>

                  <Switch
                    value={isPublicProfile}
                    onValueChange={handleTogglePublicProfile}
                    disabled={isTogglingPublic}
                    thumbColor={
                      isPublicProfile ? theme.colors.primary : theme.colors.surfaceContainerHighest
                    }
                    trackColor={{
                      false: theme.colors.outlineVariant,
                      true: theme.colors.primaryContainer,
                    }}
                  />
                </View>

                {/* Status Alert Banner */}
                {isPublicProfile ? (
                  <View style={styles.alertBannerPublic}>
                    <MaterialCommunityIcons
                      name="earth"
                      size={20}
                      color={theme.colors.primary}
                      style={styles.alertBannerIcon}
                    />
                    <View style={styles.alertBannerTextContainer}>
                      <Text style={styles.alertBannerTitle}>Seu perfil está público</Text>
                      <Text style={styles.alertBannerText}>
                        As informações abaixo e suas receitas estão visíveis para todos os clientes
                        no Meu Confeito. Seu e-mail permanece estritamente privado.
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.alertBannerPrivate}>
                    <MaterialCommunityIcons
                      name="lock-outline"
                      size={20}
                      color={theme.colors.onSurfaceVariant}
                      style={styles.alertBannerIcon}
                    />
                    <View style={styles.alertBannerTextContainer}>
                      <Text style={styles.alertBannerTitlePrivate}>Perfil Privado</Text>
                      <Text style={styles.alertBannerText}>
                        Ative o botão acima para criar e publicar seu perfil de confeiteiro,
                        permitindo que clientes encontrem suas receitas e façam encomendas.
                      </Text>
                    </View>
                  </View>
                )}

                {/* Preview button */}
                {isPublicProfile && (
                  <TouchableOpacity
                    style={styles.previewBtn}
                    onPress={() =>
                      router.push({
                        pathname: '/public-profile',
                        params: { id: user?.id },
                      })
                    }
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel="Visualizar perfil público"
                  >
                    <MaterialCommunityIcons
                      name="eye-outline"
                      size={18}
                      color={theme.colors.primary}
                    />
                    <Text style={styles.previewBtnText}>Visualizar como os clientes veem</Text>
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={18}
                      color={theme.colors.primary}
                    />
                  </TouchableOpacity>
                )}

                {/* Fields for public profile */}
                {isPublicProfile && (
                  <>
                    {/* Location Section handled by expo-location */}
                    <View style={styles.locationSection}>
                      <View style={styles.locationHeaderRow}>
                        <View style={styles.labelWithIcon}>
                          <MaterialCommunityIcons
                            name="crosshairs-gps"
                            size={16}
                            color={theme.colors.primary}
                          />
                          <Text style={styles.label}>Localização Geográfica (GPS)</Text>
                        </View>
                        {hasLocationCoords ? (
                          <TouchableOpacity
                            onPress={handleClearLocation}
                            style={styles.clearLocationBtn}
                            accessibilityRole="button"
                            accessibilityLabel="Remover coordenadas GPS"
                          >
                            <Text style={styles.clearLocationText}>Remover GPS</Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>

                      <TouchableOpacity
                        style={styles.fetchLocationBtn}
                        onPress={handleFetchLocation}
                        disabled={isFetchingLocation}
                        activeOpacity={0.8}
                        accessibilityRole="button"
                        accessibilityLabel="Obter localização atual via GPS"
                      >
                        {isFetchingLocation ? (
                          <ActivityIndicator size="small" color={theme.colors.primary} />
                        ) : (
                          <MaterialCommunityIcons
                            name="map-marker-radius-outline"
                            size={20}
                            color={theme.colors.primary}
                          />
                        )}
                        <Text style={styles.fetchLocationBtnText}>
                          {isFetchingLocation
                            ? 'Detectando localização...'
                            : hasLocationCoords
                              ? 'Atualizar Localização via GPS'
                              : 'Obter Localização Atual via GPS'}
                        </Text>
                      </TouchableOpacity>

                      {locationCoords ? (
                        <View style={styles.gpsCoordsBadge}>
                          <MaterialCommunityIcons
                            name="check-circle"
                            size={14}
                            color={theme.colors.chips.success.text}
                          />
                          <Text style={styles.gpsCoordsText}>
                            GPS ativo: {locationCoords.latitude.toFixed(4)},{' '}
                            {locationCoords.longitude.toFixed(4)}
                          </Text>
                        </View>
                      ) : (
                        <Text style={styles.helperText}>
                          O GPS preenche Cidade e Bairro e permite que clientes encontrem sua
                          confeitaria por proximidade.
                        </Text>
                      )}
                    </View>

                    {/* City input */}
                    <View style={styles.fieldWrapper}>
                      <View style={styles.labelRow}>
                        <Text style={styles.label}>Cidade</Text>
                      </View>
                      <Input
                        value={city}
                        placeholder="Ex: São Paulo"
                        autoCapitalize="words"
                        maxLength={100}
                        onChangeText={setCity}
                        containerStyle={styles.inputContainer}
                        style={styles.inputText}
                        placeholderTextColor={theme.colors.placeholder}
                        leftIcon={
                          <MaterialCommunityIcons
                            name="city-variant-outline"
                            size={20}
                            color={theme.colors.onSurfaceVariant}
                          />
                        }
                      />
                    </View>

                    {/* Neighborhood input */}
                    <View style={styles.fieldWrapper}>
                      <View style={styles.labelRow}>
                        <Text style={styles.label}>Bairro</Text>
                      </View>
                      <Input
                        value={neighborhood}
                        placeholder="Ex: Pinheiros"
                        autoCapitalize="words"
                        maxLength={100}
                        onChangeText={setNeighborhood}
                        containerStyle={styles.inputContainer}
                        style={styles.inputText}
                        placeholderTextColor={theme.colors.placeholder}
                        leftIcon={
                          <MaterialCommunityIcons
                            name="map-marker-outline"
                            size={20}
                            color={theme.colors.onSurfaceVariant}
                          />
                        }
                      />
                    </View>

                    {/* Bio input */}
                    <View style={styles.fieldWrapper}>
                      <View style={styles.labelRow}>
                        <Text style={styles.label}>Sobre a Confeitaria / Bio</Text>
                        <Text style={styles.charCounter}>{bio.length}/500</Text>
                      </View>
                      <Input
                        value={bio}
                        placeholder="Conte aos clientes sobre sua história, receitas especiais, encomendas e paixão pela confeitaria..."
                        multiline
                        numberOfLines={4}
                        maxLength={500}
                        onChangeText={setBio}
                        containerStyle={styles.textAreaContainer}
                        style={styles.textArea}
                        placeholderTextColor={theme.colors.placeholder}
                      />
                      <Text style={styles.helperText}>Máximo de 500 caracteres</Text>
                    </View>

                    {/* Instagram handle */}
                    <View style={styles.fieldWrapper}>
                      <View style={styles.labelRow}>
                        <Text style={styles.label}>Instagram Comercial</Text>
                      </View>
                      <Input
                        value={instagram}
                        placeholder="@suaconfeitaria"
                        autoCapitalize="none"
                        autoCorrect={false}
                        maxLength={100}
                        onChangeText={setInstagram}
                        containerStyle={styles.inputContainer}
                        style={styles.inputText}
                        placeholderTextColor={theme.colors.placeholder}
                        leftIcon={
                          <MaterialCommunityIcons
                            name="instagram"
                            size={20}
                            color={theme.colors.onSurfaceVariant}
                          />
                        }
                      />
                      <Text style={styles.helperText}>
                        Ex: @atelierdedoces (link direto para seu perfil)
                      </Text>
                    </View>
                  </>
                )}
              </View>
            ) : null}

            {/* Save Button - Only serves to update information */}
            <View style={styles.btnActionContainer}>
              {isGlobalLoading ? (
                <ActivityIndicator size="large" color={theme.colors.primary} />
              ) : (
                <CustomButton
                  title="Salvar alterações"
                  variant="primary"
                  style={styles.button}
                  onPress={handleEdit}
                />
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
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
      justifyContent: 'flex-start',
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 80,
    },
    formWrapper: {
      width: '100%',
      maxWidth: 480,
      gap: 16,
    },
    card: {
      width: '100%',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.rounded.lg,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      ...theme.shadows.soft,
      gap: 16,
    },
    avatarContainer: {
      alignItems: 'center',
      marginBottom: 6,
    },
    image: {
      width: 110,
      height: 110,
      borderRadius: 55,
      borderWidth: 3,
      borderColor: theme.colors.primary,
      marginBottom: 8,
    },
    placeholderImage: {
      backgroundColor: theme.colors.surfaceContainerLow,
      justifyContent: 'center',
      alignItems: 'center',
    },
    userName: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.espressoDark,
      textAlign: 'center',
    },
    userRole: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 13,
      color: theme.colors.primary,
      fontWeight: '600',
      marginTop: 2,
    },
    cardSectionHeader: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.espressoDark,
      marginTop: 4,
    },
    publicHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    publicTitleWrapper: {
      flex: 1,
      marginRight: 12,
    },
    publicSubtitle: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
    },
    alertBannerPublic: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: theme.colors.parchment,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.md,
      padding: 12,
      gap: 10,
    },
    alertBannerPrivate: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.md,
      padding: 12,
      gap: 10,
    },
    alertBannerIcon: {
      marginTop: 2,
    },
    alertBannerTextContainer: {
      flex: 1,
    },
    alertBannerTitle: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.espressoDark,
      marginBottom: 2,
    },
    alertBannerTitlePrivate: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.espressoDark,
      marginBottom: 2,
    },
    alertBannerText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 16,
    },
    previewBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.default,
      paddingHorizontal: 14,
      paddingVertical: 12,
      minHeight: 48,
    },
    previewBtnText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.primary,
      flex: 1,
      marginLeft: 8,
    },
    locationSection: {
      width: '100%',
      gap: 10,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.md,
      padding: 12,
    },
    locationHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    clearLocationBtn: {
      minHeight: 48,
      justifyContent: 'center',
      paddingVertical: 4,
      paddingHorizontal: 8,
    },
    clearLocationText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.error,
    },
    fetchLocationBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.default,
      paddingVertical: 12,
      paddingHorizontal: 16,
      minHeight: 48,
      ...theme.shadows.soft,
    },
    fetchLocationBtnText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    gpsCoordsBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.colors.chips.success.background,
      borderRadius: theme.rounded.sm,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: theme.colors.tertiaryFixed,
      alignSelf: 'flex-start',
    },
    gpsCoordsText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.chips.success.text,
    },
    fieldWrapper: {
      width: '100%',
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 2,
    },
    labelWithIcon: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    label: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.espressoDark,
    },
    required: {
      color: theme.colors.primary,
    },
    charCounter: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
    },
    inputContainer: {
      width: '100%',
      height: 52,
      minHeight: 48,
      margin: 0,
      marginTop: 4,
      paddingLeft: 14,
      paddingRight: 14,
      borderRadius: theme.rounded.default,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surfaceContainerLowest,
    },
    textAreaContainer: {
      width: '100%',
      minHeight: 100,
      margin: 0,
      marginTop: 4,
      paddingLeft: 14,
      paddingRight: 14,
      paddingVertical: 10,
      borderRadius: theme.rounded.default,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surfaceContainerLowest,
    },
    inputError: {
      borderColor: theme.colors.error,
      borderWidth: 1.5,
    },
    inputSuccess: {
      borderColor: theme.colors.success,
    },
    inputText: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 15,
      color: theme.colors.text,
    },
    textArea: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 14,
      color: theme.colors.text,
      textAlignVertical: 'top',
      lineHeight: 20,
    },
    helperRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
      minHeight: 16,
    },
    helperIcon: {
      marginRight: 4,
    },
    helperText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
    },
    errorText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 11,
      color: theme.colors.error,
      fontWeight: '500',
    },
    btnActionContainer: {
      marginTop: 10,
      alignItems: 'center',
      width: '100%',
    },
    button: {
      width: '100%',
      margin: 0,
      borderRadius: theme.rounded.default,
      minHeight: 48,
      height: 52,
    },
  });
