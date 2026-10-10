import type { Request, Response } from 'express';

import type { Role } from '../generated/prisma/client';
import { AuthError } from '../responses/http.error';
import { DefaultSuccessResponse, NoContentResponse } from '../responses/http.success';
import { AuthService } from '../services/auth.service';
import type { ApiResponse } from '../types/api.response';
import type { RequestContext } from '../types/context.interface';
import type { AuthDTO } from '../types/dtos/auth.dto';

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
    req: Request<any, unknown, AuthDTO.RefreshOrDeleteRequest>,
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
