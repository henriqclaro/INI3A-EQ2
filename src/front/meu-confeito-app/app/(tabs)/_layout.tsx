import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Tabs, useSegments } from 'expo-router';
import { CommonActions } from 'expo-router/react-navigation';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BottomNavigation } from 'react-native-paper';

import { CustomHeader } from '@/src/components';
import { useAuth } from '@/src/contexts/AuthContext';
import { useSettings } from '@/src/contexts/SettingsContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { useTabSwipe } from '@/src/hooks/useTabSwipe';
import { AppTheme } from '@/src/theme/themes';
import { isCustomer } from '@/src/utils/roles';

export default function TabsLayout() {
  const { theme } = useThemeMode();
  const { user } = useAuth();
  const { triggerHaptic } = useSettings();
  const segments = useSegments();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const isCustomerRole = isCustomer(user?.role);
  const currentTab = (segments[1] as string) || 'home';

  const swipeHandlers = useTabSwipe({
    activeTab: currentTab,
    isCustomerRole,
  });

  if (!user) {
    return null;
  }

  return (
    <View style={styles.container} {...swipeHandlers}>
      <Tabs
        screenOptions={{
          headerShown: true,
          header: (props) => <CustomHeader {...props} />,
        }}
        tabBar={({ navigation, state, descriptors, insets }) => {
          // Explicitly exclude recipes and reports tabs for customer users
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
                triggerHaptic('selection');
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
              <MaterialCommunityIcons name="book-open-variant-outline" color={color} size={24} />
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
              <MaterialCommunityIcons name="chart-box-outline" color={color} size={24} />
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
