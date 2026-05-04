import type { Request, Response } from 'express';

import { AuthError } from '../responses/http.error';
import { DefaultSuccessResponse } from '../responses/http.success';
import { AuthService } from '../services/auth.service';
import type { ApiResponse } from '../types/api.response';
import type { AuthDTO } from '../types/dtos/auth.dto';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  async logIn(
    req: Request<unknown, unknown, AuthDTO.LogInRequest>,
    res: Response<ApiResponse<AuthDTO.LogInResponse>>,
  ) {
    const clientType = (req.headers['x-client-type'] as string) || 'web';

    const responseData = await this.authService.logIn(clientType, req.body);

    if (responseData.cookie) {
      res.cookie(responseData.cookie.name, responseData.cookie.val, responseData.cookie.options);
    }

    return new DefaultSuccessResponse(res, responseData.userData, 'Successfully logged in').send();
  }

  async refreshToken(
    req: Request<unknown, unknown, AuthDTO.RefreshTokenRequest>,
    res: Response<ApiResponse<AuthDTO.RefreshTokenResponse>>,
  ) {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!refreshToken) {
      throw new AuthError('Refresh token missing', 'AUTH_TOKEN_MISSING');
    }

    const tokenData = await this.authService.refreshToken(refreshToken);

    return new DefaultSuccessResponse(res, tokenData, 'Token successfully refreshed').send();
  }
}
