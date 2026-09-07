import type { Request, Response } from 'express';

import type { Role } from '../generated/prisma/client';
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
  private extractProps(req: { userId: string; userRole: Role }) {
    const userId = req.userId;
    const userRole = req.userRole;

    return { userId, userRole };
  }

  // Métodos de CRUD ------------------------

  async register(
    req: Request<Record<string, string>, unknown, UserDTO.RegisterRequest>,
    res: Response<ApiResponse<UserDTO.RegisterResponse>>,
  ) {
    const responseData: UserDTO.RegisterResponse = await this.userService.register(req.body);

    return new CreatedResponse(res, responseData, 'User created successfully').send();
  }

  async select(
    req: Request<UserDTO.RequestParams>,
    res: Response<ApiResponse<UserDTO.SelectResponse>>,
  ) {
    const context = this.extractProps(req);

    const userId = req.params.id;

    const responseData: UserDTO.SelectResponse = await this.userService.select(context, userId);

    return new DefaultSuccessResponse(res, responseData, 'User selected successfully').send();
  }

  async update(
    req: Request<UserDTO.RequestParams, unknown, UserDTO.UpdateRequest>,
    res: Response<ApiResponse<UserDTO.UpdateResponse>>,
  ) {
    const context = this.extractProps(req);

    const userId = req.params.id;

    const responseData: UserDTO.UpdateResponse = await this.userService.update(
      context,
      userId,
      req.body,
    );

    return new DefaultSuccessResponse(res, responseData, 'User updated sucessfully').send();
  }

  async delete(
    req: Request<UserDTO.RequestParams, unknown, UserDTO.DeleteRequest>,
    res: Response<ApiResponse>,
  ) {
    const context = this.extractProps(req);

    const userId = req.params.id;

    await this.userService.delete(context, userId, req.body);

    return new NoContentResponse(res, 'User deleted successfully').send();
  }

  // Métodos de Relações ------------------------

  async selectUserRecipe(
    req: Request<UserDTO.RequestParams>,
    res: Response<ApiResponse<UserDTO.SelectUserRecipesResponse>>,
  ) {
    const context = this.extractProps(req);

    const userId = req.params.id;

    const responseData: UserDTO.SelectUserRecipesResponse = await this.userService.selectUserRecipe(
      context,
      userId,
    );

    return new DefaultSuccessResponse(
      res,
      responseData,
      'User Recipes selected successfully',
    ).send();
  }

  async selectUserSaves(
    req: Request<UserDTO.RequestParams>,
    res: Response<ApiResponse<UserDTO.SelectUserSavesResponse>>,
  ) {
    const context = this.extractProps(req);

    const userId = req.params.id;

    const responseData: UserDTO.SelectUserSavesResponse = await this.userService.selectUserSaves(
      context,
      userId,
    );

    return new DefaultSuccessResponse(res, responseData, 'User Saves selected successfully').send();
  }

  async registerUserInventory(
    req: Request<UserDTO.RequestParams, unknown, UserDTO.RegisterUserInventoryRequest>,
    res: Response<ApiResponse<UserDTO.RegisterUserInventoryResponse>>,
  ) {
    const context = this.extractProps(req);

    const userId = req.params.id;

    const responseData: UserDTO.RegisterUserInventoryResponse =
      await this.userService.registerUserInventory(context, userId, req.body);

    return new CreatedResponse(res, responseData, 'User Inventory created successfully').send();
  }

  async selectUserInventory(
    req: Request<UserDTO.RequestParams>,
    res: Response<ApiResponse<UserDTO.SelectUserInventoryResponse>>,
  ) {
    const context = this.extractProps(req);

    const userId = req.params.id;

    const responseData: UserDTO.SelectUserInventoryResponse =
      await this.userService.selectUserInventory(context, userId);

    return new DefaultSuccessResponse(
      res,
      responseData,
      'User Inventory selected successfully',
    ).send();
  }

  async saveRecipe(
    req: Request<UserDTO.RequestParams, unknown, UserDTO.SaveRecipeRequest>,
    res: Response<ApiResponse<UserDTO.SaveRecipeResponse>>,
  ) {
    const context = this.extractProps(req);

    const userId = req.params.id;

    const responseData: UserDTO.SaveRecipeResponse = await this.userService.saveRecipe(
      context,
      userId,
      req.body,
    );

    return new CreatedResponse(res, responseData, 'Recipe saved successfully').send();
  }

  async removeSaveRecipe(
    req: Request<UserDTO.RequestParams, unknown, UserDTO.RemoveSaveRecipeRequest>,
    res: Response<ApiResponse>,
  ) {
    const context = this.extractProps(req);

    const userId = req.params.id;

    await this.userService.removeSaveRecipe(context, userId, req.body);

    return new NoContentResponse(res, 'Saved recipe removed successfully').send();
  }
}
