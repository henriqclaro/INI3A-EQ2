import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import * as Location from 'expo-location';
import { Stack, router, useLocalSearchParams } from 'expo-router';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {
  KeyboardAwareScrollView,
  KeyboardAwareScrollViewRef,
} from 'react-native-keyboard-controller';
import { ActivityIndicator } from 'react-native-paper';

import {
  BakerTagSelector,
  CustomButton,
  Input,
  ShowcaseManager,
  ThemeSwitch,
} from '@/src/components';
import { UserAvatar } from '@/src/components/common/UserAvatar';
import { useAuth } from '@/src/contexts/AuthContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { useDeleteBakerProfile, useSaveBakerProfile } from '@/src/hooks/useBakerProfile';
import { useUserEdit } from '@/src/hooks/useUsers';
import { BakerProfileService } from '@/src/services/baker-profile';
import { UserEditData, UserService } from '@/src/services/user';
import { AppTheme } from '@/src/theme/themes';
import {
  BakerProfileLocation,
  BakerProfileRegisterInput,
  BakerProfileUpdateInput,
  BakerTag,
} from '@/src/types/baker-profile';
import {
  ProcessedImage,
  clearImageCache,
  createImageFormData,
  getStorageUrl,
  pickAvatarImage,
} from '@/src/utils/image';
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

  const { focusCommercial } = useLocalSearchParams<{ focusCommercial?: string }>();
  const isFocusCommercial = focusCommercial === 'true';

  const scrollViewRef = useRef<KeyboardAwareScrollViewRef>(null);
  const [blinkAnim] = useState(() => new Animated.Value(0));

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
  const [avatarUrl, setAvatarUrl] = useState(user?.pfpUrl || '');
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<ProcessedImage | null>(null);
  const [hasRemovedAvatar, setHasRemovedAvatar] = useState<boolean>(false);
  const [isPickingAvatar, setIsPickingAvatar] = useState<boolean>(false);

  // Baker profile state (Public Profile)
  const [isPublicProfile, setIsPublicProfile] = useState<boolean>(false);
  const [hasInitialBakerProfile, setHasInitialBakerProfile] = useState<boolean>(false);
  const [publicName, setPublicName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [bio, setBio] = useState('');
  const [instagram, setInstagram] = useState('');
  const [city, setCity] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [locationCoords, setLocationCoords] = useState<BakerProfileLocation | null>(null);
  const [selectedTags, setSelectedTags] = useState<BakerTag[]>([]);

  const [touched, setTouched] = useState({
    name: false,
    email: false,
    phone: false,
    whatsapp: false,
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
          setPublicName(profile.publicName || '');
          setWhatsapp(profile.whatsapp ? formatPhoneInput(profile.whatsapp) : '');
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
          if (profile.tags && Array.isArray(profile.tags)) {
            setSelectedTags(profile.tags);
          }
        }
      } catch {
        if (isMounted) {
          setIsPublicProfile(false);
          setHasInitialBakerProfile(false);
          setPublicName('');
          setWhatsapp('');
          setSelectedTags([]);
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

  useEffect(() => {
    if (!isFocusCommercial || isLoadingInitialBaker) {
      return;
    }

    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });

      Animated.sequence([
        Animated.timing(blinkAnim, { toValue: 1, duration: 250, useNativeDriver: false }),
        Animated.timing(blinkAnim, { toValue: 0, duration: 250, useNativeDriver: false }),
        Animated.timing(blinkAnim, { toValue: 1, duration: 250, useNativeDriver: false }),
        Animated.timing(blinkAnim, { toValue: 0, duration: 250, useNativeDriver: false }),
        Animated.timing(blinkAnim, { toValue: 1, duration: 250, useNativeDriver: false }),
        Animated.timing(blinkAnim, { toValue: 0, duration: 350, useNativeDriver: false }),
      ]).start();
    }, 250);

    return () => clearTimeout(timer);
  }, [blinkAnim, isFocusCommercial, isLoadingInitialBaker]);

  const styles = useMemo(() => createStyles(theme), [theme]);

  const isGlobalLoading =
    isLoadingInitialBaker ||
    isLoadingUserEdit ||
    isSavingBakerProfile ||
    isDeletingBakerProfile ||
    isTogglingPublic ||
    isPickingAvatar;

  const handlePickAvatar = async () => {
    setIsPickingAvatar(true);
    try {
      const processed = await pickAvatarImage();
      if (processed) {
        setSelectedAvatarFile(processed);
        setAvatarUrl(processed.uri);
        setHasRemovedAvatar(false);
      }
    } finally {
      setIsPickingAvatar(false);
    }
  };

  const handleRemoveAvatar = () => {
    Alert.alert('Remover Foto de Perfil', 'Tem certeza de que deseja remover sua foto de perfil?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: () => {
          setSelectedAvatarFile(null);
          setAvatarUrl('');
          setHasRemovedAvatar(true);
        },
      },
    ]);
  };

  const handleAvatarPress = () => {
    if (avatarUrl.trim()) {
      Alert.alert('Foto de Perfil', 'O que deseja fazer com sua foto de perfil?', [
        {
          text: 'Escolher Nova Foto',
          onPress: handlePickAvatar,
        },
        {
          text: 'Remover Foto',
          style: 'destructive',
          onPress: handleRemoveAvatar,
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ]);
    } else {
      handlePickAvatar();
    }
  };

  const handlePhoneChange = (text: string) => {
    if (text.length < phone.length) {
      const rawClean = text.replace(/[^\d+]/g, '');
      setPhone(formatPhoneInput(rawClean));
      return;
    }
    setPhone(formatPhoneInput(text));
  };

  const handleWhatsAppChange = (text: string) => {
    if (text.length < whatsapp.length) {
      const rawClean = text.replace(/[^\d+]/g, '');
      setWhatsapp(formatPhoneInput(rawClean));
      return;
    }
    setWhatsapp(formatPhoneInput(text));
  };

  const isPhoneRequired = isBakerRole && isPublicProfile;
  const isNameFieldValid = isNameValid(name);
  const isEmailFieldValid = isEmailValid(email);
  const isPhoneFieldValid = isPhoneRequired
    ? Boolean(phone.trim()) && E164_REGEX.test(toE164(phone))
    : !phone.trim() || E164_REGEX.test(toE164(phone));
  const isWhatsAppFieldValid = !whatsapp.trim() || E164_REGEX.test(toE164(whatsapp));
  const hasLocationCoords = Boolean(locationCoords);

  const isNameSuccess = Boolean(touched.name && isNameFieldValid);
  const isEmailSuccess = Boolean(touched.email && isEmailFieldValid);
  const isPhoneSuccess = Boolean(touched.phone && phone.trim() && isPhoneFieldValid);
  const isWhatsAppSuccess = Boolean(touched.whatsapp && whatsapp.trim() && isWhatsAppFieldValid);

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
    if (!touched.phone && !isPhoneRequired) return '';
    if (isPhoneRequired && !phone.trim()) {
      return 'Telefone de validação é obrigatório para manter o perfil comercial.';
    }
    if (phone.trim() && !E164_REGEX.test(toE164(phone))) {
      return 'Telefone incompleto ou inválido. Ex: (11) 99999-9999.';
    }
    return '';
  }, [isPhoneRequired, phone, touched.phone]);

  const whatsAppError = useMemo(() => {
    if (!touched.whatsapp) return '';
    if (whatsapp.trim() && !E164_REGEX.test(toE164(whatsapp))) {
      return 'WhatsApp comercial incompleto ou inválido. Ex: (11) 99999-9999.';
    }
    return '';
  }, [touched.whatsapp, whatsapp]);

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
      const formattedPhone = rawCleanPhone ? toE164(rawCleanPhone) : null;
      if (!formattedPhone || !E164_REGEX.test(formattedPhone)) {
        setTouched((prev) => ({ ...prev, phone: true }));
        Alert.alert(
          'Telefone de Validação Obrigatório',
          'Para ativar seu perfil comercial, é obrigatório cadastrar um telefone válido na sua conta para validação e segurança. Seu número permanecerá estritamente privado.',
        );
        return;
      }

      if (whatsapp.trim() && !E164_REGEX.test(toE164(whatsapp))) {
        Alert.alert(
          'WhatsApp Comercial Inválido',
          'Por favor, informe um WhatsApp comercial válido com DDD antes de ativar ou deixe o campo em branco.',
        );
        return;
      }

      Alert.alert(
        'Tornar Perfil Comercial Público?',
        `Ao ativar o perfil comercial, sua página será criada e ficará visível para os clientes na busca do Meu Confeito.\n\n• Nome Público: O nome da sua conta (${user?.name}) será público na plataforma. Você pode adicionar um Nome Comercial opcional para ser exibido em destaque.\n• Contato Seguro: Seu telefone pessoal permanece estritamente privado para validação da conta. Apenas o WhatsApp comercial informado (se houver) será exibido aos clientes para contato direto.\n• E-mail: Permanece estritamente confidencial.\n\nDeseja ativar seu perfil comercial agora?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Ativar Imediatamente',
            onPress: async () => {
              try {
                setIsTogglingPublic(true);

                // 1. Ensure personal details are persisted to user account if changed
                const rawCleanPhone = phone.trim();
                const formattedPhone = rawCleanPhone ? toE164(rawCleanPhone) : null;
                const userPayload: UserEditData = {};
                if (formattedPhone !== (user?.phone ?? null)) {
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

                // 2. Immediately send create request to API with publicName and whatsapp
                const createData: BakerProfileRegisterInput = {
                  publicName: publicName.trim() || null,
                  whatsapp: whatsapp.trim() ? toE164(whatsapp) : null,
                  bio: bio.trim() || null,
                  instagram: instagram.trim() ? instagram.trim().replace(/^@/, '') : null,
                  city: city.trim() || null,
                  neighborhood: neighborhood.trim() || null,
                  location: locationCoords || null,
                  tagIds: selectedTags.map((t) => t.id),
                };

                await saveBakerProfile(createData, false);
                setIsPublicProfile(true);
                setHasInitialBakerProfile(true);

                Alert.alert(
                  'Perfil Comercial Ativado!',
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
    setTouched({ name: true, email: true, phone: true, whatsapp: true });

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

    if (isBakerRole && isPublicProfile) {
      if (!formattedPhone || !E164_REGEX.test(formattedPhone)) {
        Alert.alert(
          'Telefone de Validação Obrigatório',
          'Para manter o perfil comercial ativo, o telefone de validação da conta é obrigatório. Ele permanecerá estritamente privado.',
        );
        return;
      }
      if (whatsapp.trim() && !E164_REGEX.test(toE164(whatsapp))) {
        Alert.alert(
          'WhatsApp comercial inválido',
          'O WhatsApp comercial deve estar em formato válido com DDD (ex: (11) 99999-9999).',
        );
        return;
      }
      if (publicName.length > 100) {
        Alert.alert(
          'Nome comercial inválido',
          'O nome comercial deve ter no máximo 100 caracteres.',
        );
        return;
      }
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
    } else if (phone.trim() && !E164_REGEX.test(toE164(phone))) {
      Alert.alert(
        'Telefone inválido',
        'O telefone deve estar em formato válido com DDD (ex: (11) 99999-9999).',
      );
      return;
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

      if (selectedAvatarFile) {
        const avatarFormData = await createImageFormData('avatar', selectedAvatarFile);
        const uploadRes = await UserService.uploadAvatar(avatarFormData);
        const finalAvatarUrl = getStorageUrl(uploadRes.data.url);
        userData.pfpUrl = finalAvatarUrl;
        await clearImageCache();
      } else if (hasRemovedAvatar) {
        try {
          await UserService.deleteAvatar();
        } catch (deleteError) {
          console.warn('Failed to delete avatar on server:', deleteError);
        }
        userData.pfpUrl = null;
        await clearImageCache();
      }

      if (Object.keys(userData).length > 0) {
        try {
          const response = await editUser(userData, user!.id);
          if (response?.data?.user) {
            await updateUser(response.data.user);
          } else {
            await updateUser(userData);
          }
        } catch (updateError) {
          console.warn('Failed to update user profile on server:', updateError);
          // If the server rejects null pfpUrl, keep local state in sync so UI doesn't crash
          await updateUser(userData);
          throw updateError;
        }
      }

      // 2. The save button updates the public baker profile if it exists
      if (isBakerRole && isPublicProfile && hasInitialBakerProfile) {
        const profileUpdate: BakerProfileUpdateInput = {
          publicName: publicName.trim() || null,
          whatsapp: whatsapp.trim() ? toE164(whatsapp) : null,
          bio: bio.trim() || null,
          instagram: instagram.trim() ? instagram.trim().replace(/^@/, '') : null,
          city: city.trim() || null,
          neighborhood: neighborhood.trim() || null,
          location: locationCoords ?? null,
          tagIds: selectedTags.map((t) => t.id),
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

      <KeyboardAwareScrollView
        ref={scrollViewRef}
        style={styles.container}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        bottomOffset={64}
      >
        <View style={styles.formWrapper}>
          {/* Account Information Card */}
          <View style={styles.card}>
            <View style={styles.avatarContainer}>
              <TouchableOpacity
                onPress={handleAvatarPress}
                disabled={isPickingAvatar || isGlobalLoading}
                accessibilityRole="button"
                accessibilityLabel="Alterar foto de perfil"
                style={styles.avatarTouchable}
              >
                <UserAvatar
                  url={avatarUrl}
                  updatedAt={user?.updatedAt}
                  name={name}
                  size={110}
                  fallbackType="icon"
                  fallbackIcon="account"
                  fallbackIconColor={theme.colors.onSurfaceVariant}
                  fallbackBackgroundColor={theme.colors.surfaceContainerLow}
                  borderColor={theme.colors.primary}
                  borderWidth={3}
                  style={styles.avatarSpacing}
                />

                <View style={styles.avatarBadge}>
                  {isPickingAvatar ? (
                    <ActivityIndicator size={16} color={theme.colors.onPrimary} />
                  ) : (
                    <MaterialCommunityIcons
                      name="camera"
                      size={16}
                      color={theme.colors.onPrimary}
                    />
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleAvatarPress}
                disabled={isPickingAvatar || isGlobalLoading}
                accessibilityRole="button"
                accessibilityLabel={
                  avatarUrl ? 'Alterar foto de perfil' : 'Adicionar foto de perfil'
                }
                style={styles.avatarActionBtn}
              >
                <Text style={styles.avatarActionBtnText}>
                  {avatarUrl ? 'Alterar foto' : 'Adicionar foto'}
                </Text>
              </TouchableOpacity>

              <Text style={styles.avatarHelperText}>Máx. 5MB • 300 x 300 pixels</Text>

              <Text style={styles.userName}>{name.trim() || user?.name}</Text>
              <Text style={styles.userRole}>{isBakerRole ? 'Confeiteira(o)' : 'Cliente'}</Text>
            </View>

            <Text style={styles.cardSectionHeader}>Informações da Conta</Text>

            {/* Name input */}
            <View style={styles.fieldWrapper}>
              <View style={styles.labelRow}>
                <View style={styles.labelGroup}>
                  <Text style={styles.label}>Nome completo</Text>
                  <View style={styles.badgeRequired}>
                    <Text style={styles.badgeRequiredText}>obrigatório</Text>
                  </View>
                </View>
                {isNameSuccess && (
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
                  isNameSuccess && styles.inputSuccess,
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
                <View style={styles.labelGroup}>
                  <View style={styles.labelWithIcon}>
                    <Text style={styles.label}>E-mail</Text>
                    <MaterialCommunityIcons
                      name="lock-outline"
                      size={14}
                      color={theme.colors.onSurfaceVariant}
                    />
                  </View>
                  <View style={styles.badgeRequired}>
                    <Text style={styles.badgeRequiredText}>obrigatório</Text>
                  </View>
                </View>
                {isEmailSuccess && (
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
                  isEmailSuccess && styles.inputSuccess,
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

            {/* Personal Phone input */}
            <View style={styles.fieldWrapper}>
              <View style={styles.labelRow}>
                <View style={styles.labelGroup}>
                  <View style={styles.labelWithIcon}>
                    <Text style={styles.label}>Telefone Pessoal</Text>
                    <MaterialCommunityIcons
                      name="lock-outline"
                      size={14}
                      color={theme.colors.onSurfaceVariant}
                    />
                  </View>
                  <View style={isPhoneRequired ? styles.badgeRequired : styles.badgeOptional}>
                    <Text
                      style={isPhoneRequired ? styles.badgeRequiredText : styles.badgeOptionalText}
                    >
                      {isPhoneRequired ? 'obrigatório' : 'opcional'}
                    </Text>
                  </View>
                </View>
                {isPhoneSuccess && (
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
                  isPhoneSuccess && styles.inputSuccess,
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
                    {isPhoneRequired
                      ? 'Obrigatório para perfil comercial: utilizado apenas para validação e segurança (permanece privado).'
                      : 'Confidencial: utilizado apenas para validação e segurança da conta.'}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Baker Profile / Public Profile Card */}
          {isBakerRole ? (
            <Animated.View
              style={[
                styles.card,
                isFocusCommercial && {
                  borderColor: blinkAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [theme.colors.outlineVariant, theme.colors.primary],
                  }),
                  borderWidth: blinkAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 2.5],
                  }),
                },
              ]}
            >
              <View style={styles.publicHeaderRow}>
                <View style={styles.publicTitleWrapper}>
                  <Text style={styles.cardSectionHeader}>Perfil Comercial de Confeiteiro</Text>
                  <Text style={styles.publicSubtitle}>Tornar seu perfil público para clientes</Text>
                </View>

                <ThemeSwitch
                  value={isPublicProfile}
                  onValueChange={handleTogglePublicProfile}
                  disabled={isTogglingPublic}
                  activeThumbColor={theme.colors.primary}
                  inactiveThumbColor={theme.colors.surfaceContainerHighest}
                  activeTrackColor={theme.colors.primaryContainer}
                  inactiveTrackColor={theme.colors.outlineVariant}
                  accessibilityLabel="Tornar perfil comercial público"
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
                      O nome da sua conta ({user?.name}) é público no perfil comercial. Você pode
                      definir um Nome Comercial abaixo para destaque. Seu telefone pessoal e e-mail
                      permanecem privados — apenas o WhatsApp comercial informado será
                      compartilhado.
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
                      Ao ativar, o nome da sua conta ({user?.name}) será público para clientes. Você
                      poderá cadastrar um Nome Comercial opcional e WhatsApp para contato direto com
                      clientes.
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
                  {/* Public Name / Store Name input */}
                  <View style={styles.fieldWrapper}>
                    <View style={styles.labelRow}>
                      <View style={styles.labelGroup}>
                        <Text style={styles.label}>Nome Comercial / Público</Text>
                        <View style={styles.badgeOptional}>
                          <Text style={styles.badgeOptionalText}>opcional</Text>
                        </View>
                      </View>
                    </View>
                    <Input
                      value={publicName}
                      placeholder="Ex: Confeitaria Doce Sonho, Atelier Gourmet"
                      autoCapitalize="words"
                      maxLength={100}
                      onChangeText={setPublicName}
                      containerStyle={styles.inputContainer}
                      style={styles.inputText}
                      placeholderTextColor={theme.colors.placeholder}
                      leftIcon={
                        <MaterialCommunityIcons
                          name="storefront-outline"
                          size={20}
                          color={theme.colors.onSurfaceVariant}
                        />
                      }
                    />
                    <Text style={styles.helperText}>
                      Opcional. Exibido no lugar do nome da conta. Lembre-se: o nome da sua conta (
                      {user?.name}) continuará público.
                    </Text>
                  </View>

                  {/* Commercial WhatsApp input */}
                  <View style={styles.fieldWrapper}>
                    <View style={styles.labelRow}>
                      <View style={styles.labelGroup}>
                        <Text style={styles.label}>WhatsApp Comercial</Text>
                        <View style={styles.badgeOptional}>
                          <Text style={styles.badgeOptionalText}>opcional</Text>
                        </View>
                      </View>
                      {isWhatsAppSuccess && (
                        <MaterialCommunityIcons
                          name="check-circle-outline"
                          size={16}
                          color={theme.colors.success}
                        />
                      )}
                    </View>
                    <Input
                      value={whatsapp}
                      placeholder="(11) 99999-9999"
                      keyboardType="phone-pad"
                      onChangeText={handleWhatsAppChange}
                      onBlur={() => setTouched((prev) => ({ ...prev, whatsapp: true }))}
                      containerStyle={[
                        styles.inputContainer,
                        !!whatsAppError && styles.inputError,
                        isWhatsAppSuccess && styles.inputSuccess,
                      ]}
                      style={styles.inputText}
                      placeholderTextColor={theme.colors.placeholder}
                      leftIcon={
                        <MaterialCommunityIcons
                          name="whatsapp"
                          size={20}
                          color={theme.colors.onSurfaceVariant}
                        />
                      }
                    />
                    <View style={styles.helperRow}>
                      {whatsAppError ? (
                        <>
                          <MaterialCommunityIcons
                            name="alert-circle-outline"
                            size={14}
                            color={theme.colors.error}
                            style={styles.helperIcon}
                          />
                          <Text style={styles.errorText}>{whatsAppError}</Text>
                        </>
                      ) : (
                        <Text style={styles.helperText}>
                          Opcional. Se não informar nada, o botão de WhatsApp será ocultado (seu
                          telefone pessoal nunca é divulgado).
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Location Section handled by expo-location */}
                  <View style={styles.locationSection}>
                    <View style={styles.locationHeaderRow}>
                      <View style={styles.labelGroup}>
                        <View style={styles.labelWithIcon}>
                          <MaterialCommunityIcons
                            name="crosshairs-gps"
                            size={16}
                            color={theme.colors.primary}
                          />
                          <Text style={styles.label}>Localização Geográfica (GPS)</Text>
                        </View>
                        <View style={styles.badgeOptional}>
                          <Text style={styles.badgeOptionalText}>opcional</Text>
                        </View>
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
                      <View style={styles.labelGroup}>
                        <Text style={styles.label}>Cidade</Text>
                        <View style={styles.badgeOptional}>
                          <Text style={styles.badgeOptionalText}>opcional</Text>
                        </View>
                      </View>
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
                      <View style={styles.labelGroup}>
                        <Text style={styles.label}>Bairro</Text>
                        <View style={styles.badgeOptional}>
                          <Text style={styles.badgeOptionalText}>opcional</Text>
                        </View>
                      </View>
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
                      <View style={styles.labelGroup}>
                        <Text style={styles.label}>Sobre a Confeitaria / Bio</Text>
                        <View style={styles.badgeOptional}>
                          <Text style={styles.badgeOptionalText}>opcional</Text>
                        </View>
                      </View>
                      <Text style={styles.charCounter}>{bio.length}/500</Text>
                    </View>
                    <Input
                      value={bio}
                      placeholder="Conte aos clientes sobre sua história, receitas especiais, criações e paixão pela confeitaria..."
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
                      <View style={styles.labelGroup}>
                        <Text style={styles.label}>Instagram Comercial</Text>
                        <View style={styles.badgeOptional}>
                          <Text style={styles.badgeOptionalText}>opcional</Text>
                        </View>
                      </View>
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

                  {/* Baker Tags & Specialties */}
                  <BakerTagSelector
                    selectedTags={selectedTags}
                    onTagsChange={setSelectedTags}
                    userId={user?.id}
                  />

                  {/* Showcase Manager Section */}
                  {hasInitialBakerProfile && <ShowcaseManager userId={user?.id} />}
                </>
              )}
            </Animated.View>
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
      </KeyboardAwareScrollView>
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
    avatarTouchable: {
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 48,
      minHeight: 48,
    },
    avatarBadge: {
      position: 'absolute',
      bottom: 12,
      right: 4,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.primary,
      borderWidth: 2.5,
      borderColor: theme.colors.surfaceContainerLowest,
      alignItems: 'center',
      justifyContent: 'center',
      ...theme.shadows.glow,
    },
    avatarActionBtn: {
      minHeight: 48,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    avatarActionBtnText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    avatarHelperText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 6,
    },
    avatarSpacing: {
      marginBottom: 8,
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
    labelGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    badgeRequired: {
      backgroundColor: theme.colors.chips.primary.background,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: theme.rounded.full,
    },
    badgeRequiredText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 10,
      fontWeight: '700',
      color: theme.colors.chips.primary.text,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    badgeOptional: {
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: theme.rounded.full,
    },
    badgeOptionalText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 10,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
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
