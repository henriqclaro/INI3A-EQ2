import type { Request, Response } from 'express';

import { CreatedResponse, DefaultSuccessResponse } from '../responses/http.success';
import { RecipeService } from '../services/recipe.service';
import type { ApiResponse } from '../types/api.response';
import type { RecipeDTO } from '../types/dtos/recipe.dto';

export class RecipeController {
  private recipeService: RecipeService;

  constructor() {
    this.recipeService = new RecipeService();
  }

  private extractProps(req: Request) {
    const userId = req.userId;
    const userRole = req.userRole;

    return { userId, userRole };
  }

  async register(
    req: Request<any, unknown, RecipeDTO.RegisterRequest>,
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
    req: Request<any>,
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

  async search(req: Request<any>, res: Response<ApiResponse<RecipeDTO.SearchResponse>>) {
    const search = req.query.search as string;

    const page = req.query.page as unknown as number;

    const responseData: RecipeDTO.SearchResponse = await this.recipeService.search(search, page);

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
}
