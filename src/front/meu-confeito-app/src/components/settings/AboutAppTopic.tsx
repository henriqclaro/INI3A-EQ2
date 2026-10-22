import { useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import * as Clipboard from 'expo-clipboard';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Image } from 'expo-image';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { MenuOptionButton } from '@/src/components/common';
import { useAuth } from '@/src/contexts/AuthContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { useNetwork } from '@/src/hooks/useNetwork';
import { AppTheme } from '@/src/theme/themes';
import { Storage } from '@/src/utils/storage';

export function AboutAppTopic() {
  const { theme, isDarkMode } = useThemeMode();
  const { isOffline } = useNetwork();
  const { user } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(() =>
    Storage.getFastItem('session_id'),
  );

  useEffect(() => {
    let isMounted = true;
    Storage.getItem('session_id').then((storedSessionId) => {
      if (isMounted && storedSessionId) {
        setSessionId(storedSessionId);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const styles = useMemo(() => createStyles(theme), [theme]);

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  const commercialSystemVersion = useMemo(() => {
    if (Platform.OS === 'web') {
      return null;
    }
    if (Platform.OS === 'android') {
      const release = (Platform.constants as { Release?: string })?.Release;
      return release ? `Android ${release}` : `Android ${Platform.Version}`;
    }
    if (Platform.OS === 'ios') {
      return `iOS ${Platform.Version}`;
    }
    return `${Platform.OS} ${Platform.Version}`;
  }, []);

  const executionEnvironmentInfo = useMemo(() => {
    let envName = 'Produção';

    if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
      envName = 'Expo Go';
    } else if (Platform.OS === 'web') {
      envName = __DEV__ ? 'Web (Dev)' : 'Web';
    } else if (Constants.executionEnvironment === ExecutionEnvironment.Standalone) {
      envName = 'Produção';
    } else if (__DEV__) {
      envName = 'Desenvolvimento';
    }

    const rawSdkVersion = Constants.expoConfig?.sdkVersion ?? Constants.expoVersion;
    const sdkMajor = rawSdkVersion ? rawSdkVersion.replace(/^[^\d]*/, '').split('.')[0] : '57';
    const sdkLabel = sdkMajor ? `SDK ${sdkMajor}` : 'SDK 57';

    return `${envName} • ${sdkLabel}`;
  }, []);

  const handleCopyInfo = (value?: string | null) => {
    if (!value || value === '—') return;
    Clipboard.setStringAsync(value).catch(() => {});
  };

  const handleOpenExternalUrl = async (url: string, fallbackCopyText: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return;
      }
    } catch {
      // Fallback below
    }
    await Clipboard.setStringAsync(fallbackCopyText).catch(() => {});
    Alert.alert('Copiado', `${fallbackCopyText} copiado para a área de transferência.`);
  };

  const handleSupportPress = () => {
    Alert.alert(
      'Central de Ajuda & Suporte',
      'Para dúvidas, sugestões ou relatar problemas no Meu Confeito, envie um e-mail para meuconfeito4@gmail.com ou fale com nossa equipe pelos canais oficiais.',
      [{ text: 'Entendido' }],
    );
  };

  const handleTermsPress = () => {
    Alert.alert(
      'Termos de Uso e Privacidade',
      'O Meu Confeito respeita sua privacidade e protege seus dados conforme a LGPD. Suas receitas, estoque e dados de clientes são mantidos com total sigilo e criptografia.',
      [{ text: 'Fechar' }],
    );
  };

  const platformName = Platform.select({
    web: 'Web Browser',
    ios: 'Apple iOS',
    android: 'Google Android',
    default: 'Multiplataforma',
  });

  return (
    <View style={styles.container}>
      {/* Brand Hero Card */}
      <View style={styles.aboutCard}>
        <View style={styles.aboutHeader}>
          <View style={styles.brandBadge}>
            <Image
              source={
                isDarkMode
                  ? require('@/assets/images/logo-dark.png')
                  : require('@/assets/images/logo-light.png')
              }
              style={styles.brandLogoImage}
              contentFit="contain"
            />
          </View>
          <View style={styles.brandTextWrapper}>
            <Text style={styles.brandName}>Meu Confeito</Text>
            <Text style={styles.appVersion}>Versão {appVersion} (Beta)</Text>
          </View>
        </View>

        <Text style={styles.aboutDescription}>
          Desenvolvido especialmente para confeiteiras e confeiteiros independentes que buscam
          precisão no cálculo de custos, gestão simplificada e valorização do seu trabalho
          artesanal.
        </Text>
      </View>

      {/* Project Team Card */}
      <View style={styles.detailsCard}>
        <Text style={styles.detailsCardTitle}>Equipe do Projeto</Text>

        <TouchableOpacity
          style={styles.detailRow}
          activeOpacity={0.7}
          onPress={() =>
            handleOpenExternalUrl(
              'https://github.com/henriqclaro/INI3A-EQ2',
              'https://github.com/henriqclaro/INI3A-EQ2',
            )
          }
          onLongPress={() => handleCopyInfo('https://github.com/henriqclaro/INI3A-EQ2')}
          accessibilityRole="link"
          accessibilityLabel="Abrir repositório no GitHub: https://github.com/henriqclaro/INI3A-EQ2"
        >
          <View style={styles.detailLabelGroup}>
            <MaterialCommunityIcons name="github" size={18} color={theme.colors.onSurfaceVariant} />
            <Text style={styles.detailLabel}>GitHub</Text>
          </View>
          <Text style={styles.detailValue} numberOfLines={1} ellipsizeMode="middle">
            henriqclaro/INI3A-EQ2
          </Text>
        </TouchableOpacity>

        <View style={styles.detailDivider} />

        <TouchableOpacity
          style={styles.detailRow}
          activeOpacity={0.7}
          onPress={() =>
            handleOpenExternalUrl('mailto:meuconfeito4@gmail.com', 'meuconfeito4@gmail.com')
          }
          onLongPress={() => handleCopyInfo('meuconfeito4@gmail.com')}
          accessibilityRole="link"
          accessibilityLabel="Enviar e-mail para meuconfeito4@gmail.com"
        >
          <View style={styles.detailLabelGroup}>
            <MaterialCommunityIcons
              name="email-outline"
              size={18}
              color={theme.colors.onSurfaceVariant}
            />
            <Text style={styles.detailLabel}>E-mail</Text>
          </View>
          <Text style={styles.detailValue} numberOfLines={1} ellipsizeMode="middle">
            meuconfeito4@gmail.com
          </Text>
        </TouchableOpacity>

        <View style={styles.detailDivider} />

        <TouchableOpacity
          style={styles.detailRow}
          activeOpacity={0.7}
          onPress={() =>
            handleOpenExternalUrl('https://instagram.com/meuconfeito.tcc', '@meuconfeito.tcc')
          }
          onLongPress={() => handleCopyInfo('@meuconfeito.tcc')}
          accessibilityRole="link"
          accessibilityLabel="Abrir perfil no Instagram: @meuconfeito.tcc"
        >
          <View style={styles.detailLabelGroup}>
            <MaterialCommunityIcons
              name="instagram"
              size={18}
              color={theme.colors.onSurfaceVariant}
            />
            <Text style={styles.detailLabel}>Instagram</Text>
          </View>
          <Text style={styles.detailValue} numberOfLines={1} ellipsizeMode="middle">
            @meuconfeito.tcc
          </Text>
        </TouchableOpacity>
      </View>

      {/* System and Technical Details Card */}
      <View style={styles.detailsCard}>
        <Text style={styles.detailsCardTitle}>Informações Técnicas</Text>

        <TouchableOpacity
          style={styles.detailRow}
          activeOpacity={0.7}
          onPress={() => handleCopyInfo(platformName)}
          accessibilityRole="button"
          accessibilityLabel={`Copiar plataforma: ${platformName}`}
        >
          <View style={styles.detailLabelGroup}>
            <MaterialCommunityIcons
              name="cellphone-link"
              size={18}
              color={theme.colors.onSurfaceVariant}
            />
            <Text style={styles.detailLabel}>Plataforma</Text>
          </View>
          <Text style={styles.detailValue}>{platformName}</Text>
        </TouchableOpacity>

        {commercialSystemVersion && (
          <>
            <View style={styles.detailDivider} />
            <TouchableOpacity
              style={styles.detailRow}
              activeOpacity={0.7}
              onPress={() => handleCopyInfo(commercialSystemVersion)}
              accessibilityRole="button"
              accessibilityLabel={`Copiar versão do sistema: ${commercialSystemVersion}`}
            >
              <View style={styles.detailLabelGroup}>
                <MaterialCommunityIcons
                  name="cellphone-cog"
                  size={18}
                  color={theme.colors.onSurfaceVariant}
                />
                <Text style={styles.detailLabel}>Versão do Sistema</Text>
              </View>
              <Text style={styles.detailValue}>{commercialSystemVersion}</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.detailDivider} />

        <TouchableOpacity
          style={styles.detailRow}
          activeOpacity={0.7}
          onPress={() => handleCopyInfo(executionEnvironmentInfo)}
          accessibilityRole="button"
          accessibilityLabel={`Copiar ambiente de execução e versão do SDK: ${executionEnvironmentInfo}`}
        >
          <View style={styles.detailLabelGroup}>
            <MaterialCommunityIcons
              name="application-cog-outline"
              size={18}
              color={theme.colors.onSurfaceVariant}
            />
            <Text style={styles.detailLabel}>Ambiente de Execução</Text>
          </View>
          <Text style={styles.detailValue}>{executionEnvironmentInfo}</Text>
        </TouchableOpacity>

        <View style={styles.detailDivider} />

        <TouchableOpacity
          style={styles.detailRow}
          activeOpacity={0.7}
          onPress={() => handleCopyInfo(isOffline ? 'Offline' : 'Online')}
          accessibilityRole="button"
          accessibilityLabel={`Copiar status de conexão: ${isOffline ? 'Offline' : 'Online'}`}
        >
          <View style={styles.detailLabelGroup}>
            <MaterialCommunityIcons
              name={isOffline ? 'cloud-off-outline' : 'cloud-check-outline'}
              size={18}
              color={isOffline ? theme.colors.error : theme.colors.tertiary}
            />
            <Text style={styles.detailLabel}>Status de Conexão</Text>
          </View>
          <View style={isOffline ? styles.statusOfflineBadge : styles.statusOnlineBadge}>
            <Text style={isOffline ? styles.statusOfflineText : styles.statusOnlineText}>
              {isOffline ? 'Offline' : 'Online'}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.detailDivider} />

        <TouchableOpacity
          style={styles.detailRow}
          activeOpacity={0.7}
          onPress={() => handleCopyInfo(user?.id ? String(user.id) : null)}
          accessibilityRole="button"
          accessibilityLabel={`Copiar ID do usuário: ${user?.id ? String(user.id) : 'Indisponível'}`}
        >
          <View style={styles.detailLabelGroup}>
            <MaterialCommunityIcons
              name="account-outline"
              size={18}
              color={theme.colors.onSurfaceVariant}
            />
            <Text style={styles.detailLabel}>ID do Usuário</Text>
          </View>
          <Text style={styles.detailValue} numberOfLines={1} ellipsizeMode="middle">
            {user?.id ? String(user.id) : '—'}
          </Text>
        </TouchableOpacity>

        <View style={styles.detailDivider} />

        <TouchableOpacity
          style={styles.detailRow}
          activeOpacity={0.7}
          onPress={() => handleCopyInfo(sessionId)}
          accessibilityRole="button"
          accessibilityLabel={`Copiar ID da sessão: ${sessionId || 'Indisponível'}`}
        >
          <View style={styles.detailLabelGroup}>
            <MaterialCommunityIcons
              name="shield-key-outline"
              size={18}
              color={theme.colors.onSurfaceVariant}
            />
            <Text style={styles.detailLabel}>ID da Sessão</Text>
          </View>
          <Text style={styles.detailValue} numberOfLines={1} ellipsizeMode="middle">
            {sessionId || '—'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Support & Legal Links */}
      <View style={styles.supportSection}>
        <Text style={styles.supportSectionTitle}>Ajuda & Documentação</Text>
        <MenuOptionButton
          title="Central de Ajuda & Suporte"
          subtitle="Canais de atendimento, dúvidas frequentes e contato"
          icon="help-circle-outline"
          onPress={handleSupportPress}
        />
        <MenuOptionButton
          title="Termos de Uso & Privacidade"
          subtitle="Política de proteção de dados e diretrizes da plataforma"
          icon="file-document-outline"
          onPress={handleTermsPress}
        />
      </View>
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      width: '100%',
      gap: theme.spacing.space4,
    },
    aboutCard: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.lg,
      padding: theme.spacing.space5,
      width: '100%',
      ...theme.shadows.soft,
    },
    aboutHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.space3,
      marginBottom: theme.spacing.space3,
    },
    brandBadge: {
      width: 48,
      height: 48,
      borderRadius: theme.rounded.md,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    brandLogoImage: {
      width: 38,
      height: 38,
    },
    brandTextWrapper: {
      flex: 1,
      gap: 2,
    },
    brandName: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.espressoDark,
      letterSpacing: 0.5,
    },
    appVersion: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    aboutDescription: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      lineHeight: 20,
      color: theme.colors.onSurfaceVariant,
    },
    detailsCard: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.lg,
      padding: theme.spacing.space4,
      width: '100%',
      gap: theme.spacing.space3,
      ...theme.shadows.soft,
    },
    detailsCardTitle: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.espressoDark,
      marginBottom: 2,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 48,
      gap: theme.spacing.space3,
    },
    detailLabelGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.space2,
    },
    detailLabel: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
    detailValue: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.espressoDark,
      flexShrink: 1,
      textAlign: 'right',
    },
    detailDivider: {
      height: 1,
      backgroundColor: theme.colors.outlineVariant,
    },
    statusOnlineBadge: {
      backgroundColor: theme.colors.chips.success.background,
      paddingHorizontal: 10,
      paddingVertical: 2,
      borderRadius: theme.rounded.full,
    },
    statusOnlineText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.chips.success.text,
      textTransform: 'uppercase',
    },
    statusOfflineBadge: {
      backgroundColor: theme.colors.errorContainer,
      paddingHorizontal: 10,
      paddingVertical: 2,
      borderRadius: theme.rounded.full,
    },
    statusOfflineText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.error,
      textTransform: 'uppercase',
    },
    supportSection: {
      gap: theme.spacing.space2,
      marginTop: theme.spacing.space2,
    },
    supportSectionTitle: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.espressoDark,
      letterSpacing: 0.4,
      marginLeft: theme.spacing.space1,
      marginBottom: 2,
    },
  });
