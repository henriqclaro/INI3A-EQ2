import type { Request, Response } from 'express';

import { type RegisterUserRequest, registerUserSchema } from '../types/dtos/user.dto';
import { UserService } from '../services/user.service';

export class UserController {
  async register(req: Request<any, any, RegisterUserRequest>, res: Response) {
    const userService = new UserService();

    const parsedData = registerUserSchema.parse(req.body);

    const newUser = await userService.register(parsedData);

    const data = {
      message: 'User created successfully.',
      newUser,
    };

    return res.status(201).json(data);
  }
}
