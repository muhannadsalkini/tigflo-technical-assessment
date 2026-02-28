import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { sendError } from '../utils/apiResponse';

/**
 * Global Express error handler.
 * - AppError instances → their own statusCode and message
 * - Everything else → 500 with a generic message (no internals leaked)
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode);
    return;
  }

  // Log unexpected errors server-side only
  console.error('[Unhandled Error]', err);
  sendError(res, 'Internal server error', 500);
}
