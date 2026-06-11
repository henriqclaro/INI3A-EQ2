import { Tabs } from 'expo-router';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { CommonActions } from '@react-navigation/native';
import { BottomNavigation } from 'react-native-paper';

// import { CustomHeader } from '@/src/components';
import { useThemeMode } from '@/src/contexts/ThemeContext';

export default function TabsLayout() {
  const { theme } = useThemeMode();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // header: (props) => <CustomHeader {...props} />,
      }}
      tabBar={({ navigation, state, descriptors, insets }) => (
        <BottomNavigation.Bar
          navigationState={state}
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
              return options.tabBarIcon({ focused, color, size: 26 });
            }

            return null;
          }}
          getLabelText={({ route }) => {
            const { options } = descriptors[route.key];
            return (options.tabBarLabel as string) || options.title || route.name;
          }}
          shifting={true}
          labeled={true}
          style={{
            backgroundColor: theme.colors.primary,
          }}
        />
      )}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Início',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="home" color={color} size={26} />,
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          title: 'Receitas',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="book-edit" color={color} size={26} />
          ),
        }}
      />
      {/*<Tabs.Screen
        name="reports"
        options={{
          title: 'Relatórios',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="chart-bar" color={color} size={26} />
          ),
        }}
      />*/}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="account" color={color} size={26} />
          ),
        }}
      />
    </Tabs>
  );
}
