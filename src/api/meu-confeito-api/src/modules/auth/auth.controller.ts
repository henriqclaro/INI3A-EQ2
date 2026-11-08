import type { Request, Response } from 'express';

import { AuthError } from '../../core/errors/http.error';
import type { ApiResponse } from '../../core/http/api.response';
import { DefaultSuccessResponse, NoContentResponse } from '../../core/http/http.success';
import type { RequestContext } from '../../core/types/context.interface';
import type { Role } from '../../generated/prisma/client';
import type { AuthDTO } from './auth.dto';
import { AuthService } from './auth.service';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  private extractProps(req: { userId: string; userRole: Role }): RequestContext {
    return {
      userId: req.userId,
      userRole: req.userRole,
    };
  }

  async logIn(
    req: Request<unknown, unknown, AuthDTO.LogInRequest>,
    res: Response<ApiResponse<AuthDTO.LogInResponse>>,
  ) {
    const responseData = await this.authService.logIn(req.body);

    if (responseData.cookie) {
      res.cookie(responseData.cookie.name, responseData.cookie.val, responseData.cookie.options);
    }

    return new DefaultSuccessResponse(res, responseData.userData, 'Successfully logged in').send();
  }

  async logOut(
    req: Request<Record<string, string>, unknown, AuthDTO.RefreshOrDeleteRequest>,
    res: Response<ApiResponse>,
  ) {
    const refreshToken = req.body?.refreshToken || req.cookies?.refreshToken;

    if (refreshToken) {
      await this.authService.logOut(refreshToken);
    }

    res.clearCookie('refreshToken');

    return new NoContentResponse(res, 'Logged out successfully').send();
  }

  async toRefreshToken(
    req: Request<unknown, unknown, AuthDTO.RefreshOrDeleteRequest>,
    res: Response<ApiResponse<AuthDTO.RefreshTokenResponse>>,
  ) {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!refreshToken) {
      throw new AuthError('Refresh token missing', 'AUTH_REFRESH_TOKEN_MISSING');
    }

    const tokenData = await this.authService.toRefreshToken(refreshToken);

    return new DefaultSuccessResponse(res, tokenData, 'Token successfully refreshed').send();
  }

  async resetPassword(
    req: Request<unknown, unknown, AuthDTO.ResetPasswordRequest>,
    res: Response<ApiResponse>,
  ) {
    const context = this.extractProps(req);
    await this.authService.resetPassword(context, req.body);

    return new NoContentResponse(res, 'Password reset successfully').send();
  }
}
