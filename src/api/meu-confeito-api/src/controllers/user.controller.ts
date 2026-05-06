import type { Request, Response } from 'express';

import {
  CreatedResponse,
  DefaultSuccessResponse,
  NoContentResponse,
} from '../responses/http.success';
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

  async select(req: Request<any>, res: Response<ApiResponse<UserDTO.SelectResponse>>) {
    const userId = req.params.id;

    const responseData: UserDTO.SelectResponse = await this.userService.select(userId);

    return new DefaultSuccessResponse(res, responseData, 'User selected successfully').send();
  }

  async update(
    req: Request<any, unknown, UserDTO.UpdateRequest>,
    res: Response<ApiResponse<UserDTO.UpdateResponse>>,
  ) {
    const userId = req.params.id;

    const responseData: UserDTO.UpdateResponse = await this.userService.update(userId, req.body);

    return new DefaultSuccessResponse(res, responseData, 'User updated sucessfully').send();
  }

  async delete(req: Request<any, unknown, UserDTO.DeleteRequest>, res: Response) {
    const userId = req.params.id;

    await this.userService.delete(userId, req.body);

    return new NoContentResponse(res, 'User deleted successfully').send();
  }
}
