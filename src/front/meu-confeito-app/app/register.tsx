import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Link, Stack, router } from 'expo-router';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ActivityIndicator } from 'react-native-paper';

import { CustomButton, Input } from '@/src/components';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { useUserRegister } from '@/src/hooks/useUsers';
import { AppTheme } from '@/src/theme/themes';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passVef, setPassVef] = useState('');
  // const [phone, setPhone] = useState('');

  const { registerUser, isLoading } = useUserRegister();

  const { theme } = useThemeMode();

  const styles = useMemo(() => createStyles(theme), [theme]);

  async function handleRegister() {
    if (!name || !email || !password || !passVef) {
      Alert.alert('Preencha todos os campos necessários');
      return;
    }

    if (password !== passVef) {
      Alert.alert('As senhas não batem.');
      return;
    }

    if (password.length < 8) {
      Alert.alert('A senha necessitar ter ao menos 8 caracteres');
      return;
    }

    try {
      await registerUser({ name, email, password, phone: null, role: 'BAKER' });
      Alert.alert('Cadastro realizado com sucesso');

      router.replace('/login');
    } catch (_err) {
      Alert.alert('Erro ao realizar cadastro');
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Cadastro',
        }}
      />
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formContainer}>
            <View style={styles.fieldset}>
              <View style={styles.titleContainer}>
                <MaterialCommunityIcons
                  name="account-circle-outline"
                  size={26}
                  style={styles.icon}
                />
                <Text style={styles.title}>Dados pessoais</Text>
              </View>
              <Input value={name} placeholder="Nome completo" onChangeText={setName} />
              <Input
                value={email}
                placeholder="E-mail"
                onChangeText={setEmail}
                keyboardType="email-address"
              />
              <Input
                value={password}
                placeholder="Senha"
                secureTextEntry
                onChangeText={setPassword}
              />
              <Input
                value={passVef}
                placeholder="Confirmação da senha"
                secureTextEntry
                onChangeText={setPassVef}
              />
            </View>

            {/* {<View style={styles.fieldset}>
              <View style={styles.titleContainer}>
                <MaterialCommunityIcons name="phone" size={26} style={styles.icon} />
                <Text style={styles.title}>Contato</Text>
              </View>
              <Input
                value={phone}
                placeholder="Telefone"
                keyboardType="numeric"
                onChangeText={setPhone}
              />
            </View>} */}

            {/* {<View style={styles.fieldset}>
              <View style={styles.titleContainer}>
                <MaterialCommunityIcons name="map-marker" size={26} style={styles.icon} />
                <Text style={styles.title}>Localização</Text>
              </View>
              <Input placeholder="Cidade" />
              <Input placeholder="Estado" />
            </View>} */}

            <View style={styles.btnRegister}>
              {isLoading ? (
                <ActivityIndicator size="large" />
              ) : (
                <CustomButton
                  title="Cadastrar-se"
                  style={styles.button}
                  onPress={() => handleRegister()}
                />
              )}

              <Text style={styles.txtLogIn}>
                Já tem uma conta?{' '}
                <Link href="/login" asChild>
                  <Text style={styles.linkLogIn}>Entrar</Text>
                </Link>
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      alignItems: 'center',
      paddingTop: 20,
    },
    scrollContainer: {
      flexGrow: 1,
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingTop: 12,
      paddingBottom: 40,
    },
    formContainer: {
      width: '100%',
      maxWidth: 450,
      gap: 10,
    },
    fieldset: {
      width: '100%',
      alignItems: 'stretch',
      gap: 10,
    },
    titleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 2,
    },
    icon: {
      width: 26,
      height: 26,
      resizeMode: 'contain',
      marginRight: 8,
    },
    title: {
      fontSize: 19,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 2,
    },
    btnRegister: {
      marginTop: 2,
      alignItems: 'center',
      width: '100%',
    },
    txtLogIn: {
      fontSize: 15,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    linkLogIn: {
      color: theme.colors.primary,
    },
    button: {
      borderWidth: 0,
      borderRadius: 25,
      height: 50,
    },
  });
