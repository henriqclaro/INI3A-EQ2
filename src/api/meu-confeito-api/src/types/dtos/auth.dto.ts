import type { z } from 'zod';

import type * as auth from '../../validation/auth.schema';

export namespace AuthDTO {
  export type LogInRequest = z.infer<typeof auth.logInSchema>;
  export interface LogInResponse {
    user: {
      id: string;
      name: string;
      email: string;
      phone: string | null;
      location: {
        latitude: number;
        longitude: number;
      };
      pfpUrl: string | null;
      role: string;
    };
    auth: {
      accessToken: string;
      tokenType: string;
      expiresIn: number;
      refreshToken?: string;
    };
  }

  export type Header = z.infer<typeof auth.headerSchema>;

  export type RefreshOrDeleteRequest = z.infer<typeof auth.refreshOrDeleteSchema>;
  export interface RefreshTokenResponse {
    accessToken: string;
  }
}
