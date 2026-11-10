import type { Request, Response } from 'express';

import type { ApiResponse } from '../../core/http/api.response';
import { CreatedResponse, DefaultSuccessResponse } from '../../core/http/http.success';
import type { RequestContext } from '../../core/types/context.interface';
import type { Role } from '../../generated/prisma/client';
import type { ProductionDTO } from './production.dto';
import { ProductionService } from './production.service';

export class ProductionController {
  private productionService: ProductionService;

  constructor() {
    this.productionService = new ProductionService();
  }

  private extractProps(req: { userId: string; userRole: Role }): RequestContext {
    return {
      userId: req.userId,
      userRole: req.userRole,
    };
  }

  async register(
    req: Request<Record<string, string>, unknown, ProductionDTO.RegisterRequest>,
    res: Response<ApiResponse<ProductionDTO.RegisterResponse>>,
  ) {
    const context = this.extractProps(req);
    const responseData = await this.productionService.register(context, req.body);

    return new CreatedResponse(res, responseData, 'Production run created successfully').send();
  }

  async cancel(
    req: Request<ProductionDTO.RequestParams>,
    res: Response<ApiResponse<ProductionDTO.CancelResponse>>,
  ) {
    const context = this.extractProps(req);
    const responseData = await this.productionService.cancel(context, req.params.id);

    return new DefaultSuccessResponse(
      res,
      responseData,
      'Production run canceled successfully',
    ).send();
  }

  async list(req: Request, res: Response<ApiResponse<ProductionDTO.ListResponse>>) {
    const context = this.extractProps(req);
    const query = req.query as unknown as ProductionDTO.QueryRequest;
    const responseData = await this.productionService.list(context, query);

    return new DefaultSuccessResponse(
      res,
      responseData,
      'Production runs selected successfully',
    ).send();
  }

  async selectSingle(
    req: Request<ProductionDTO.RequestParams>,
    res: Response<ApiResponse<ProductionDTO.SelectResponse>>,
  ) {
    const context = this.extractProps(req);
    const responseData = await this.productionService.selectSingle(context, req.params.id);

    return new DefaultSuccessResponse(
      res,
      responseData,
      'Production run selected successfully',
    ).send();
  }
}
