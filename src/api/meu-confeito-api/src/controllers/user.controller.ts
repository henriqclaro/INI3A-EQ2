import type { Request, Response } from 'express';

import { UserService } from '../services/user.service';
import type { ApiResponse } from '../types/api.response';
import { UserDTO } from '../types/dtos/user.dto';

export class UserController {
  async register(
    req: Request<any, any, UserDTO.RegisterRequest>,
    res: Response<any, ApiResponse<UserDTO.RegisterResponse>>,
  ) {
    const userService = new UserService();

    const parsedData = UserDTO.registerSchema.parse(req.body);

    const newUser = await userService.register(parsedData);

    const data = {
      message: 'User created successfully.',
      newUser,
    };

    return res.status(201).json(data);
  }
}
