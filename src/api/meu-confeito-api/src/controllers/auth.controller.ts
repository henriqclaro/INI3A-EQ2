import type { Request, Response } from 'express';

import { DefaultSucessResponse } from '../responses/http.success';
import { AuthService } from '../services/auth.service';
import type { ApiResponse } from '../types/api.response';
import type { AuthDTO } from '../types/dtos/auth.dto';
import { logInSchema } from '../validation/auth.schema';

export class AuthController {
  async logIn(
    req: Request<any, any, AuthDTO.LogInRequest>,
    res: Response<any, ApiResponse<AuthDTO.LogInResponse>>,
  ) {
    const authService = new AuthService();

    const parsedData = logInSchema.parse(req.body);

    const data = await authService.logIn(parsedData);

    return new DefaultSucessResponse(res, data, 'Successfully logged in').send();
  }
}
