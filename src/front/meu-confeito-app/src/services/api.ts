import { Platform } from 'react-native';

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

import { env } from '../config/env';
import { Storage } from '../utils/storage';

interface RetryAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
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
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.request.use(
  async (config) => {
    let accessToken = Storage.getFastItem('access_token');
    let sessionId = Storage.getFastItem('session_id');

    if (!accessToken && !sessionId) {
      [accessToken, sessionId] = await Promise.all([
        Storage.getItem('access_token'),
        Storage.getItem('session_id'),
      ]);
    }

    if (config.headers) {
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }

      if (sessionId) {
        config.headers['x-session-id'] = sessionId;
      }

      config.headers['x-client-type'] = Platform.OS;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryAxiosRequestConfig;

    if (!error.response || error.response.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (originalRequest.url?.includes('/tokens')) {
      await Storage.removeItem('access_token');
      await Storage.removeItem('refresh_token');

      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await Storage.getItem('refresh_token');

      if (!refreshToken) {
        throw new Error('Refresh Token not found');
      }

      const response = await axios.post(`${env.EXPO_PUBLIC_API_URL}/auth/tokens`, refreshToken);

      const { accessToken: newAccessToken } = response.data;

      await Storage.setItem('access_token', newAccessToken);

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      }

      processQueue(null, newAccessToken);

      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);

      await Storage.removeItem('access_token');
      await Storage.removeItem('refresh_token');

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
