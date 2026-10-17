import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';
import { BakerProfileLocation } from '@/src/types/baker-profile';

export interface ProfileLocationMenuProps {
  locationCoords: BakerProfileLocation | null;
  hasLocationCoords?: boolean;
  isFetchingLocation: boolean;
  isDesktop?: boolean;
  onFetchLocation: () => void;
  onClearLocation: () => void;
}

export const ProfileLocationMenu = ({
  locationCoords,
  hasLocationCoords,
  isFetchingLocation,
  isDesktop = false,
  onFetchLocation,
  onClearLocation,
}: ProfileLocationMenuProps) => {
  const { theme } = useThemeMode();
  const styles = useMemo(() => createStyles(theme, isDesktop), [theme, isDesktop]);
  const hasCoords = hasLocationCoords !== undefined ? hasLocationCoords : Boolean(locationCoords);

  return (
    <View style={styles.container}>
      {/* Header with Title, Icon & Status Chip */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleGroup}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="crosshairs-gps" size={18} color={theme.colors.primary} />
          </View>
          <View style={styles.headerTextGroup}>
            <Text style={styles.headerTitle}>Localização Geográfica (GPS)</Text>
            <Text style={styles.headerSubtitle}>
              {hasCoords
                ? 'Coordenadas ativas para busca no mapa'
                : 'Otimize a visibilidade da sua confeitaria'}
            </Text>
          </View>
        </View>

        <View style={hasCoords ? styles.statusBadgeActive : styles.statusBadgeOptional}>
          {hasCoords ? (
            <MaterialCommunityIcons
              name="check-circle"
              size={12}
              color={theme.colors.chips.success.text}
            />
          ) : null}
          <Text style={hasCoords ? styles.statusBadgeActiveText : styles.statusBadgeOptionalText}>
            {hasCoords ? 'GPS Ativo' : 'Opcional'}
          </Text>
        </View>
      </View>

      {/* Content based on whether coords are set */}
      {hasCoords && locationCoords ? (
        <View style={styles.activeContainer}>
          <View style={styles.coordsCard}>
            <View style={styles.coordsCardHeader}>
              <MaterialCommunityIcons
                name="map-marker-check"
                size={16}
                color={theme.colors.tertiary}
              />
              <Text style={styles.coordsCardHeaderText}>Ponto GPS Registrado</Text>
            </View>

            <View style={styles.coordsGrid}>
              <View style={styles.coordBox}>
                <Text style={styles.coordLabel}>LATITUDE</Text>
                <Text style={styles.coordValue}>{locationCoords.latitude.toFixed(5)}</Text>
              </View>
              <View style={styles.coordDivider} />
              <View style={styles.coordBox}>
                <Text style={styles.coordLabel}>LONGITUDE</Text>
                <Text style={styles.coordValue}>{locationCoords.longitude.toFixed(5)}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.helperText}>
            Sua confeitaria será exibida nos resultados por proximidade para clientes que buscam
            receitas e doces na sua região.
          </Text>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={onFetchLocation}
              disabled={isFetchingLocation}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Atualizar localização via GPS"
            >
              {isFetchingLocation ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <MaterialCommunityIcons name="refresh" size={18} color={theme.colors.primary} />
              )}
              <Text style={styles.refreshButtonText}>
                {isFetchingLocation ? 'Atualizando...' : 'Atualizar GPS'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.removeButton}
              onPress={onClearLocation}
              disabled={isFetchingLocation}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Remover coordenadas GPS"
            >
              <MaterialCommunityIcons
                name="trash-can-outline"
                size={18}
                color={theme.colors.error}
              />
              <Text style={styles.removeButtonText}>Remover GPS</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.inactiveContainer}>
          <View style={styles.infoBanner}>
            <MaterialCommunityIcons
              name="information-outline"
              size={18}
              color={theme.colors.onSurfaceVariant}
              style={styles.infoBannerIcon}
            />
            <Text style={styles.infoBannerText}>
              Ao ativar o GPS, sua confeitaria será exibida no mapa para clientes próximos e sua
              Cidade e Bairro serão preenchidos automaticamente.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.fetchButton}
            onPress={onFetchLocation}
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
            <Text style={styles.fetchButtonText}>
              {isFetchingLocation
                ? 'Detectando sua localização...'
                : 'Obter Localização Atual via GPS'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const createStyles = (theme: AppTheme, isDesktop: boolean) =>
  StyleSheet.create({
    container: {
      width: '100%',
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.md,
      padding: isDesktop ? 18 : 14,
      gap: 12,
      ...theme.shadows.soft,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    headerTitleGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
    },
    iconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.surfaceContainer,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    headerTextGroup: {
      flex: 1,
    },
    headerTitle: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.espressoDark,
    },
    headerSubtitle: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
      marginTop: 1,
    },
    statusBadgeActive: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: theme.colors.chips.success.background,
      borderWidth: 1,
      borderColor: theme.colors.tertiaryFixed,
      borderRadius: theme.rounded.full,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    statusBadgeActiveText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.chips.success.text,
      letterSpacing: 0.3,
    },
    statusBadgeOptional: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.full,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    statusBadgeOptionalText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 10,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    activeContainer: {
      width: '100%',
      gap: 12,
    },
    coordsCard: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.default,
      padding: 12,
      gap: 8,
    },
    coordsCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    coordsCardHeaderText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.tertiary,
    },
    coordsGrid: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceContainerLow,
      borderRadius: theme.rounded.default,
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    coordBox: {
      flex: 1,
      alignItems: 'center',
    },
    coordDivider: {
      width: 1,
      height: 24,
      backgroundColor: theme.colors.outlineVariant,
    },
    coordLabel: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 9,
      fontWeight: '700',
      color: theme.colors.onSurfaceVariant,
      letterSpacing: 0.5,
    },
    coordValue: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.espressoDark,
      marginTop: 2,
    },
    helperText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 16,
    },
    actionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      width: '100%',
    },
    refreshButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.default,
      paddingHorizontal: 12,
      minHeight: 48,
      ...theme.shadows.soft,
    },
    refreshButtonText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    removeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.default,
      paddingHorizontal: 14,
      minHeight: 48,
    },
    removeButtonText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.error,
    },
    inactiveContainer: {
      width: '100%',
      gap: 12,
    },
    infoBanner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.default,
      padding: 10,
      gap: 8,
    },
    infoBannerIcon: {
      marginTop: 2,
    },
    infoBannerText: {
      flex: 1,
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 17,
    },
    fetchButton: {
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
    fetchButtonText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.primary,
    },
  });
