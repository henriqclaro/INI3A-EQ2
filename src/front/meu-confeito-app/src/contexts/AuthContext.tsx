import { ReactNode, createContext, useContext, useEffect, useState } from 'react';

import { AuthService, LogInData, LogInResponse } from '../services/auth';
import { Storage } from '../utils/storage';

/*
// IMPLEMENTAR LÓGICA DE ATUALIZAÇÃO DEPOIS
*/

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  pfpUrl: string | null;
  role: string;
}

interface AuthContextData {
  user: UserProfile | null;
  isLoadingStorage: boolean;
  signIn: (data: LogInData) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [isLoadingStorage, setIsLoadingStorage] = useState(true);

  useEffect(() => {
    async function loadStorageData() {
      try {
        const storedToken = await Storage.getItem('access_token');
        const storedUser = await Storage.getItem('user_profile');

        if (storedToken && storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Error loading items from Storage: ', error);
      } finally {
        setIsLoadingStorage(false);
      }
    }

    loadStorageData();
  }, []);

  async function signIn(data: LogInData) {
    const res: LogInResponse = await AuthService.logIn(data);

    const { user, auth } = res.data;

    await Storage.setItem('session_id', data.sessionId);
    await Storage.setItem('access_token', auth.accessToken);
    await Storage.setItem('refresh_token', auth.refreshToken);

    await Storage.setItem('user_profile', JSON.stringify(user));

    setUser(user);
  }

  async function signOut() {
    const refreshToken = await Storage.getItem('refresh_token');

    if (refreshToken) {
      await AuthService.logOut(refreshToken);
    }

    await Storage.removeItem('session_id');
    await Storage.removeItem('access_token');
    await Storage.removeItem('refresh_token');
    await Storage.removeItem('user_profile');

    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoadingStorage, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context || !context.signIn) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return useContext(AuthContext);
}
