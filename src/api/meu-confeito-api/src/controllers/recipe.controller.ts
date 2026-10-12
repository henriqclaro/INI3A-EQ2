import type { Request, Response } from 'express';

import type { Role } from '../generated/prisma/client';
import {
  CreatedResponse,
  DefaultSuccessResponse,
  NoContentResponse,
} from '../responses/http.success';
import { RecipeService } from '../services/recipe.service';
import type { ApiResponse } from '../types/api.response';
import type { RequestContext } from '../types/context.interface';
import type { RecipeDTO } from '../types/dtos/recipe.dto';

export class RecipeController {
  private recipeService: RecipeService;

  constructor() {
    this.recipeService = new RecipeService();
  }

  private extractProps(req: { userId: string; userRole: Role }): RequestContext {
    const userId = req.userId;
    const userRole = req.userRole;

    return { userId, userRole };
  }

  async register(
    req: Request<Record<string, string>, unknown, RecipeDTO.RegisterRequest>,
    res: Response<ApiResponse<RecipeDTO.RegisterResponse>>,
  ) {
    const context = this.extractProps(req);

    const responseData: RecipeDTO.RegisterResponse = await this.recipeService.register(
      context,
      req.body,
    );

    return new CreatedResponse(res, responseData, 'Recipe created successfully').send();
  }

  async selectSingle(
    req: Request<RecipeDTO.RequestParam>,
    res: Response<ApiResponse<RecipeDTO.SingleSelectResponse>>,
  ) {
    const context = this.extractProps(req);

    const recipeId = req.params.id;

    const responseData: RecipeDTO.SingleSelectResponse = await this.recipeService.selectSingle(
      context,
      recipeId,
    );

    return new DefaultSuccessResponse(res, responseData, 'Recipe selected successfully').send();
  }

  async selectSingleUserInventory(
    req: Request<RecipeDTO.UserInventoryRequestParam>,
    res: Response<ApiResponse<RecipeDTO.SingleSelectUserInventoryResponse>>,
  ) {
    const context = this.extractProps(req);

    const recipeId = req.params.id;
    const userId = req.params.userId;

    const responseData: RecipeDTO.SingleSelectUserInventoryResponse =
      await this.recipeService.selectSingleUserInventory(context, recipeId, userId);

    return new DefaultSuccessResponse(
      res,
      responseData,
      'Recipe with user inventory selected successfully',
    ).send();
  }

  async search(req: Request, res: Response<ApiResponse<RecipeDTO.SearchResponse>>) {
    const query = req.query as unknown as RecipeDTO.QueryRequest;
    const responseData: RecipeDTO.SearchResponse = await this.recipeService.search(query);

    return new DefaultSuccessResponse(res, responseData, 'Recipes selected successfully').send();
  }

  async updateVisibility(
    req: Request<RecipeDTO.RequestParam, unknown, RecipeDTO.UpdateVisibilityRequest>,
    res: Response<ApiResponse<RecipeDTO.UpdateVisibilityResponse>>,
  ) {
    const context = this.extractProps(req);

    const recipeId = req.params.id;

    const responseData: RecipeDTO.UpdateVisibilityResponse =
      await this.recipeService.updateVisibility(context, recipeId, req.body);

    return new DefaultSuccessResponse(
      res,
      responseData,
      'Recipe visibility updated successfully',
    ).send();
  }

  async update(
    req: Request<RecipeDTO.RequestParams, unknown, RecipeDTO.UpdateRequest>,
    res: Response<ApiResponse<RecipeDTO.UpdateResponse>>,
  ) {
    const context = this.extractProps(req);

    const recipeId = req.params.id;

    const responseData: RecipeDTO.UpdateResponse = await this.recipeService.update(
      context,
      recipeId,
      req.body,
    );

    return new DefaultSuccessResponse(res, responseData, 'Recipe updated successfully').send();
  }

  async delete(req: Request<RecipeDTO.RequestParams>, res: Response<ApiResponse>) {
    const context = this.extractProps(req);

    const recipeId = req.params.id;

    await this.recipeService.delete(context, recipeId);

    return new NoContentResponse(res, 'Recipe deleted successfully').send();
  }

  async createReview(
    req: Request<RecipeDTO.RequestParams, unknown, RecipeDTO.CreateReviewRequest>,
    res: Response<ApiResponse<RecipeDTO.CreateReviewResponse>>,
  ) {
    const context = this.extractProps(req);
    const recipeId = req.params.id;

    const responseData: RecipeDTO.CreateReviewResponse = await this.recipeService.createReview(
      context,
      recipeId,
      req.body,
    );

    return new CreatedResponse(res, responseData, 'Recipe review created successfully').send();
  }

  async updateReview(
    req: Request<RecipeDTO.RequestParams, unknown, RecipeDTO.UpdateReviewRequest>,
    res: Response<ApiResponse<RecipeDTO.UpdateReviewResponse>>,
  ) {
    const context = this.extractProps(req);
    const recipeId = req.params.id;

    const responseData: RecipeDTO.UpdateReviewResponse = await this.recipeService.updateReview(
      context,
      recipeId,
      req.body,
    );

    return new DefaultSuccessResponse(
      res,
      responseData,
      'Recipe review updated successfully',
    ).send();
  }

  async deleteReview(req: Request<RecipeDTO.RequestParams>, res: Response<ApiResponse>) {
    const context = this.extractProps(req);
    const recipeId = req.params.id;

    await this.recipeService.deleteReview(context, recipeId);

    return new NoContentResponse(res, 'Recipe review deleted successfully').send();
  }

  async selectRecipeReviews(
    req: Request<RecipeDTO.RequestParams>,
    res: Response<ApiResponse<RecipeDTO.SelectRecipeReviewsResponse>>,
  ) {
    const context = this.extractProps(req);
    const recipeId = req.params.id;

    const responseData: RecipeDTO.SelectRecipeReviewsResponse =
      await this.recipeService.selectRecipeReviews(context, recipeId);

    return new DefaultSuccessResponse(
      res,
      responseData,
      'Recipe reviews selected successfully',
    ).send();
  }

  // Métodos de Storage / Capa ------------------------

  async uploadCover(
    req: Request<RecipeDTO.RequestParams>,
    res: Response<ApiResponse<RecipeDTO.CoverUploadResponse>>,
  ) {
    const context = this.extractProps(req);
    const recipeId = req.params.id;

    const responseData: RecipeDTO.CoverUploadResponse = await this.recipeService.uploadCover(
      context,
      recipeId,
      req.file as Express.Multer.File,
    );

    return new DefaultSuccessResponse(
      res,
      responseData,
      'Recipe cover updated successfully',
    ).send();
  }

  async deleteCover(req: Request<RecipeDTO.RequestParams>, res: Response<ApiResponse>) {
    const context = this.extractProps(req);
    const recipeId = req.params.id;

    await this.recipeService.deleteCover(context, recipeId);

    return new NoContentResponse(res, 'Recipe cover deleted successfully').send();
  }
}
