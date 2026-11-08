import type { Request, Response } from 'express';

import type { ApiResponse } from '../../core/http/api.response';
import { CreatedResponse, DefaultSuccessResponse } from '../../core/http/http.success';
import type { RequestContext } from '../../core/types/context.interface';
import type { Role } from '../../generated/prisma/client';
import type { IngredientDTO } from './ingredient.dto';
import { IngredientService } from './ingredient.service';

export class IngredientController {
  private ingredientService: IngredientService;

  constructor() {
    this.ingredientService = new IngredientService();
  }

  private extractProps(req: { userId: string; userRole: Role }): RequestContext {
    return {
      userId: req.userId,
      userRole: req.userRole,
    };
  }

  async register(
    req: Request<Record<string, string>, unknown, IngredientDTO.RegisterRequest>,
    res: Response<ApiResponse<IngredientDTO.RegisterResponse>>,
  ) {
    const context = this.extractProps(req);

    const responseData: IngredientDTO.RegisterResponse = await this.ingredientService.register(
      context,
      req.body,
    );

    return new CreatedResponse(res, responseData, 'Ingredient created successfully').send();
  }

  async search(req: Request, res: Response<ApiResponse<IngredientDTO.SearchResponse>>) {
    const context = this.extractProps(req);

    const query = req.query as unknown as IngredientDTO.QueryRequest;
    const responseData: IngredientDTO.SearchResponse = await this.ingredientService.search(
      context,
      query,
    );

    return new DefaultSuccessResponse(
      res,
      responseData,
      'Ingredients selected successfully',
    ).send();
  }
}
