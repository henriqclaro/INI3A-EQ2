import { useMemo } from 'react';
import { StyleSheet } from 'react-native';

import { BottomTabHeaderProps } from '@react-navigation/bottom-tabs';
import { NativeStackHeaderProps } from '@react-navigation/native-stack';
import { Appbar } from 'react-native-paper';

import { useThemeMode } from '../contexts/ThemeContext';
import { AppTheme } from '../theme/themes';

type CustomHeaderProps = NativeStackHeaderProps | BottomTabHeaderProps;

export const CustomHeader = ({ navigation, route, options }: CustomHeaderProps) => {
  const { theme } = useThemeMode();

  const styles = useMemo(() => createStyles(theme), [theme]);

  const title = options.title ?? route.name;

  return (
    <Appbar.Header elevated style={styles.header}>
      {/*navigation.canGoBack() && <Appbar.BackAction onPress={() => navigation.goBack()} />*/}
      <Appbar.Content title={title} style={styles.headerTitle} titleStyle={styles.headerText} />
    </Appbar.Header>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
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
