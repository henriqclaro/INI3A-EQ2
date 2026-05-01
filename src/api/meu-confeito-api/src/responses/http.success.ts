import type { Response } from 'express';

import { SuccessResponse } from './response.success';

export class DefaultSucessResponse extends SuccessResponse {
  constructor(res: Response, data: any, message?: string) {
    super(res, 200, data, message);
  }
}

export class CreatedResponse extends SuccessResponse {
  constructor(res: Response, data: any, message?: string) {
    super(res, 201, data, message);
  }
}

export class NoContentResponse extends SuccessResponse {
  constructor(res: Response, message?: string) {
    super(res, 204, null, message);
  }
}
