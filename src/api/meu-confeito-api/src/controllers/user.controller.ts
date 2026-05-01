import type { Request, Response } from 'express';

import { CreatedResponse } from '../responses/http.success';
import { UserService } from '../services/user.service';
import type { ApiResponse } from '../types/api.response';
import type { UserDTO } from '../types/dtos/user.dto';
import { registerSchema } from '../validation/user.schema';

export class UserController {
  async register(
    req: Request<any, any, UserDTO.RegisterRequest>,
    res: Response<any, ApiResponse<UserDTO.RegisterResponse>>,
  ) {
    const userService = new UserService();

    const parsedData = registerSchema.parse(req.body);

    const data: UserDTO.RegisterResponse = await userService.register(parsedData);

    //return res.status(201).json(newUser);
    return new CreatedResponse(res, data, 'User created successfully').send();
  }
}
