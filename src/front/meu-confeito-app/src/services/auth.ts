import { Platform } from 'react-native';

import axios from 'axios';

import { API_BASE_URL } from '../config/env';
import { api, requestTokenRefresh } from './api';

export interface LogInData {
  email: string;
  password: string;
  clientType: string;
  sessionId: string;
}

export interface LogInResponse {
  data: {
    user: {
      id: string;
      name: string;
      email: string;
      phone: string | null;
      location?: {
        lat?: number;
        lng?: number;
        latitude?: number;
        longitude?: number;
      } | null;
      pfpUrl: string | null;
      role: string;
    };
    auth: {
      accessToken: string;
      tokenType: string;
      expiresIn: number;
      refreshToken: string;
    };
  };
}

export interface RefreshTokenResponse {
  status: string;
  message?: string;
  data: {
    auth: {
      accessToken: string;
      tokenType: string;
      expiresIn: number;
      refreshToken?: string;
    };
  };
}

export interface ResetPasswordData {
  oldPassword: string;
  newPassword: string;
}

export const AuthService = {
  logIn: async (data: LogInData) => {
    const response = await api.post<LogInResponse>('/auth/sessions', data);
    return response.data;
  },
  logOut: async (refreshToken: string) => {
    const response = await api.delete('/auth/sessions', { data: { refreshToken } });
    return response.data;
  },
  refreshToken: async (refreshToken: string): Promise<RefreshTokenResponse> => {
    const response = await axios.post<RefreshTokenResponse>(
      `${API_BASE_URL}/auth/tokens`,
      { refreshToken },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-client-type': Platform.OS,
        },
        timeout: 7500,
      },
    );
    return response.data;
  },
  renewTokens: async (refreshToken: string): Promise<string> => {
    return requestTokenRefresh(refreshToken);
  },
  resetPassword: async (data: ResetPasswordData) => {
    const response = await api.patch('/auth/password', data);
    return response.data;
  },
};
