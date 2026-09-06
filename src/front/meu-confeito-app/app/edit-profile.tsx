import { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Image } from 'expo-image';
import { Stack, router } from 'expo-router';

import { CustomButton, Input } from '@/src/components';
import { useAuth } from '@/src/contexts/AuthContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { useUserEdit } from '@/src/hooks/useUsers';
import { AppTheme } from '@/src/theme/themes';

export default function EditProfileScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const { theme } = useThemeMode();
  const { user } = useAuth();
  const { editUser } = useUserEdit();

  const styles = useMemo(() => createStyles(theme), [theme]);

  async function handleEdit() {
    const data = {
      name: name !== user?.name && name.length >= 3 ? name : undefined,
      email: email !== user?.email && email !== '' ? email : undefined,
    };

    try {
      await editUser(data, user!.id);
      user!.name = name || user!.name;
      user!.email = email || user!.email;
      router.push('/profile');
    } catch (error) {
      Alert.alert('Erro ao editar usuário.');
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Editar Perfil' }} />

      <View style={styles.container}>
        {/* <BackButton /> */}
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
      paddingHorizontal: 20,
      paddingTop: 20,
      gap: 12,
    },
    image: {
      backgroundColor: theme.colors.placeholder,
      width: 140,
      height: 140,
      borderRadius: 70,
      borderWidth: 3,
      borderColor: theme.colors.primary,
      marginBottom: 10,
    },
    btnSave: {
      position: 'absolute',
      bottom: 24,
      width: '100%',
      maxWidth: 400,
    },
  });
