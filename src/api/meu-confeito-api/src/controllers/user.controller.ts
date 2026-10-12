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
    req: Request<UserDTO.RequestParams, unknown, unknown, UserDTO.RecipeQueryRequest>,
    res: Response<ApiResponse<UserDTO.SelectUserRecipesResponse>>,
  ) {
    const context = this.extractProps(req);

    const userId = req.params.id;

    const responseData: UserDTO.SelectUserRecipesResponse = await this.userService.selectUserRecipe(
      context,
      userId,
      req.query,
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

  async selectUserReviews(
    req: Request<UserDTO.RequestParams>,
    res: Response<ApiResponse<UserDTO.SelectUserReviewsResponse>>,
  ) {
    const context = this.extractProps(req);

    const userId = req.params.id;

    const responseData: UserDTO.SelectUserReviewsResponse =
      await this.userService.selectUserReviews(context, userId);

    return new DefaultSuccessResponse(
      res,
      responseData,
      'User reviews selected successfully',
    ).send();
  }

  // Métodos de Storage / Avatar ------------------------

  async uploadMyAvatar(req: Request, res: Response<ApiResponse<UserDTO.AvatarUploadResponse>>) {
    const context = this.extractProps(req);

    const responseData: UserDTO.AvatarUploadResponse = await this.userService.uploadAvatar(
      context,
      context.userId,
      req.file as Express.Multer.File,
    );

    return new DefaultSuccessResponse(res, responseData, 'User avatar updated successfully').send();
  }

  async deleteMyAvatar(req: Request, res: Response<ApiResponse>) {
    const context = this.extractProps(req);

    await this.userService.deleteAvatar(context, context.userId);

    return new NoContentResponse(res, 'User avatar deleted successfully').send();
  }

  async uploadUserAvatar(
    req: Request<UserDTO.RequestParams>,
    res: Response<ApiResponse<UserDTO.AvatarUploadResponse>>,
  ) {
    const context = this.extractProps(req);
    const userId = req.params.id;

    const responseData: UserDTO.AvatarUploadResponse = await this.userService.uploadAvatar(
      context,
      userId,
      req.file as Express.Multer.File,
    );

    return new DefaultSuccessResponse(res, responseData, 'User avatar updated successfully').send();
  }

  async deleteUserAvatar(req: Request<UserDTO.RequestParams>, res: Response<ApiResponse>) {
    const context = this.extractProps(req);
    const userId = req.params.id;

    await this.userService.deleteAvatar(context, userId);

    return new NoContentResponse(res, 'User avatar deleted successfully').send();
  }
}
