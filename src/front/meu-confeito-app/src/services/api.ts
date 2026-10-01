import { Platform } from 'react-native';

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

import { env } from '../config/env';
import { Storage } from '../utils/storage';

interface RetryAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

interface FailedQueueItem {
  resolve: (token: string | null) => void;
  reject: (error: unknown) => void;
}

export interface RefreshTokenApiResponse {
  status?: string;
  message?: string;
  data?: {
    auth?: {
      accessToken?: string;
      tokenType?: string;
      expiresIn?: number;
      refreshToken?: string;
    };
    accessToken?: string;
    refreshToken?: string;
  };
  auth?: {
    accessToken?: string;
    tokenType?: string;
    expiresIn?: number;
    refreshToken?: string;
  };
  accessToken?: string;
  refreshToken?: string;
}

type AuthFailureListener = () => void;
let authFailureListener: AuthFailureListener | null = null;

export const setAuthFailureListener = (listener: AuthFailureListener | null): void => {
  authFailureListener = listener;
};

const notifyAuthFailure = (): void => {
  if (authFailureListener) {
    authFailureListener();
  }
};

const setAuthHeader = (requestConfig: RetryAxiosRequestConfig, token: string): void => {
  if (!requestConfig.headers) {
    return;
  }

  if (typeof requestConfig.headers.set === 'function') {
    requestConfig.headers.set('Authorization', `Bearer ${token}`);
  } else {
    requestConfig.headers.Authorization = `Bearer ${token}`;
  }
};

export async function requestTokenRefresh(refreshToken: string): Promise<string> {
  const response = await axios.post<RefreshTokenApiResponse>(
    `${env.EXPO_PUBLIC_API_URL}/auth/tokens`,
    { refreshToken },
    {
      headers: {
        'Content-Type': 'application/json',
        'x-client-type': Platform.OS,
      },
      timeout: 7500,
    },
  );

  const newAccessToken =
    response.data?.data?.auth?.accessToken ??
    response.data?.data?.accessToken ??
    response.data?.auth?.accessToken ??
    response.data?.accessToken;

  if (!newAccessToken) {
    throw new Error('New access token not found in refresh response');
  }

  await Storage.setItem('access_token', newAccessToken);

  const newRefreshToken =
    response.data?.data?.auth?.refreshToken ??
    response.data?.data?.refreshToken ??
    response.data?.auth?.refreshToken ??
    response.data?.refreshToken;

  if (newRefreshToken) {
    await Storage.setItem('refresh_token', newRefreshToken);
  }

  return newAccessToken;
}

// eslint-disable-next-line import/no-named-as-default-member
export const api = axios.create({
  baseURL: env.EXPO_PUBLIC_API_URL,
  timeout: 7500,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: FailedQueueItem[] = [];

const processQueue = (error: unknown, token: string | null = null): void => {
  failedQueue.forEach((promiseItem) => {
    if (error) {
      promiseItem.reject(error);
    } else {
      promiseItem.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.request.use(
  async (config) => {
    let accessToken = Storage.getFastItem('access_token');
    let sessionId = Storage.getFastItem('session_id');

    if (!accessToken || !sessionId) {
      const [storedAccessToken, storedSessionId] = await Promise.all([
        accessToken ? Promise.resolve(accessToken) : Storage.getItem('access_token'),
        sessionId ? Promise.resolve(sessionId) : Storage.getItem('session_id'),
      ]);
      accessToken = storedAccessToken;
      sessionId = storedSessionId;
    }

    if (config.headers) {
      if (accessToken) {
        if (typeof config.headers.set === 'function') {
          config.headers.set('Authorization', `Bearer ${accessToken}`);
        } else {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
      }

      if (sessionId) {
        if (typeof config.headers.set === 'function') {
          config.headers.set('x-session-id', sessionId);
        } else {
          config.headers['x-session-id'] = sessionId;
        }
      }

      if (typeof config.headers.set === 'function') {
        config.headers.set('x-client-type', Platform.OS);
      } else {
        config.headers['x-client-type'] = Platform.OS;
      }
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryAxiosRequestConfig | undefined;

    if (
      !originalRequest ||
      !error.response ||
      error.response.status !== 401 ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }

    const requestUrl = originalRequest.url ?? '';
    const isTokensEndpoint = requestUrl.includes('/tokens');
    const isSessionsEndpoint = requestUrl.includes('/sessions');

    if (isTokensEndpoint || isSessionsEndpoint) {
      if (isTokensEndpoint) {
        await Storage.removeItem('access_token');
        await Storage.removeItem('refresh_token');
        await Storage.removeItem('user_profile');
        notifyAuthFailure();
      }

      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string | null>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          if (token) {
            setAuthHeader(originalRequest, token);
          }
          originalRequest._retry = true;
          return api(originalRequest);
        })
        .catch((queueError: unknown) => Promise.reject(queueError));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await Storage.getItem('refresh_token');

      if (!refreshToken) {
        throw new Error('Refresh Token not found');
      }

      const newAccessToken = await requestTokenRefresh(refreshToken);

      setAuthHeader(originalRequest, newAccessToken);
      processQueue(null, newAccessToken);

      return api(originalRequest);
    } catch (refreshError: unknown) {
      processQueue(refreshError, null);

      await Storage.removeItem('access_token');
      await Storage.removeItem('refresh_token');
      await Storage.removeItem('user_profile');

      notifyAuthFailure();

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
