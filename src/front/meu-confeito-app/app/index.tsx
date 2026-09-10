import { useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

import { Image } from 'expo-image';
import { Link, Stack } from 'expo-router';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { CustomButton } from '@/src/components';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';

export default function WelcomeScreen() {
  const { theme, isDarkMode, toggleTheme } = useThemeMode();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const styles = useMemo(() => createStyles(theme, isDesktop), [theme, isDesktop]);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Bem-Vindo',
          headerRight: () => (
            <TouchableOpacity
              style={styles.headerThemeBtn}
              onPress={toggleTheme}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={isDarkMode ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons
                name={isDarkMode ? 'weather-sunny' : 'weather-night'}
                size={22}
                color={theme.colors.espressoDark}
              />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsHorizontalScrollIndicator={false}
        >
          <View style={styles.contentContainer}>
            <Image
              source={
                isDarkMode
                  ? require('@/assets/images/logo-dark.png')
                  : require('@/assets/images/logo-light.png')
              }
              style={styles.logo}
              contentFit="contain"
            />

            <Text style={styles.mainText}>Seja bem-vindo(a) ao MeuConfeito!</Text>
            <Text style={styles.text}>
              Um aplicativo pensado para auxiliar confeiteiras que desejam organizar suas produções,
              projetar suas vendas e armazenar suas receitas.
            </Text>

            {/* This should send the 'BAKER' role*/}
            <Link
              href={{
                pathname: '/register',
                params: { role: 'BAKER' },
              }}
              asChild
            >
              <CustomButton
                title="Cadastrar como Confeiteira"
                variant="primary"
                style={styles.actionButton}
              />
            </Link>

            {/* This should send the 'CUSTOMER' role*/}
            <Link
              href={{
                pathname: '/register',
                params: { role: 'CUSTOMER' },
              }}
              asChild
            >
              <CustomButton
                title="Cadastrar como Cliente"
                variant="secondary"
                style={styles.actionButton}
              />
            </Link>

            <Link href="/login" asChild>
              <CustomButton
                title="Já tenho cadastro"
                variant="neutral"
                style={styles.actionButton}
              />
            </Link>
          </View>
        </ScrollView>
        {/* Foto que aparece no PC */}
        {isDesktop && (
          <View style={styles.imageContainer}>
            <Image
              source={require('../assets/images/index-image.jpg')}
              style={styles.backgroundImage}
              contentFit="cover"
            />
          </View>
        )}
      </View>
    </>
  );
}
const createStyles = (theme: AppTheme, isDesktop: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      flexDirection: isDesktop ? 'row' : 'column',
    },
    contentContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: isDesktop ? 'flex-start' : 'center',
      paddingTop: isDesktop ? 40 : 20,
      paddingHorizontal: 20,
    },
    imageContainer: {
      width: isDesktop ? 650 : '100%',
      height: isDesktop ? '100%' : 250,
      justifyContent: 'center',
      alignItems: 'flex-end',
    },
    backgroundImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'contain',
    },
    mainText: {
      color: theme.colors.espressoDark,
      textAlign: 'center',
      paddingHorizontal: 15,
      paddingVertical: 10,
      fontSize: 26,
      fontWeight: '600',
      fontFamily: theme.typography.headlineLg.fontFamily,
    },
    text: {
      color: theme.colors.onSurfaceVariant,
      fontFamily: theme.typography.bodyMd.fontFamily,
      textAlign: 'center',
      paddingHorizontal: 20,
      fontSize: 16,
      lineHeight: 24,
      marginBottom: 35,
      maxWidth: 500,
    },
    logo: {
      width: 200,
      height: 200,
      marginBottom: 10,
    },
    scrollContainer: {
      padding: 10,
      width: '100%',
      gap: 12,
    },
    actionButton: {
      width: isDesktop ? 340 : 300,
      maxWidth: '100%',
    },
    headerThemeBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      marginRight: 8,
    },
  });
