import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  BackHandler,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';

import { Stack, router, useLocalSearchParams, useNavigation } from 'expo-router';

import {
  AboutAppTopic,
  AccessibilityTopic,
  AccountSecurityTopic,
  AppearanceTopic,
  DeleteAccountModal,
  OfflineBanner,
  OnboardingCard,
  OperationalPreferencesTopic,
  SettingsSearchBar,
  SettingsSearchResults,
  SettingsSidebar,
  SettingsTopicHeader,
  SettingsTopicList,
  StorageSettingsTopic,
} from '@/src/components';
import { filterSettingShortcuts } from '@/src/constants/settingsShortcuts';
import { useAuth } from '@/src/contexts/AuthContext';
import { useOnboarding } from '@/src/contexts/OnboardingContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { useNetwork } from '@/src/hooks/useNetwork';
import { useUserDelete } from '@/src/hooks/useUsers';
import { AppTheme } from '@/src/theme/themes';
import { SettingsTopicId, SettingsTopicItem } from '@/src/types/settings';
import { isBaker, isCustomer } from '@/src/utils/roles';

export default function SettingsScreen() {
  const { theme } = useThemeMode();
  const { width } = useWindowDimensions();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ topic?: string }>();

  const isSmallScreen = width < theme.breakpoints.sm;
  const isDesktop = Platform.OS === 'web' || width >= theme.breakpoints.md;

  const { user, signOut } = useAuth();
  const { isOffline } = useNetwork();
  const { deleteUser, isLoading: isDeletingUser } = useUserDelete();
  const { isCardDismissed } = useOnboarding();

  const isCustomerRole = isCustomer(user?.role);
  const isBakerRole = isBaker(user?.role);

  const hasVisibleSettingsCards =
    !isCardDismissed('settings_appearance') ||
    (!isCustomerRole && !isCardDismissed('settings_operational')) ||
    !isCardDismissed('settings_edit_profile');

  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [mobileSearchQuery, setMobileSearchQuery] = useState('');

  const mobileSearchResults = useMemo(() => {
    return filterSettingShortcuts({
      query: mobileSearchQuery,
      isDesktop: false,
      isCustomerRole,
      isBakerRole,
    });
  }, [mobileSearchQuery, isCustomerRole, isBakerRole]);

  const hasMobileSearch = mobileSearchQuery.trim().length > 0;

  // Available topics list based on user role and platform
  const topics: SettingsTopicItem[] = useMemo(() => {
    const list: SettingsTopicItem[] = [
      {
        id: 'account',
        title: 'Conta e Segurança',
        description: 'Gerencie seus dados de acesso, credenciais e encerramento da conta',
        icon: 'shield-account-outline',
      },
      {
        id: 'appearance',
        title: 'Aparência',
        description: 'Personalize cores, alto contraste e economia de bateria em telas OLED',
        icon: 'palette-outline',
      },
      {
        id: 'accessibility',
        title: 'Acessibilidade',
        description:
          'Ajuste recursos de acessibilidade, resposta tátil, gestos e visibilidade de cards de ajuda',
        icon: 'wheelchair-accessibility',
      },
    ];

    if (!isCustomerRole) {
      list.push({
        id: 'operational',
        title: 'Preferências Operacionais',
        description:
          'Defina valores padrão para custos de receitas e a precisão de exibição das precificações',
        icon: 'tune-variant',
      });
    }

    list.push(
      {
        id: 'storage',
        title: 'Dados e Armazenamento',
        description:
          'Gerencie o cache local, arquivos temporários e o uso de memória do aplicativo',
        icon: 'database-outline',
      },
      {
        id: 'about',
        title: 'Sobre o Aplicativo',
        description: 'Informações da versão, suporte e detalhes do sistema',
        icon: 'information-outline',
      },
    );

    return list;
  }, [isCustomerRole]);

  // Validate topic from route params or fallback
  const validTopicIds = useMemo(() => new Set(topics.map((t) => t.id)), [topics]);

  const rawTopicParam = params.topic as SettingsTopicId | undefined;
  const topicParam = rawTopicParam === 'interaction' ? 'accessibility' : rawTopicParam;
  const isValidParam = Boolean(topicParam && validTopicIds.has(topicParam));

  const [localTopicId, setLocalTopicId] = useState<SettingsTopicId | null>(() => {
    if (isValidParam && topicParam) {
      return topicParam;
    }
    return isDesktop ? 'account' : null;
  });

  // Derived effective topic id
  const effectiveTopicId = useMemo<SettingsTopicId | null>(() => {
    if (isValidParam && topicParam) {
      return topicParam;
    }
    if (isDesktop) {
      return (localTopicId && validTopicIds.has(localTopicId) ? localTopicId : null) || 'account';
    }
    return localTopicId;
  }, [isValidParam, topicParam, isDesktop, localTopicId, validTopicIds]);

  // Hardware back button support on Android (returns to topic list when inside a topic)
  useEffect(() => {
    if (isDesktop || effectiveTopicId === null) {
      return;
    }

    const backSubscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setLocalTopicId(null);
      router.setParams({ topic: '' });
      return true;
    });

    return () => {
      backSubscription.remove();
    };
  }, [isDesktop, effectiveTopicId]);

  // Navigation back interception (CustomHeader back action)
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!isDesktop && effectiveTopicId !== null) {
        e.preventDefault();
        setLocalTopicId(null);
        router.setParams({ topic: '' });
      }
    });

    return unsubscribe;
  }, [navigation, isDesktop, effectiveTopicId]);

  const activeTopicId: SettingsTopicId = effectiveTopicId || 'account';
  const activeTopic = topics.find((t) => t.id === activeTopicId) || topics[0];

  const handleSelectTopic = (topicId: SettingsTopicId) => {
    setLocalTopicId(topicId);
    router.setParams({ topic: topicId });
  };

  const handleBackToOverview = () => {
    setLocalTopicId(null);
    router.setParams({ topic: '' });
  };

  const handleOpenDeleteModal = () => {
    setIsDeleteModalVisible(true);
  };

  const handleCloseDeleteModal = () => {
    if (!isDeletingUser) {
      setIsDeleteModalVisible(false);
    }
  };

  const handleConfirmDeleteAccount = async () => {
    if (isOffline) {
      Alert.alert(
        'Modo Offline',
        'A exclusão definitiva da conta requer uma conexão ativa com a internet.',
      );
      return;
    }

    if (!user?.id) {
      Alert.alert('Erro', 'Usuário não autenticado.');
      return;
    }

    try {
      await deleteUser(user.id);
      setIsDeleteModalVisible(false);
      await signOut();
      Alert.alert(
        'Conta Excluída',
        'Sua conta e todos os dados vinculados a ela foram excluídos com sucesso.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/login'),
          },
        ],
      );
    } catch (err: unknown) {
      const apiErr = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const errorMsg =
        apiErr?.response?.data?.message ||
        apiErr?.message ||
        'Não foi possível excluir sua conta. Verifique sua conexão e tente novamente.';
      Alert.alert('Falha na Exclusão', errorMsg);
    }
  };

  const styles = useMemo(
    () => createStyles(theme, isSmallScreen, isDesktop),
    [theme, isSmallScreen, isDesktop],
  );

  const screenTitle = useMemo(() => {
    if (isDesktop) return 'Configurações';
    if (effectiveTopicId !== null && activeTopic) {
      return activeTopic.title;
    }
    return 'Configurações';
  }, [isDesktop, effectiveTopicId, activeTopic]);

  const renderTopicContent = (topicId: SettingsTopicId) => {
    switch (topicId) {
      case 'account':
        return (
          <AccountSecurityTopic
            user={user}
            onOpenDeleteModal={handleOpenDeleteModal}
            isSmallScreen={isSmallScreen}
          />
        );
      case 'appearance':
        return <AppearanceTopic />;
      case 'interaction':
      case 'accessibility':
        return <AccessibilityTopic />;
      case 'operational':
        return <OperationalPreferencesTopic />;
      case 'storage':
        return <StorageSettingsTopic />;
      case 'about':
        return <AboutAppTopic />;
      default:
        return null;
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: screenTitle }} />

      {isDesktop ? (
        /* Web/Desktop: Embedded Docked Sidebar with Centered Content Area */
        <View style={styles.desktopContainer}>
          <SettingsSidebar
            topics={topics}
            selectedTopicId={activeTopicId}
            onSelectTopic={handleSelectTopic}
            isCustomerRole={isCustomerRole}
            isBakerRole={isBakerRole}
          />

          <ScrollView
            style={styles.desktopMainScroll}
            contentContainerStyle={styles.desktopMainContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.desktopTopicCenteredWrapper}>
              <OfflineBanner
                isVisible={isOffline}
                message="Você está offline. Algumas operações requerem conexão ativa com a internet."
              />

              {activeTopic && (
                <SettingsTopicHeader
                  title={activeTopic.title}
                  description={activeTopic.description}
                  isMobile={false}
                />
              )}

              {renderTopicContent(activeTopicId)}
            </View>
          </ScrollView>
        </View>
      ) : (
        /* Mobile: Unified Scroll Layout */
        <ScrollView
          style={styles.mobileContainer}
          contentContainerStyle={styles.mobileScrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.mobileContentWrapper}>
            {effectiveTopicId === null && (
              <View style={styles.mobileSearchWrapper}>
                <SettingsSearchBar
                  value={mobileSearchQuery}
                  onChangeText={setMobileSearchQuery}
                  onClear={() => setMobileSearchQuery('')}
                  placeholder="Buscar configurações..."
                />
              </View>
            )}

            <OfflineBanner
              isVisible={isOffline}
              message="Você está offline. Algumas operações requerem conexão ativa com a internet."
            />

            {effectiveTopicId === null ? (
              hasMobileSearch ? (
                <SettingsSearchResults
                  results={mobileSearchResults}
                  searchQuery={mobileSearchQuery}
                  onSelectShortcut={(shortcut) => {
                    handleSelectTopic(shortcut.topicId);
                    setMobileSearchQuery('');
                  }}
                  onClearSearch={() => setMobileSearchQuery('')}
                />
              ) : (
                <>
                  {hasVisibleSettingsCards && (
                    <View style={styles.mobileCardsWrapper}>
                      <OnboardingCard
                        id="settings_appearance"
                        icon="palette-outline"
                        title="Personalize a Aparência"
                        description="Alterne entre tema claro artesanal, modo escuro noturno, alto contraste e economia OLED."
                        actionText="Ajustar Tema Visual"
                        onPress={() => handleSelectTopic('appearance')}
                      />
                      {!isCustomerRole && (
                        <OnboardingCard
                          id="settings_operational"
                          icon="tune-variant"
                          title="Preferências Operacionais"
                          description="Defina margens de lucro padrão, custos fixos (overhead) e precisão de casas decimais."
                          actionText="Configurar Padrões"
                          onPress={() => handleSelectTopic('operational')}
                        />
                      )}
                      <OnboardingCard
                        id="settings_edit_profile"
                        icon="account-edit-outline"
                        title="Complete seu Perfil"
                        description="Mantenha seus dados cadastrais, telefone de contato e foto de avatar sempre atualizados."
                        actionText="Editar Meu Perfil"
                        onPress={() => router.push('/edit-profile')}
                      />
                    </View>
                  )}

                  <SettingsTopicList topics={topics} onSelectTopic={handleSelectTopic} />
                </>
              )
            ) : (
              <View style={styles.mobileTopicContent}>
                {activeTopic && (
                  <SettingsTopicHeader
                    title={activeTopic.title}
                    description={activeTopic.description}
                    onBack={handleBackToOverview}
                    isMobile={true}
                  />
                )}
                {renderTopicContent(effectiveTopicId)}
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* Destructive Deletion Confirmation Modal */}
      <DeleteAccountModal
        isVisible={isDeleteModalVisible}
        isDeleting={isDeletingUser}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDeleteAccount}
      />
    </>
  );
}

const createStyles = (theme: AppTheme, isSmallScreen: boolean, _isDesktop: boolean) =>
  StyleSheet.create({
    desktopContainer: {
      flex: 1,
      flexDirection: 'row',
      backgroundColor: theme.colors.background,
    },
    desktopMainScroll: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    desktopMainContent: {
      alignItems: 'center',
      paddingHorizontal: theme.spacing.space8,
      paddingTop: theme.spacing.space6,
      paddingBottom: theme.spacing.space16,
    },
    desktopTopicCenteredWrapper: {
      width: '100%',
      maxWidth: 760,
      gap: theme.spacing.space5,
    },
    mobileContainer: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    mobileScrollContent: {
      paddingHorizontal: isSmallScreen ? theme.spacing.marginMobile : theme.spacing.marginTablet,
      paddingTop: theme.spacing.space4,
      paddingBottom: theme.spacing.space16,
      alignItems: 'center',
    },
    mobileContentWrapper: {
      width: '100%',
      maxWidth: 680,
      gap: theme.spacing.space6,
    },
    mobileSearchWrapper: {
      width: '100%',
      marginTop: theme.spacing.space1,
    },
    mobileCardsWrapper: {
      width: '100%',
      gap: theme.spacing.space3,
    },
    mobileTopicContent: {
      width: '100%',
      gap: theme.spacing.space2,
    },
  });
