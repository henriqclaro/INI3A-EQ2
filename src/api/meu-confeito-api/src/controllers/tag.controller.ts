import type { Request, Response } from 'express';

import type { TagType } from '../generated/prisma/client';
import { CreatedResponse, DefaultSuccessResponse } from '../responses/http.success';
import { TagService } from '../services/tag.service';
import type { ApiResponse } from '../types/api.response';
import type { TagDTO } from '../types/dtos/tag.dto';

export class TagController {
  private tagService: TagService;

  constructor() {
    this.tagService = new TagService();
  }

  private extractProps(req: Request) {
    const userId = req.userId;
    const userRole = req.userRole;

    return { userId, userRole };
  }

  async register(
    req: Request<Record<string, string>, unknown, TagDTO.RegisterRequest>,
    res: Response<ApiResponse<TagDTO.RegisterResponse>>,
  ) {
    const context = this.extractProps(req);

    const responseData: TagDTO.RegisterResponse = await this.tagService.register(context, req.body);

    return new CreatedResponse(res, responseData, 'Tag created successfully').send();
  }

  async search(req: Request, res: Response<ApiResponse<TagDTO.SearchResponse>>) {
    const search = req.query.search as string | undefined;
    const page = req.query.page as unknown as number | undefined;
    const type = req.query.type as TagType | undefined;

    const responseData: TagDTO.SearchResponse = await this.tagService.search(search, page, type);

    return new DefaultSuccessResponse(res, responseData, 'Tags selected successfully').send();
  }
}
