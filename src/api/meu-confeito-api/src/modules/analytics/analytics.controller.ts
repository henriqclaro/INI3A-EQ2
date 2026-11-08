import type { Request, Response } from 'express';

import type { ApiResponse } from '../../core/http/api.response';
import { DefaultSuccessResponse } from '../../core/http/http.success';
import type { RequestContext } from '../../core/types/context.interface';
import type { Role } from '../../generated/prisma/client';
import type { AnalyticsDTO } from './analytics.dto';
import { AnalyticsService } from './analytics.service';

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
