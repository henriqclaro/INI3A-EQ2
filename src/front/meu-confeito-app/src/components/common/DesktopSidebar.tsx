import type { ComponentProps } from 'react';
import { useMemo } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Tabs, router } from 'expo-router';
import { CommonActions } from 'expo-router/react-navigation';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useAuth } from '@/src/contexts/AuthContext';
import {
  SIDEBAR_COLLAPSED_WIDTH,
  SIDEBAR_EXPANDED_WIDTH,
  SidebarPosition,
  useSettings,
} from '@/src/contexts/SettingsContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';
import { getRoleLabel, isStaff } from '@/src/utils/roles';

import { UserAvatar } from './UserAvatar';

type TabsProps = ComponentProps<typeof Tabs>;
type TabBarProps = Parameters<NonNullable<TabsProps['tabBar']>>[0];

export interface DesktopSidebarProps extends TabBarProps {
  isCustomerRole: boolean;
}

export function DesktopSidebar({
  state,
  descriptors,
  navigation,
  isCustomerRole,
}: DesktopSidebarProps) {
  const { theme, isDarkMode, isHighContrast, toggleTheme } = useThemeMode();
  const { user, signOut } = useAuth();
  const { sidebarPosition, isSidebarCollapsed, toggleSidebarCollapsed, setIsSidebarCollapsed } =
    useSettings();

  const styles = useMemo(
    () => createStyles(theme, isSidebarCollapsed, sidebarPosition, isHighContrast),
    [theme, isSidebarCollapsed, sidebarPosition, isHighContrast],
  );

  const isStaffRole = isStaff(user?.role);
  const hiddenTabNames = isCustomerRole ? ['recipes', 'analytics'] : [];
  const visibleRoutes = state.routes.filter((route) => !hiddenTabNames.includes(route.name));

  const roleLabel = getRoleLabel(user?.role).toUpperCase();

  const quickLinks = useMemo(
    () => [
      {
        id: 'stock',
        label: 'Estoque',
        icon: 'package-variant-closed' as const,
        path: '/stock' as const,
      },
      {
        id: 'operations-history',
        label: 'Histórico Operacional',
        icon: 'clipboard-text-clock-outline' as const,
        path: '/operations-history' as const,
      },
      {
        id: 'saved-recipes',
        label: 'Receitas Salvas',
        icon: 'bookmark-multiple-outline' as const,
        path: '/saved-recipes' as const,
      },
      {
        id: 'public-recipes',
        label: 'Receitas Públicas',
        icon: 'book-search-outline' as const,
        path: '/public-recipes' as const,
      },
      ...(isCustomerRole || isStaffRole
        ? [
            {
              id: 'search-bakers',
              label: 'Buscar Confeitarias',
              icon: 'store-search-outline' as const,
              path: '/search-bakers' as const,
            },
          ]
        : []),
      ...(isStaffRole
        ? [
            {
              id: 'management',
              label: 'Painel de Gestão',
              icon: 'shield-crown-outline' as const,
              path: '/management' as const,
            },
          ]
        : []),
    ],
    [isCustomerRole, isStaffRole],
  );

  const handleQuickLogOut = () => {
    Alert.alert('Sair da Conta', 'Deseja realmente encerrar sua sessão?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          try {
            router.replace('/');
            await signOut();
          } catch (error) {
            console.error('Error signing out:', error);
          }
        },
      },
    ]);
  };

  const collapseIconName =
    sidebarPosition === 'left'
      ? isSidebarCollapsed
        ? 'chevron-right'
        : 'chevron-left'
      : isSidebarCollapsed
        ? 'chevron-left'
        : 'chevron-right';

  return (
    <View style={styles.sidebar}>
      {/* Brand Header */}
      {isSidebarCollapsed ? (
        <View style={styles.brandHeaderCollapsed}>
          <TouchableOpacity
            style={styles.collapseButtonBox}
            onPress={toggleSidebarCollapsed}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Expandir barra lateral"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons
              name={collapseIconName}
              size={22}
              color={theme.colors.onSurfaceVariant}
            />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.brandHeader, sidebarPosition === 'right' && styles.brandHeaderRight]}>
          <TouchableOpacity
            style={styles.collapseButtonBox}
            onPress={toggleSidebarCollapsed}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Recolher barra lateral"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons
              name={collapseIconName}
              size={20}
              color={theme.colors.onSurfaceVariant}
            />
          </TouchableOpacity>
          <View style={styles.brandTitleContainer}>
            <Text style={styles.brandTitle} numberOfLines={1}>
              Meu Confeito
            </Text>
            <Text style={styles.brandSubtitle} numberOfLines={1}>
              {isCustomerRole ? 'DOCERIAS & AFETOS' : 'ATELIÊ DO CONFEITEIRO'}
            </Text>
          </View>
        </View>
      )}

      {/* Main Navigation Scroll Area */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollArea}
      >
        {/* Primary Tabs */}
        <View style={styles.navGroup}>
          {!isSidebarCollapsed && <Text style={styles.groupLabel}>MENU PRINCIPAL</Text>}
          {visibleRoutes.map((route) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === state.routes.findIndex((r) => r.key === route.key);
            const label = (options.tabBarLabel as string) || options.title || route.name;

            const handlePress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.dispatch({
                  ...CommonActions.navigate(route.name, route.params),
                  target: state.key,
                });
              }
            };

            return (
              <TouchableOpacity
                key={route.key}
                style={[
                  styles.navItem,
                  isFocused && styles.navItemActive,
                  isSidebarCollapsed && styles.navItemCollapsed,
                ]}
                onPress={handlePress}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityState={{ selected: isFocused }}
                accessibilityLabel={label}
              >
                {isFocused && (
                  <View
                    style={[
                      styles.activeIndicator,
                      sidebarPosition === 'right'
                        ? styles.activeIndicatorRight
                        : styles.activeIndicatorLeft,
                    ]}
                  />
                )}
                <View style={styles.iconSlot}>
                  {options.tabBarIcon ? (
                    options.tabBarIcon({
                      focused: isFocused,
                      color: isFocused ? theme.colors.primary : theme.colors.onSurfaceVariant,
                      size: 22,
                    })
                  ) : (
                    <MaterialCommunityIcons
                      name="circle-outline"
                      size={20}
                      color={isFocused ? theme.colors.primary : theme.colors.onSurfaceVariant}
                    />
                  )}
                </View>
                {!isSidebarCollapsed && (
                  <Text
                    style={[styles.navLabel, isFocused && styles.navLabelActive]}
                    numberOfLines={1}
                  >
                    {label}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Collapsed Internal Minimalist Divider between Menu Principal and Gestão do Ateliê */}
        {isSidebarCollapsed && !isCustomerRole && (
          <View style={styles.collapsedDividerContainer}>
            <View style={styles.collapsedDivider} />
          </View>
        )}

        {/* Baker Workspace Shortcuts */}
        {!isCustomerRole && (
          <View style={styles.navGroup}>
            {!isSidebarCollapsed && <Text style={styles.groupLabel}>GESTÃO DO ATELIÊ</Text>}
            {quickLinks.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.navItem, isSidebarCollapsed && styles.navItemCollapsed]}
                onPress={() => router.push(item.path)}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={item.label}
              >
                <View style={styles.iconSlot}>
                  <MaterialCommunityIcons
                    name={item.icon}
                    size={22}
                    color={theme.colors.onSurfaceVariant}
                  />
                </View>
                {!isSidebarCollapsed && (
                  <Text style={styles.navLabel} numberOfLines={1}>
                    {item.label}
                  </Text>
                )}
              </TouchableOpacity>
            ))}

            {isSidebarCollapsed ? (
              <TouchableOpacity
                style={styles.createButtonCollapsed}
                onPress={() => router.push('/create-recipe')}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Criar nova receita"
              >
                <MaterialCommunityIcons name="plus" size={22} color={theme.colors.onPrimary} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => router.push('/create-recipe')}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Criar nova receita"
              >
                <MaterialCommunityIcons name="plus" size={18} color={theme.colors.onPrimary} />
                <Text style={styles.createButtonText}>Nova Receita</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* User Footer with Theme Toggle & Settings */}
      {isSidebarCollapsed ? (
        <View style={styles.userFooterCollapsed}>
          <TouchableOpacity
            style={styles.avatarButtonCollapsed}
            onPress={() => router.navigate('/(tabs)/profile')}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Acessar perfil de usuário"
          >
            <UserAvatar
              url={user?.pfpUrl}
              updatedAt={user?.updatedAt}
              name={user?.name || (isCustomerRole ? 'Cliente' : 'Confeiteira')}
              size={40}
              fallbackType="initial"
              fallbackBackgroundColor={theme.colors.primaryFixed}
              borderColor={theme.colors.outlineVariant}
              borderWidth={1}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.collapsedMoreOptionsButton}
            onPress={() => setIsSidebarCollapsed(false)}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Expandir opções da barra lateral"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons
              name="dots-horizontal"
              size={20}
              color={theme.colors.onSurfaceVariant}
            />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.userFooter}>
          <TouchableOpacity
            style={styles.userInfoButton}
            onPress={() => router.navigate('/(tabs)/profile')}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Acessar perfil de usuário"
          >
            <UserAvatar
              url={user?.pfpUrl}
              updatedAt={user?.updatedAt}
              name={user?.name || (isCustomerRole ? 'Cliente' : 'Confeiteira')}
              size={38}
              fallbackType="initial"
              fallbackBackgroundColor={theme.colors.primaryFixed}
              borderColor={theme.colors.outlineVariant}
              borderWidth={1}
            />
            <View style={styles.userNameCol}>
              <Text style={styles.userName} numberOfLines={1}>
                {user?.name || (isCustomerRole ? 'Cliente' : 'Confeiteira')}
              </Text>
              <View style={styles.roleChip}>
                <Text style={styles.roleChipText}>{roleLabel}</Text>
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.footerActionsRow}>
            <TouchableOpacity
              style={styles.footerIconButton}
              onPress={toggleTheme}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={isDarkMode ? 'Ativar modo claro' : 'Ativar modo escuro'}
            >
              <MaterialCommunityIcons
                name={isDarkMode ? 'weather-sunny' : 'weather-night'}
                size={20}
                color={theme.colors.onSurfaceVariant}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.footerIconButton}
              onPress={() => router.push('/settings')}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Abrir configurações"
            >
              <MaterialCommunityIcons
                name="cog-outline"
                size={20}
                color={theme.colors.onSurfaceVariant}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.footerIconButton, styles.footerLogoutButton]}
              onPress={handleQuickLogOut}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Sair da conta"
            >
              <MaterialCommunityIcons name="logout" size={20} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const createStyles = (
  theme: AppTheme,
  isSidebarCollapsed: boolean,
  sidebarPosition: SidebarPosition,
  isHighContrast: boolean,
) =>
  StyleSheet.create({
    sidebar: {
      width: isSidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH,
      height: '100%',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRightWidth: sidebarPosition === 'left' ? 1 : 0,
      borderRightColor: theme.colors.outlineVariant,
      borderLeftWidth: sidebarPosition === 'right' ? 1 : 0,
      borderLeftColor: theme.colors.outlineVariant,
      justifyContent: 'space-between',
      ...theme.shadows.soft,
    },
    brandHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.space4,
      paddingTop: theme.spacing.space5,
      paddingBottom: theme.spacing.space4,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
      gap: theme.spacing.space3,
    },
    brandHeaderRight: {
      flexDirection: 'row-reverse',
    },
    brandHeaderCollapsed: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: theme.spacing.space5,
      paddingBottom: theme.spacing.space4,
      paddingHorizontal: theme.spacing.space2,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
    },
    collapseButtonBox: {
      width: 40,
      height: 40,
      borderRadius: theme.rounded.md,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },
    brandTitleContainer: {
      flex: 1,
      gap: 2,
    },
    brandTitle: {
      fontFamily: theme.typography.headlineLg.fontFamily,
      fontSize: 18,
      color: theme.colors.espressoDark,
      letterSpacing: 0.4,
    },
    brandSubtitle: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 9,
      fontWeight: '700',
      color: theme.colors.primary,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    scrollArea: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: isSidebarCollapsed ? theme.spacing.space2 : theme.spacing.space3,
      paddingVertical: theme.spacing.space4,
      gap: isSidebarCollapsed ? theme.spacing.space2 : theme.spacing.space5,
      alignItems: isSidebarCollapsed ? 'center' : 'stretch',
    },
    navGroup: {
      gap: theme.spacing.space1,
      width: '100%',
    },
    collapsedDividerContainer: {
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 2,
      marginVertical: theme.spacing.space1,
    },
    collapsedDivider: {
      width: 28,
      height: isHighContrast ? 1.5 : 1,
      backgroundColor: isHighContrast ? theme.colors.outline : theme.colors.outlineVariant,
      borderRadius: theme.rounded.full,
    },
    groupLabel: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 10,
      fontWeight: '700',
      color: theme.colors.onSurfaceVariant,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      paddingHorizontal: theme.spacing.space3,
      marginBottom: theme.spacing.space1,
    },
    navItem: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 48,
      paddingHorizontal: theme.spacing.space3,
      borderRadius: theme.rounded.md,
      gap: theme.spacing.space3,
      position: 'relative',
    },
    navItemCollapsed: {
      width: 48,
      height: 48,
      minHeight: 48,
      paddingHorizontal: 0,
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
      borderRadius: theme.rounded.md,
    },
    navItemActive: {
      backgroundColor: theme.colors.surfaceContainerHigh,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    activeIndicator: {
      position: 'absolute',
      top: 10,
      bottom: 10,
      width: 3.5,
      borderRadius: theme.rounded.full,
      backgroundColor: theme.colors.primary,
    },
    activeIndicatorLeft: {
      left: 0,
    },
    activeIndicatorRight: {
      right: 0,
    },
    iconSlot: {
      width: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    navLabel: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.onSurfaceVariant,
      flex: 1,
    },
    navLabelActive: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontWeight: '700',
      color: theme.colors.espressoDark,
    },
    createButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.space2,
      backgroundColor: theme.colors.primary,
      minHeight: 48,
      borderRadius: theme.rounded.full,
      marginTop: theme.spacing.space3,
      paddingHorizontal: theme.spacing.space4,
      ...theme.shadows.glow,
    },
    createButtonCollapsed: {
      width: 44,
      height: 44,
      minHeight: 44,
      borderRadius: theme.rounded.full,
      backgroundColor: theme.colors.primary,
      alignSelf: 'center',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: theme.spacing.space3,
      ...theme.shadows.glow,
    },
    createButtonText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.onPrimary,
      letterSpacing: 0.3,
    },
    userFooter: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
      paddingHorizontal: theme.spacing.space3,
      paddingVertical: theme.spacing.space3,
      backgroundColor: theme.colors.surfaceContainerLowest,
      gap: theme.spacing.space2,
    },
    userFooterCollapsed: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
      paddingVertical: theme.spacing.space3,
      backgroundColor: theme.colors.surfaceContainerLowest,
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.space2,
    },
    avatarButtonCollapsed: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    collapsedMoreOptionsButton: {
      width: 36,
      height: 24,
      borderRadius: theme.rounded.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    userInfoButton: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 48,
      paddingHorizontal: theme.spacing.space2,
      borderRadius: theme.rounded.md,
      gap: theme.spacing.space3,
    },
    userNameCol: {
      flex: 1,
      gap: 2,
    },
    userName: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.espressoDark,
    },
    roleChip: {
      alignSelf: 'flex-start',
      backgroundColor: theme.colors.surfaceContainerHigh,
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: theme.rounded.full,
    },
    roleChipText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 9,
      fontWeight: '700',
      color: theme.colors.primary,
      letterSpacing: 0.4,
    },
    footerActionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: theme.spacing.space1,
      paddingTop: theme.spacing.space1,
    },
    footerIconButton: {
      width: 48,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.rounded.md,
    },
    footerLogoutButton: {
      backgroundColor: theme.colors.surfaceContainerLow,
    },
  });
