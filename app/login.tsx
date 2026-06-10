import { useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput } from 'react-native';

import { Stack, router } from 'expo-router';

import { BackButton } from '@/src/components';
import { useThemeMode } from '@/src/theme/ThemeContext';
import { AppTheme } from '@/src/theme/themes';

export default function ReportsScreen() {
  const { theme } = useThemeMode();

  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <>
      <Stack.Screen options={{ title: 'Login' }} />

      <View style={styles.container}>
        <BackButton route="/welcome" />
        <Text style={styles.textoPrincipal}>Digite seus dados:</Text>

        <TextInput
          style={styles.input}
          placeholder="@email"
          placeholderTextColor='#40242B'
          keyboardType="email-address"   
          autoCapitalize="none"          
  />

        <TextInput
          style={styles.input}
          placeholder="senha"
          placeholderTextColor='#40242B'
          secureTextEntry={true}         
          autoCapitalize="none"
        />

        {/*<TouchableOpacity 
    style={styles.containerEsqueciSenha}
    onPress={() => router.push('/ESqueci')} 
  >
    <Text style={styles.textoEsqueciSenha}>Esqueci a senha</Text>
  </TouchableOpacity>*/}

      <TouchableOpacity 
          style={styles.botaoEnviar} 
          onPress={() => router.push('/home')} 
          >
          <Text style={styles.textoBotao}>Cadastrar</Text>
      </TouchableOpacity>

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
      paddingTop: 60,
    },
    textoPrincipal: {
      color: '#40242B', 
      textAlign: 'center',
      marginTop: 20,     
      marginBottom: 1,
      padding: 60,
      fontSize: 28,
      fontWeight: 'bold',
      fontFamily: 'Playfair Display SC',
    },
    botaoEnviar: {
      backgroundColor: '#FFFFFF',
      width: '25%',
      height: 48,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: '#F69AA5',    
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 10,             
      elevation: 1,
      alignSelf: 'center',
    },
    textoBotao: {
      color: '#40242B', 
      fontSize: 16,
      fontWeight: 'bold',
    },
    input: {
      backgroundColor: '#FBA8AF', 
      width: '50%',                
      height: 50,                 
      borderRadius: 10,           
      paddingHorizontal: 15,       
      fontSize: 16,
      color: '#40242B',
      borderColor: '#C53557',   
      borderWidth: 1.5,           
      marginBottom: 20,
    },
    containerEsqueciSenha: {
      marginBottom: 20,
    },
    textoEsqueciSenha: {
      color: '#40242B',
      fontSize: 14,
      fontWeight: 'bold',
    },
  });
