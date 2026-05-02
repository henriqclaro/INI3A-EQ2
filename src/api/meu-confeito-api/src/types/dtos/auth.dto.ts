import type z from 'zod';

import type * as auth from '../../validation/auth.schema';

export namespace AuthDTO {
  export type LogInRequest = z.infer<typeof auth.logInSchema>;
  export interface LogInResponse {
    user: {
      name: string;
      email: string;
      phone: string | null;
      pfpUrl: string | null;
    };
    auth: {
      accessToken: string;
      tokenType: string;
      expiresIn: number;
    };
  }

  export type Header = z.infer<typeof auth.headerSchema>;

  export type RefreshTokenRequest = z.infer<typeof auth.refreshTokenSchema>;
  export interface RefreshTokenResponse {
    accessToken: string;
  }
}
