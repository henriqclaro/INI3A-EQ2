import type { Request, Response } from 'express';

import { CreatedResponse } from '../responses/http.success';
import { UserService } from '../services/user.service';
import type { ApiResponse } from '../types/api.response';
import type { UserDTO } from '../types/dtos/user.dto';

export class UserController {
  async register(
    req: Request<unknown, unknown, UserDTO.RegisterRequest>,
    res: Response<ApiResponse<UserDTO.RegisterResponse>>,
  ) {
    const userService = new UserService();

    const responseData: UserDTO.RegisterResponse = await userService.register(req.body);

    //return res.status(201).json(newUser);
    return new CreatedResponse(res, responseData, 'User created successfully').send();
  }
}
