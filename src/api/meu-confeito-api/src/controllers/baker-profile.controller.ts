import type { Request, Response } from 'express';

import type { Role } from '../generated/prisma/client';
import {
  CreatedResponse,
  DefaultSuccessResponse,
  NoContentResponse,
} from '../responses/http.success';
import { BakerProfileService } from '../services/baker-profile.service';
import type { ApiResponse } from '../types/api.response';
import type { BakerProfileDTO } from '../types/dtos/baker-profile.dto';

export class BakerProfileController {
  private bakerProfileService: BakerProfileService;

  constructor() {
    this.bakerProfileService = new BakerProfileService();
  }

  private extractProps(req: { userId: string; userRole: Role }) {
    const userId = req.userId;
    const userRole = req.userRole;

    return { userId, userRole };
  }

  async create(
    req: Request<Record<string, string>, unknown, BakerProfileDTO.RegisterRequest>,
    res: Response<ApiResponse<BakerProfileDTO.ProfileResponse>>,
  ) {
    const context = this.extractProps(req);
    const responseData = await this.bakerProfileService.create(context, req.body);

    return new CreatedResponse(res, responseData, 'Baker profile created successfully').send();
  }

  async selectMe(req: Request, res: Response<ApiResponse<BakerProfileDTO.ProfileResponse>>) {
    const context = this.extractProps(req);
    const responseData = await this.bakerProfileService.selectMe(context);

    return new DefaultSuccessResponse(
      res,
      responseData,
      'Baker profile selected successfully',
    ).send();
  }

  async updateMe(
    req: Request<Record<string, string>, unknown, BakerProfileDTO.UpdateRequest>,
    res: Response<ApiResponse<BakerProfileDTO.ProfileResponse>>,
  ) {
    const context = this.extractProps(req);
    const responseData = await this.bakerProfileService.updateMe(context, req.body);

    return new DefaultSuccessResponse(
      res,
      responseData,
      'Baker profile updated successfully',
    ).send();
  }

  async deleteMe(req: Request, res: Response<ApiResponse>) {
    const context = this.extractProps(req);
    await this.bakerProfileService.deleteMe(context);

    return new NoContentResponse(res, 'Baker profile deleted successfully').send();
  }

  async selectPublic(
    req: Request<BakerProfileDTO.RequestParams>,
    res: Response<ApiResponse<BakerProfileDTO.PublicProfileResponse>>,
  ) {
    const context = this.extractProps(req);
    const responseData = await this.bakerProfileService.selectPublic(context, req.params.id);

    return new DefaultSuccessResponse(
      res,
      responseData,
      'Baker profile selected successfully',
    ).send();
  }

  async selectByLocation(
    req: Request,
    res: Response<ApiResponse<BakerProfileDTO.SelectByLocationResponse>>,
  ) {
    const context = this.extractProps(req);
    const query = req.query as unknown as BakerProfileDTO.QueryRequest;
    const responseData = await this.bakerProfileService.selectByLocation(context, query);

    return new DefaultSuccessResponse(
      res,
      responseData,
      'Baker profiles selected successfully',
    ).send();
  }

  async selectByNeighborhood(
    req: Request,
    res: Response<ApiResponse<BakerProfileDTO.SelectByNeighborhoodResponse>>,
  ) {
    const context = this.extractProps(req);
    const query = req.query as unknown as BakerProfileDTO.NeighborhoodQueryRequest;
    const responseData = await this.bakerProfileService.selectByNeighborhood(context, query);

    return new DefaultSuccessResponse(
      res,
      responseData,
      'Baker profiles selected successfully',
    ).send();
  }
}
