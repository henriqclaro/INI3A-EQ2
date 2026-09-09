import type { Request, Response } from 'express';

import type { Role } from '../generated/prisma/client';
import { DefaultSuccessResponse } from '../responses/http.success';
import { AnalyticsService } from '../services/analytics.service';
import type { ApiResponse } from '../types/api.response';
import type { RequestContext } from '../types/context.interface';
import type { AnalyticsDTO } from '../types/dtos/analytics.dto';

export class AnalyticsController {
  private analyticsService: AnalyticsService;

  constructor() {
    this.analyticsService = new AnalyticsService();
  }

  private extractProps(req: { userId: string; userRole: Role }): RequestContext {
    return {
      userId: req.userId,
      userRole: req.userRole,
    };
  }

  async getProfitSummary(
    req: Request,
    res: Response<ApiResponse<AnalyticsDTO.ProfitSummaryResponse>>,
  ) {
    const context = this.extractProps(req);
    const query = req.query as unknown as AnalyticsDTO.ProfitSummaryQuery;
    const responseData = await this.analyticsService.getProfitSummary(context, query);

    return new DefaultSuccessResponse(
      res,
      responseData,
      'Profit summary retrieved successfully',
    ).send();
  }

  async projectPurchases(
    req: Request<Record<string, string>, unknown, AnalyticsDTO.PurchaseProjectionRequest>,
    res: Response<ApiResponse<AnalyticsDTO.PurchaseProjectionResponse>>,
  ) {
    const context = this.extractProps(req);
    const responseData = await this.analyticsService.projectPurchases(context, req.body);

    return new DefaultSuccessResponse(
      res,
      responseData,
      'Purchase projection calculated successfully',
    ).send();
  }
}
