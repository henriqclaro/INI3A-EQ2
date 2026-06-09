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

  async selectSingle(req: Request<any>, res: Response<ApiResponse<RecipeDTO.SelectResponse>>) {
    const context = this.extractProps(req);

    const recipeId = req.params.id;

    const responseData: RecipeDTO.SelectResponse = await this.recipeService.selectSingle(
      context,
      recipeId,
    );

    return new DefaultSuccessResponse(res, responseData, 'Recipe selected successfully').send();
  }
}
