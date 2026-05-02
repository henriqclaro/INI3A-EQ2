import type { Request, Response } from 'express';

import { CreatedResponse, DefaultSuccessResponse } from '../responses/http.success';
import { AuthService } from '../services/auth.service';
import type { ApiResponse } from '../types/api.response';
import type { AuthDTO } from '../types/dtos/auth.dto';

export class AuthController {
  async logIn(
    req: Request<any, any, AuthDTO.LogInRequest>,
    res: Response<any, ApiResponse<AuthDTO.LogInResponse>>,
  ) {
    const authService = new AuthService();

    const responseData = await authService.logIn(req.body);

    return new DefaultSuccessResponse(res, responseData, 'Successfully logged in').send();
  }

  async refreshToken(
    req: Request<any, any, AuthDTO.RefreshTokenRequest>,
    res: Response<any, ApiResponse<AuthDTO.RefreshTokenResponse>>,
  ) {
    const { refreshToken } = req.body;

    const authService = new AuthService();

    const tokenData = await authService.refreshToken(refreshToken);

    return new CreatedResponse(res, tokenData, 'Token successfully refreshed').send();
  }
}
