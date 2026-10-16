import { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';

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
            <Text style={styles.appVersion}>Versão 0.9.2 (Beta)</Text>
          </View>
        </View>

        <Text style={styles.aboutDescription}>
          Desenvolvido especialmente para confeiteiras e confeiteiros independentes que buscam
          precisão no cálculo de custos, gestão simplificada e valorização do seu trabalho
          artesanal.
        </Text>
      </View>

      {/* System and Technical Details Card */}
      <View style={styles.detailsCard}>
        <Text style={styles.detailsCardTitle}>Informações Técnicas</Text>

        <View style={styles.detailRow}>
          <View style={styles.detailLabelGroup}>
            <MaterialCommunityIcons
              name="cellphone-link"
              size={18}
              color={theme.colors.onSurfaceVariant}
            />
            <Text style={styles.detailLabel}>Plataforma</Text>
          </View>
          <Text style={styles.detailValue}>{platformName}</Text>
        </View>

        <View style={styles.detailDivider} />

        <View style={styles.detailRow}>
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
        </View>

        <View style={styles.detailDivider} />

        <View style={styles.detailRow}>
          <View style={styles.detailLabelGroup}>
            <MaterialCommunityIcons
              name="account-outline"
              size={18}
              color={theme.colors.onSurfaceVariant}
            />
            <Text style={styles.detailLabel}>ID do Usuário</Text>
          </View>
          <Text style={styles.detailValue} numberOfLines={1} ellipsizeMode="middle" selectable>
            {user?.id ? String(user.id) : '—'}
          </Text>
        </View>

        <View style={styles.detailDivider} />

        <View style={styles.detailRow}>
          <View style={styles.detailLabelGroup}>
            <MaterialCommunityIcons
              name="shield-key-outline"
              size={18}
              color={theme.colors.onSurfaceVariant}
            />
            <Text style={styles.detailLabel}>ID da Sessão</Text>
          </View>
          <Text style={styles.detailValue} numberOfLines={1} ellipsizeMode="middle" selectable>
            {sessionId || '—'}
          </Text>
        </View>
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
      minHeight: 32,
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
