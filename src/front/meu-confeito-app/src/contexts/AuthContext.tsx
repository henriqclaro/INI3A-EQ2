import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { AuthService, LogInData, LogInResponse } from '../services/auth';
import { Storage } from '../utils/storage';

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
  updateUser: (updatedUser: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoadingStorage, setIsLoadingStorage] = useState(true);

  useEffect(() => {
    async function loadStorageData() {
      try {
        await Storage.prewarmTokens();
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

  const signIn = useCallback(async (data: LogInData) => {
    const res: LogInResponse = await AuthService.logIn(data);

    const { user: loggedUser, auth } = res.data;

    await Storage.setItem('session_id', data.sessionId);
    await Storage.setItem('access_token', auth.accessToken);
    await Storage.setItem('refresh_token', auth.refreshToken);

    await Storage.setItem('user_profile', JSON.stringify(loggedUser));

    setUser(loggedUser);
  }, []);

  const signOut = useCallback(async () => {
    try {
      const refreshToken = await Storage.getItem('refresh_token');

      if (refreshToken) {
        await AuthService.logOut(refreshToken).catch((err) => {
          console.warn('Remote logout failed, proceeding with local logout:', err);
        });
      }
    } catch (error) {
      console.warn('Error during signOut process:', error);
    } finally {
      await Storage.removeItem('session_id');
      await Storage.removeItem('access_token');
      await Storage.removeItem('refresh_token');
      await Storage.removeItem('user_profile');

      setUser(null);
    }
  }, []);

  const updateUser = useCallback(
    async (updatedData: Partial<UserProfile>) => {
      // Filter out undefined keys so partial updates don't overwrite existing user data
      const cleanUpdates: Partial<UserProfile> = {};
      for (const [key, value] of Object.entries(updatedData)) {
        if (value !== undefined) {
          cleanUpdates[key as keyof UserProfile] = value as never;
        }
      }

      let currentUser = user;
      if (!currentUser) {
        const stored = await Storage.getItem('user_profile');
        if (stored) {
          try {
            currentUser = JSON.parse(stored);
          } catch (e) {
            console.error('Error parsing stored user profile:', e);
          }
        }
      }

      if (!currentUser) return;

      const newUser: UserProfile = { ...currentUser, ...cleanUpdates };
      await Storage.setItem('user_profile', JSON.stringify(newUser));
      setUser(newUser);
    },
    [user],
  );

  const contextValue = useMemo(
    () => ({ user, isLoadingStorage, signIn, signOut, updateUser }),
    [user, isLoadingStorage, signIn, signOut, updateUser],
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context || !context.signIn) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return useContext(AuthContext);
}
