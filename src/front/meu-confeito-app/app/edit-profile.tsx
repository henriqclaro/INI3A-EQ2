import { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Image } from 'expo-image';
import { Stack, router } from 'expo-router';

import { BackButton, CustomButton, Input } from '@/src/components';
import { useAuth } from '@/src/contexts/AuthContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { UserService } from '@/src/services/user';
import { AppTheme } from '@/src/theme/themes';

export default function EditProfileScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const { theme } = useThemeMode();

  const { user } = useAuth();

  const styles = useMemo(() => createStyles(theme), [theme]);

  async function handleEdit() {
    const data = {
      name: name !== user?.name && name.length >= 3 ? name : undefined,
      email: email !== user?.email && email !== '' ? email : undefined,
    };

    try {
      await UserService.edit(data, user!.id);
      user!.name = name;
      user!.email = email;
      router.push('/profile');
    } catch (error) {
      console.log('Error editing user: ', error);
      Alert.alert('Erro ao editar usuário.');
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Editar Perfil' }} />

      <View style={styles.container}>
        <BackButton />
        {user?.pfpUrl ? (
          <Image
            source={{ uri: user?.pfpUrl }}
            alt="Foto de Perfil"
            style={styles.image}
            contentFit="cover"
          />
        ) : (
          <View style={styles.image}></View>
        )}
        <Input value={user?.name} placeholder="Nome de Usuário" onChangeText={setName} />
        <Input
          value={user?.email}
          placeholder="Email de Usuário"
          keyboardType="email-address"
          onChangeText={setEmail}
        />
        {/*<Input
          value={user?.phone ? user.phone : ''}
          placeholder="Telefone de Usuário"
          keyboardType="number-pad"
        />*/}
        <CustomButton
          title="Salvar"
          variant="secondary"
          style={styles.btnSave}
          onPress={handleEdit}
        />
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
    },
    image: {
      backgroundColor: theme.colors.placeholder,
      width: 200,
      height: 200,
      borderRadius: 100,
      margin: 10,
    },
    btnSave: {
      position: 'absolute',
      bottom: 20,
    },
  });
