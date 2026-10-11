import rateLimit from 'express-rate-limit';

export const globalRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 100, // 100 requests per window
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req, res) => {
    return res.status(429).json({
      status: 'fail',
      message: 'Too many requests, please try again later',
      code: 'RATE_LIMIT_EXCEEDED',
    });
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10, // 10 requests per window
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req, res) => {
    return res.status(429).json({
      status: 'fail',
      message: 'Too many authentication attempts, please try again later',
      code: 'RATE_LIMIT_EXCEEDED',
    });
  },
});
