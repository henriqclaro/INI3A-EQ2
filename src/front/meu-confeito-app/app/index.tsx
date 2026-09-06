import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Image } from 'expo-image';
import { Link, Stack } from 'expo-router';

import { CustomButton } from '@/src/components';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';

export default function WelcomeScreen() {
  const { theme } = useThemeMode();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const styles = useMemo(() => createStyles(theme, isDesktop), [theme, isDesktop]);

  return (
    <>
      <Stack.Screen options={{ title: 'Bem-Vindo' }} />

      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsHorizontalScrollIndicator={false}
        >
          <View style={styles.contentContainer}>
            <Image source={require('../assets/images/logo.svg')} style={styles.logo} />

            <Text style={styles.mainText}>Seja bem-vindo(a) ao MeuConfeito!</Text>
            <Text style={styles.text}>
              Um aplicativo pensado para auxiliar confeiteiras que desejam organizar suas produções,
              projetar suas vendas e armazenar suas receitas.
            </Text>

            <Link href="/register" asChild>
              <CustomButton title="Cadastrar como Confeiteira" variant="primary" />
            </Link>

            <Link href="/register" asChild>
              <CustomButton title="Cadastrar como Cliente" variant="secondary" />
            </Link>

            <Link href="/login" asChild>
              <CustomButton title="Já tenho cadastro" variant="neutral" />
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
      color: theme.colors.text,
      textAlign: 'center',
      padding: 15,
      fontSize: 25,
      fontWeight: 'bold',
      fontFamily: 'Playfair Display SC',
    },
    text: {
      color: theme.colors.text,
      textAlign: 'center',
      padding: 20,
      fontSize: 20,
      marginBottom: 35,
      maxWidth: 500,
    },
    logo: {
      width: 225,
      height: 225,
      marginBottom: 10,
    },
    scrollContainer: {
      padding: 10,
      width: '100%',
    },
  });
