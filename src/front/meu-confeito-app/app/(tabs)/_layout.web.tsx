import { useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { Tabs } from 'expo-router';
import { CommonActions } from 'expo-router/react-navigation';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BottomNavigation } from 'react-native-paper';

import { CustomHeader, DesktopSidebar } from '@/src/components';
import { useAuth } from '@/src/contexts/AuthContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';
import { isCustomer } from '@/src/utils/roles';

export default function TabsWebLayout() {
  const { theme } = useThemeMode();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= theme.breakpoints.lg;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const isCustomerRole = isCustomer(user?.role);

  if (!user) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: true,
          tabBarPosition: isDesktop ? 'left' : 'bottom',
          header: (props) => <CustomHeader {...props} />,
        }}
        tabBar={(tabBarProps) => {
          if (isDesktop) {
            return <DesktopSidebar {...tabBarProps} isCustomerRole={isCustomerRole} />;
          }

          const { navigation, state, descriptors, insets } = tabBarProps;
          const hiddenTabNames = isCustomerRole ? ['recipes', 'reports'] : [];
          const visibleRoutes = state.routes.filter(
            (route) => !hiddenTabNames.includes(route.name),
          );

          const currentRoute = state.routes[state.index];
          const visibleIndex = visibleRoutes.findIndex((r) => r.key === currentRoute?.key);

          const filteredNavigationState = {
            ...state,
            index: visibleIndex >= 0 ? visibleIndex : 0,
            routes: visibleRoutes,
          };

          return (
            <BottomNavigation.Bar
              navigationState={filteredNavigationState}
              safeAreaInsets={insets}
              onTabPress={({ route, preventDefault }) => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });

                if (event.defaultPrevented) {
                  preventDefault();
                } else {
                  navigation.dispatch({
                    ...CommonActions.navigate(route.name, route.params),
                    target: state.key,
                  });
                }
              }}
              renderIcon={({ route, focused, color }) => {
                const { options } = descriptors[route.key];

                if (options.tabBarIcon) {
                  return options.tabBarIcon({ focused, color, size: 24 });
                }

                return null;
              }}
              getLabelText={({ route }) => {
                const { options } = descriptors[route.key];
                return (options.tabBarLabel as string) || options.title || route.name;
              }}
              shifting={false}
              labeled={true}
              activeColor={theme.colors.onSecondaryContainer}
              inactiveColor={theme.colors.onSurfaceVariant}
              theme={{
                colors: {
                  secondaryContainer: theme.colors.secondaryContainer,
                },
              }}
              style={styles.tabBar}
            />
          );
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: isCustomerRole ? 'Confeitarias' : 'Início',
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons
                name={isCustomerRole ? 'store-search-outline' : 'home-outline'}
                color={color}
                size={24}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="recipes"
          options={{
            title: 'Suas Receitas',
            href: isCustomerRole ? null : undefined,
            tabBarItemStyle: isCustomerRole ? { display: 'none' } : undefined,
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="book-open-page-variant-outline" color={color} size={24} />
            ),
          }}
        />
        <Tabs.Screen
          name="reports"
          options={{
            title: 'Relatórios',
            href: isCustomerRole ? null : undefined,
            tabBarItemStyle: isCustomerRole ? { display: 'none' } : undefined,
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="chart-timeline-variant" color={color} size={24} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Perfil',
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="account-outline" color={color} size={24} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    tabBar: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
    },
  });
