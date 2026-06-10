import { useMemo } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import { Stack, router } from 'expo-router';

import { useThemeMode } from '@/src/theme/ThemeContext';
import { AppTheme } from '@/src/theme/themes';

export default function ReportsScreen() {
  const { theme } = useThemeMode();

  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <>
      <Stack.Screen options={{ title: 'Bem-Vindo' }} />

      <View style={styles.container}>
       {/*<Image source={require('../assets/_images/logotipo.png')} style={styles.logotipo}/>*/}
       <Text style={styles.textoPrincipal}>Seja bem-vindo(a) ao MeuConfeito!</Text>
        <Text style={styles.texto}>Um aplicativo pensado para auxiliar confeiteiras que desejam organizar suas produções, projetar suas vendas e armazenar suas receitas.</Text>
      
        <TouchableOpacity 
          style={styles.botaoLogin} 
          onPress={() => router.push('/login')} 
        >
          <Text style={styles.textoBotao}>Sou Confeiteira</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.botaoLogin} 
          onPress={() => router.push('/login')} 
        >
          <Text style={styles.textoBotao}>Sou Cliente</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.botaoCadastrar} 
          onPress={() => router.push('/register')} 
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
      justifyContent: 'center',
    },
    textoPrincipal:{
      color: '#40242B', 
      textAlign: 'center',
      padding: 15,
      fontSize: 25,
      fontWeight: 'bold',
      fontFamily: 'Playfair Display SC',
    },
    texto:{
      color: '#40242B',  
      textAlign: 'center',
      marginBottom: 35,
    },
    logotipo: {
      width: 150,   
      height: 150,  
      resizeMode: 'contain', 
      marginBottom: 20,
    },
    botaoLogin: {
      backgroundColor: '#FBA8AF', 
      width: '50%',             
      height: 48,                
      borderRadius: 10,         
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,          
      elevation: 2,
      alignSelf: 'center',
      borderColor: '#C53557', 
      borderWidth: 1.5,
    },
    botaoCadastrar: {
      backgroundColor: '#FFFFFF',
      width: '35%',
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

  });
