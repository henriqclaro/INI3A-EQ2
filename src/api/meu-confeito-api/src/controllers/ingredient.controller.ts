import type { Request, Response } from 'express';

import { CreatedResponse } from '../responses/http.success';
import { IngredientService } from '../services/ingredient.service';
import type { ApiResponse } from '../types/api.response';
import type { IngredientDTO } from '../types/dtos/ingredient.dto';

export class IngredientController {
  private ingredientService: IngredientService;

  constructor() {
    this.ingredientService = new IngredientService();
  }

  private extractProps(req: Request) {
    const userId = req.userId;
    const userRole = req.userRole;

    return { userId, userRole };
  }

  async register(
    req: Request<any, unknown, IngredientDTO.RegisterRequest>,
    res: Response<ApiResponse<IngredientDTO.RegisterResponse>>,
  ) {
    const context = this.extractProps(req);

    const responseData: IngredientDTO.RegisterResponse = await this.ingredientService.register(
      context,
      req.body,
    );

    return new CreatedResponse(res, responseData, 'Ingredient created successfully').send();
  }
}
