import type { Request, Response } from 'express';

import { CreatedResponse } from '../responses/http.success';
import { UserService } from '../services/user.service';
import type { ApiResponse } from '../types/api.response';
import type { UserDTO } from '../types/dtos/user.dto';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  async register(
    req: Request<unknown, unknown, UserDTO.RegisterRequest>,
    res: Response<ApiResponse<UserDTO.RegisterResponse>>,
  ) {
    const responseData: UserDTO.RegisterResponse = await this.userService.register(req.body);

    return new CreatedResponse(res, responseData, 'User created successfully').send();
  }
}
