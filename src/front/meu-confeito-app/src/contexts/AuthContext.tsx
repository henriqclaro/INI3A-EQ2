import { ReactNode, createContext, useContext, useState } from 'react';

import * as SecureStore from 'expo-secure-store';

import { AuthService, LogInData, LogInResponse } from '../services/auth';

interface AuthContextData {
  user: any | null;
  signIn: (data: LogInData) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);

  async function signIn(data: LogInData) {
    const res: LogInResponse = await AuthService.logIn(data);

    const { user, auth } = res.data;

    await SecureStore.setItemAsync('session_id', data.sessionId);
    await SecureStore.setItemAsync('access_token', auth.accessToken);
    await SecureStore.setItemAsync('refresh_token', auth.refreshToken);

    setUser(user);
  }

  async function signOut() {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');

    setUser(null);
  }

  return <AuthContext.Provider value={{ user, signIn, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context || !context.signIn) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return useContext(AuthContext);
}
