import type { NextFunction, Request, Response } from 'express';

import type { ValidationSchemas } from '../types/schema.interface';

export const validate = (schemas: ValidationSchemas) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    if (schemas.headers) {
      req.headers = await schemas.headers.parseAsync(req.headers);
    }

    if (schemas.params) {
      req.params = await schemas.params.parseAsync(req.params);
    }

    if (schemas.body) {
      req.body = await schemas.body.parseAsync(req.body);
    }

    if (schemas.query) {
      req.query = await schemas.query.parseAsync(req.query);
    }

    return next();
  };
};
