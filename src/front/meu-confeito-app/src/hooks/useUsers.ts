import { useState } from 'react';

import { UserEditData, UserRegisterData, UserService } from '../services/user';

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
