import { Alert } from 'react-native';

export interface RateLimitInfo {
  isRateLimited: boolean;
  isAuthLimit: boolean;
  retryAfterSeconds?: number;
  message: string;
}

export interface RateLimitNoticeState {
  isVisible: boolean;
  title: string;
  message: string;
  isAuthLimit: boolean;
  retryAfterSeconds?: number;
  resetAt?: number;
}

export interface RateLimitNotifyOptions {
  isAlertShown?: boolean;
}

type RateLimitListener = (state: RateLimitNoticeState) => void;

/**
 * Checks if a given error is a rate limit error (HTTP 429 or RATE_LIMIT_EXCEEDED).
 */
export function isRateLimitError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const err = error as {
    response?: {
      status?: number;
      data?: {
        code?: string;
        message?: string;
      };
    };
    status?: number;
    code?: string;
  };

  if (err.response?.status === 429 || err.status === 429) {
    return true;
  }

  const responseCode = err.response?.data?.code;
  if (responseCode === 'RATE_LIMIT_EXCEEDED' || err.code === 'RATE_LIMIT_EXCEEDED') {
    return true;
  }

  const message = err.response?.data?.message?.toLowerCase() ?? '';
  if (
    message.includes('too many requests') ||
    message.includes('too many authentication attempts') ||
    message.includes('muitas requisições') ||
    message.includes('muitas tentativas')
  ) {
    return true;
  }

  return false;
}

/**
 * Extracts retry-after or ratelimit-reset seconds from HTTP response headers.
 */
export function extractRetryAfterSeconds(
  headers?: Record<string, unknown> | unknown,
): number | undefined {
  if (!headers || typeof headers !== 'object') {
    return undefined;
  }

  const headerObj = headers as Record<string, unknown>;
  const rawRetryAfter = headerObj['retry-after'] ?? headerObj['Retry-After'];
  if (rawRetryAfter !== undefined && rawRetryAfter !== null) {
    const parsed = Number(rawRetryAfter);
    if (!Number.isNaN(parsed) && parsed > 0) {
      return Math.round(parsed);
    }
  }

  const rawReset =
    headerObj['ratelimit-reset'] ??
    headerObj['RateLimit-Reset'] ??
    headerObj['x-ratelimit-reset'] ??
    headerObj['X-RateLimit-Reset'];

  if (rawReset !== undefined && rawReset !== null) {
    const parsed = Number(rawReset);
    if (!Number.isNaN(parsed) && parsed > 0) {
      // If header is a unix epoch timestamp (> 1_000_000_000), calculate delta seconds
      if (parsed > 1_000_000_000) {
        const nowInSeconds = Math.floor(Date.now() / 1000);
        const delta = parsed - nowInSeconds;
        return delta > 0 ? Math.round(delta) : undefined;
      }
      return Math.round(parsed);
    }
  }

  return undefined;
}

/**
 * Determines whether a rate limit error originated from an authentication endpoint.
 */
export function isAuthRateLimit(url?: string, serverMessage?: string): boolean {
  if (url) {
    const lowerUrl = url.toLowerCase();
    if (
      lowerUrl.includes('/sessions') ||
      lowerUrl.includes('/tokens') ||
      lowerUrl.includes('/password') ||
      lowerUrl.includes('/auth')
    ) {
      return true;
    }
  }

  if (serverMessage) {
    const lowerMsg = serverMessage.toLowerCase();
    if (
      lowerMsg.includes('authentication') ||
      lowerMsg.includes('autentica') ||
      lowerMsg.includes('login') ||
      lowerMsg.includes('senha')
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Formats a duration in seconds into a friendly localized Portuguese string.
 */
export function formatRemainingTime(seconds: number): string {
  if (seconds <= 0) {
    return 'alguns segundos';
  }
  if (seconds < 60) {
    return `${seconds} segundo${seconds > 1 ? 's' : ''}`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSecs = seconds % 60;
  if (remainingSecs === 0) {
    return `${minutes} minuto${minutes > 1 ? 's' : ''}`;
  }
  return `${minutes}m ${remainingSecs}s`;
}

/**
 * Generates a user-friendly localized Portuguese message explaining the rate limit.
 */
export function formatRateLimitMessage(isAuth: boolean, retryAfterSeconds?: number): string {
  const timeText = retryAfterSeconds ? formatRemainingTime(retryAfterSeconds) : null;

  if (isAuth) {
    if (timeText) {
      return `Muitas tentativas de autenticação detectadas. Por favor, aguarde ${timeText} antes de tentar novamente.`;
    }
    return 'Muitas tentativas de autenticação detectadas. Por favor, aguarde alguns minutos antes de tentar novamente.';
  }

  if (timeText) {
    return `Limite de requisições excedido. Por favor, aguarde ${timeText} antes de tentar novamente.`;
  }
  return 'Muitas requisições enviadas ao servidor. Por favor, aguarde alguns instantes antes de tentar novamente.';
}

/**
 * Parses an unknown error into structured RateLimitInfo.
 */
export function getRateLimitInfo(error: unknown, fallbackUrl?: string): RateLimitInfo {
  const isLimited = isRateLimitError(error);
  if (!isLimited) {
    return {
      isRateLimited: false,
      isAuthLimit: false,
      message: '',
    };
  }

  const err = error as {
    config?: { url?: string };
    response?: {
      headers?: Record<string, unknown>;
      data?: {
        message?: string;
        code?: string;
      };
    };
  };

  const url = err.config?.url || fallbackUrl;
  const serverMsg = err.response?.data?.message;
  const isAuth = isAuthRateLimit(url, serverMsg);
  const retrySeconds = extractRetryAfterSeconds(err.response?.headers);
  const localizedMessage = formatRateLimitMessage(isAuth, retrySeconds);

  return {
    isRateLimited: true,
    isAuthLimit: isAuth,
    retryAfterSeconds: retrySeconds,
    message: localizedMessage,
  };
}

class RateLimitManager {
  private listeners: Set<RateLimitListener> = new Set();
  private currentState: RateLimitNoticeState = {
    isVisible: false,
    title: '',
    message: '',
    isAuthLimit: false,
  };
  private lastAlertTimestamp = 0;

  public subscribe(listener: RateLimitListener): () => void {
    this.listeners.add(listener);
    listener(this.currentState);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public notify(info: RateLimitInfo, options?: RateLimitNotifyOptions): void {
    const now = Date.now();
    const retrySeconds = info.retryAfterSeconds ?? (info.isAuthLimit ? 900 : 60);
    const resetAt = now + retrySeconds * 1000;
    const title = info.isAuthLimit
      ? 'Limite de Autenticação Excedido'
      : 'Limite de Requisições Excedido';

    this.currentState = {
      isVisible: true,
      title,
      message: info.message,
      isAuthLimit: info.isAuthLimit,
      retryAfterSeconds: retrySeconds,
      resetAt,
    };
    this.emitChange();

    // Trigger Alert.alert if requested and not alerted in the last 5 seconds to prevent spam
    const canShowAlert = options?.isAlertShown ?? true;
    if (canShowAlert && now - this.lastAlertTimestamp > 5000) {
      this.lastAlertTimestamp = now;
      Alert.alert(title, info.message, [{ text: 'Entendi', style: 'default' }]);
    }
  }

  public hide(): void {
    this.currentState = {
      ...this.currentState,
      isVisible: false,
    };
    this.emitChange();
  }

  public getState(): RateLimitNoticeState {
    return this.currentState;
  }

  private emitChange(): void {
    for (const listener of this.listeners) {
      listener(this.currentState);
    }
  }
}

export const rateLimitManager = new RateLimitManager();
