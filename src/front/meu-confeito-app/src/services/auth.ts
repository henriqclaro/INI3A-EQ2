import { api } from './api';

export interface LogInData {
  email: string;
  password: string;
  clientType: string;
  sessionId: string;
}

export interface LogInResponse {
  data: {
    user: {
      name: string;
      email: string;
      phone: string | null;
      // location: string | null;
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

export const AuthService = {
  logIn: async (data: LogInData) => {
    const response = await api.post<LogInResponse>('/auth/sessions', data);
    return response.data;
  },
};
