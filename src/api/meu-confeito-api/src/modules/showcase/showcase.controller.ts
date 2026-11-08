import type { Request, Response } from 'express';

import type { ApiResponse } from '../../core/http/api.response';
import {
  CreatedResponse,
  DefaultSuccessResponse,
  NoContentResponse,
} from '../../core/http/http.success';
import type { Role } from '../../generated/prisma/client';
import type { ShowcaseDTO } from './showcase.dto';
import { ShowcaseService } from './showcase.service';

export class ShowcaseController {
  private showcaseService: ShowcaseService;

  constructor() {
    this.showcaseService = new ShowcaseService();
  }

  private extractProps(req: { userId: string; userRole: Role }) {
    const userId = req.userId;
    const userRole = req.userRole;

    return { userId, userRole };
  }

  async listPublic(
    req: Request<ShowcaseDTO.ParamsProfile>,
    res: Response<ApiResponse<ShowcaseDTO.ListResponse>>,
  ) {
    const context = this.extractProps(req);
    const responseData = await this.showcaseService.listPublic(context, req.params.id);

    return new DefaultSuccessResponse(
      res,
      responseData,
      'Showcase recipes selected successfully',
    ).send();
  }

  async listMine(req: Request, res: Response<ApiResponse<ShowcaseDTO.ListResponse>>) {
    const context = this.extractProps(req);
    const responseData = await this.showcaseService.listMine(context);

    return new DefaultSuccessResponse(
      res,
      responseData,
      'Showcase recipes selected successfully',
    ).send();
  }

  async add(
    req: Request<Record<string, string>, unknown, ShowcaseDTO.AddRequest>,
    res: Response<ApiResponse<ShowcaseDTO.ShowcaseItemResponse>>,
  ) {
    const context = this.extractProps(req);
    const responseData = await this.showcaseService.add(context, req.body);

    return new CreatedResponse(res, responseData, 'Showcase recipe added successfully').send();
  }

  async reorder(
    req: Request<Record<string, string>, unknown, ShowcaseDTO.ReorderRequest>,
    res: Response<ApiResponse<ShowcaseDTO.ListResponse>>,
  ) {
    const context = this.extractProps(req);
    const responseData = await this.showcaseService.reorder(context, req.body);

    return new DefaultSuccessResponse(
      res,
      responseData,
      'Showcase recipes reordered successfully',
    ).send();
  }

  async remove(req: Request<ShowcaseDTO.ParamsRecipe>, res: Response<ApiResponse>) {
    const context = this.extractProps(req);
    await this.showcaseService.remove(context, req.params.recipeId);

    return new NoContentResponse(res, 'Showcase recipe removed successfully').send();
  }
}
