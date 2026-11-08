import type { NextFunction, Request, Response } from 'express';

export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction) {
  const startTime = process.hrtime.bigint();

  const originalSend = res.send;
  res.send = function (body) {
    if (!res.headersSent) {
      const endTime = process.hrtime.bigint();
      const durationMs = (Number(endTime - startTime) / 1_000_000).toFixed(2);
      res.setHeader('X-Response-Time', `${durationMs}ms`);
    }
    return originalSend.call(this, body);
  };

  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const durationMs = (Number(endTime - startTime) / 1_000_000).toFixed(2);
    const requestId = req.id ?? 'unknown-req';

    console.log(
      `[${requestId}] ${req.method} ${req.originalUrl || req.url} - ${res.statusCode} (${durationMs}ms)`,
    );
  });

  return next();
}
