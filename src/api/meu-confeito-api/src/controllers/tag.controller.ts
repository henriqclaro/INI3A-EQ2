import type { Request, Response } from 'express';

import { CreatedResponse } from '../responses/http.success';
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
    req: Request<any, unknown, TagDTO.RegisterRequest>,
    res: Response<ApiResponse<TagDTO.RegisterResponse>>,
  ) {
    const context = this.extractProps(req);

    const responseData: TagDTO.RegisterResponse = await this.tagService.register(context, req.body);

    return new CreatedResponse(res, responseData, 'Tag created successfully').send();
  }
}
