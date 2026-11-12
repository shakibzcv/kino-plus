import rateLimit from 'express-rate-limit';

/**
 * Standard API rate limit — applied to all protected content routes.
 * 200 requests per 15 minutes per IP.
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many requests. Please slow down and try again later.',
  },
});

/**
 * Auth rate limit — applied to login/OAuth endpoints.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many authentication attempts. Please wait 15 minutes and try again.',
  },
});

/**
 * Public endpoint rate limit — for unauthenticated routes like /public/trending.
 */
export const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many requests. Please slow down and try again later.',
  },
});

/**
 * Android TV device-poll rate limit — for QR code polling during TV sign-in.
 */
export const tvPollLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 120,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many polling requests. Please wait before trying again.',
  },
});
