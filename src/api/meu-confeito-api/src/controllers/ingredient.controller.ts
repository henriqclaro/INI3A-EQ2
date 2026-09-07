import type { Request, Response } from 'express';

import type { Role } from '../generated/prisma/client';
import { CreatedResponse, DefaultSuccessResponse } from '../responses/http.success';
import { IngredientService } from '../services/ingredient.service';
import type { ApiResponse } from '../types/api.response';
import type { RequestContext } from '../types/context.interface';
import type { IngredientDTO } from '../types/dtos/ingredient.dto';

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
