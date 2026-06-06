import { StyleSheet } from 'react-native';

import { BottomTabHeaderProps } from '@react-navigation/bottom-tabs';
import { NativeStackHeaderProps } from '@react-navigation/native-stack';
import { Appbar } from 'react-native-paper';

import { useThemeMode } from '../theme/ThemeContext';

type CustomHeaderProps = NativeStackHeaderProps | BottomTabHeaderProps;

export const CustomHeader = ({ navigation, route, options }: CustomHeaderProps) => {
  const { theme } = useThemeMode();

  const styles = StyleSheet.create({
    header: {
      backgroundColor: theme.colors.primary,
    },
    headerTitle: {
      alignItems: 'center',
    },
    headerText: {
      fontSize: 32,
    },
  });

  const title = options.title ?? route.name;

  return (
    <Appbar.Header elevated style={styles.header}>
      {/*navigation.canGoBack() && <Appbar.BackAction onPress={() => navigation.goBack()} />*/}
      <Appbar.Content title={title} style={styles.headerTitle} titleStyle={styles.headerText} />
    </Appbar.Header>
  );
};
