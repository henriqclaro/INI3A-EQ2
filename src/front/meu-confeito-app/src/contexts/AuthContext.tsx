import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { isRateLimitError, requestTokenRefresh, setAuthFailureListener } from '../services/api';
import { AuthService, LogInData, LogInResponse } from '../services/auth';
import { UserService } from '../services/user';
import { Storage } from '../utils/storage';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  pfpUrl: string | null;
  role: string;
  updatedAt?: string | Date;
}

interface AuthContextData {
  user: UserProfile | null;
  isLoadingStorage: boolean;
  signIn: (data: LogInData) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (updatedUser: Partial<UserProfile>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoadingStorage, setIsLoadingStorage] = useState(true);

  useEffect(() => {
    setAuthFailureListener(() => {
      setUser(null);
    });

    return () => {
      setAuthFailureListener(null);
    };
  }, []);

  const updateUser = useCallback(async (updatedData: Partial<UserProfile>) => {
    // Filter out undefined keys so partial updates don't overwrite existing user data
    const cleanUpdates: Partial<UserProfile> = {};
    for (const [key, value] of Object.entries(updatedData)) {
      if (value !== undefined) {
        cleanUpdates[key as keyof UserProfile] = value as never;
      }
    }

    setUser((prevUser) => {
      const currentUser = prevUser;
      if (!currentUser) {
        Storage.getItem('user_profile').then((stored) => {
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              const updated = { ...parsed, ...cleanUpdates };
              Storage.setItem('user_profile', JSON.stringify(updated));
              setUser(updated);
            } catch (e) {
              console.error('Error parsing stored user profile:', e);
            }
          }
        });
        return prevUser;
      }

      const isChanged = Object.entries(cleanUpdates).some(
        ([key, val]) => currentUser[key as keyof UserProfile] !== val,
      );

      if (!isChanged) {
        return currentUser;
      }

      const newUser: UserProfile = { ...currentUser, ...cleanUpdates };
      Storage.setItem('user_profile', JSON.stringify(newUser));
      return newUser;
    });
  }, []);

  const refreshUser = useCallback(async () => {
    let currentUserId: string | undefined;
    setUser((prev) => {
      currentUserId = prev?.id;
      return prev;
    });

    if (!currentUserId) {
      const stored = await Storage.getItem('user_profile');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          currentUserId = parsed?.id;
        } catch (e) {
          console.error('Error parsing stored user profile for refresh:', e);
        }
      }
    }

    if (!currentUserId) return;

    try {
      const res = await UserService.getById(currentUserId);
      if (res?.data?.user) {
        await updateUser(res.data.user);
      }
    } catch (err) {
      console.warn('Failed to refresh user profile from server:', err);
    }
  }, [updateUser]);

  useEffect(() => {
    async function loadStorageData() {
      try {
        await Storage.prewarmTokens();
        const storedToken = await Storage.getItem('access_token');
        const storedRefreshToken = await Storage.getItem('refresh_token');
        const storedUser = await Storage.getItem('user_profile');

        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          if (storedToken) {
            setUser(parsedUser);
          } else if (storedRefreshToken) {
            try {
              await requestTokenRefresh(storedRefreshToken);
              setUser(parsedUser);
            } catch (refreshErr) {
              if (isRateLimitError(refreshErr)) {
                // Keep the stored user session so rate limiting does not wipe the account
                setUser(parsedUser);
              } else {
                await Storage.removeItem('access_token');
                await Storage.removeItem('refresh_token');
                await Storage.removeItem('user_profile');
                setUser(null);
              }
            }
          }
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

      if (refreshToken && refreshToken !== 'undefined' && refreshToken !== 'null') {
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

  const contextValue = useMemo(
    () => ({ user, isLoadingStorage, signIn, signOut, updateUser, refreshUser }),
    [user, isLoadingStorage, signIn, signOut, updateUser, refreshUser],
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
