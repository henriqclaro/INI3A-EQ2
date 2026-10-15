import { useCallback, useEffect, useState } from 'react';

import { AuthService, ResetPasswordData } from '../services/auth';
import {
  RegisterUserInventoryData,
  SearchUserItem,
  UserEditData,
  UserInventoryItem,
  UserRegisterData,
  UserService,
} from '../services/user';

export type { SearchUserItem };

export function useUserRegister() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registerUser = async (data: UserRegisterData) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await UserService.register(data);
      return response;
    } catch (err) {
      console.error('Error during registration: ', err);
      setError('Erro ao realizar cadastro');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { registerUser, isLoading, error };
}

export function useUserEdit() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editUser = async (data: UserEditData, userId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await UserService.edit(data, userId);
      return response;
    } catch (err) {
      console.error('Error editing user: ', err);
      setError('Erro ao editar usuário.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { editUser, isLoading, error };
}

export function useUserInventory(userId: string | undefined) {
  const [inventories, setInventories] = useState<UserInventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(userId));
  const [error, setError] = useState<string | null>(null);

  const fetchUserInventory = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await UserService.getInventory(userId);
      setInventories(res.data.userInventories);
    } catch (err) {
      console.error('Error fetching user inventory: ', err);
      setError('Erro ao carregar estoque.');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    let isMounted = true;

    if (!userId) {
      return;
    }

    async function load() {
      try {
        const res = await UserService.getInventory(userId!);
        if (isMounted) {
          setInventories(res.data.userInventories);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching user inventory: ', err);
          setError('Erro ao carregar estoque.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  return {
    inventories,
    userInventories: inventories,
    isLoading,
    error,
    refetch: fetchUserInventory,
    setInventories,
  };
}

export function useUserInventoryRegister() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registerInventory = async (userId: string, data: RegisterUserInventoryData) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await UserService.registerInventory(userId, data);
      return response;
    } catch (err: unknown) {
      console.error('Error registering user inventory:', err);
      const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
      const apiMessage =
        apiErr?.response?.data?.message ||
        apiErr?.message ||
        'Erro ao cadastrar ingrediente no estoque.';
      setError(apiMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { registerInventory, isLoading, error };
}

export function useUserDelete() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteUser = async (userId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await UserService.delete(userId);
      return response;
    } catch (err: unknown) {
      console.error('Error deleting user:', err);
      const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
      const apiMessage =
        apiErr?.response?.data?.message || apiErr?.message || 'Erro ao excluir conta.';
      setError(apiMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { deleteUser, isLoading, error };
}

export function useResetPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetPassword = async (data: ResetPasswordData) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await AuthService.resetPassword(data);
      return response;
    } catch (err: unknown) {
      console.error('Error resetting password:', err);
      const apiErr = err as {
        response?: { data?: { message?: string; code?: string } };
        message?: string;
      };
      const apiMessage =
        apiErr?.response?.data?.message || apiErr?.message || 'Erro ao alterar senha.';
      setError(apiMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { resetPassword, isLoading, error };
}

export function useUserSuspend() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suspendUser = async (userId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await UserService.suspend(userId);
      return response;
    } catch (err: unknown) {
      console.error('Error suspending user:', err);
      const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
      const apiMessage =
        apiErr?.response?.data?.message || apiErr?.message || 'Erro ao suspender usuário.';
      setError(apiMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { suspendUser, isLoading, error };
}

export function useUserSearch() {
  const [users, setUsers] = useState<SearchUserItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchUsers = useCallback(async (emailOrSearch?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const trimmed = emailOrSearch?.trim();
      const response = await UserService.searchUsers({
        email: trimmed || undefined,
        search: trimmed || undefined,
      });
      const list = response?.data?.users ?? [];
      setUsers(list);
      return list;
    } catch (err: unknown) {
      console.error('Error searching users:', err);
      const apiErr = err as {
        response?: { data?: { message?: string }; status?: number };
        message?: string;
      };
      const apiMessage =
        apiErr?.response?.data?.message || apiErr?.message || 'Erro ao buscar usuários.';
      setError(apiMessage);
      setUsers([]);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { users, setUsers, searchUsers, isLoading, error };
}
