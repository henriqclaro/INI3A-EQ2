import type { NextFunction, Request, Response } from 'express';

import { randomUUID } from 'node:crypto';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const incomingRequestId = req.headers['x-request-id'];
  const requestId =
    typeof incomingRequestId === 'string' && incomingRequestId.trim().length > 0
      ? incomingRequestId
      : randomUUID();

  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);

  return next();
}
