import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { sendError } from '../utils/apiResponse';

/**
 * Middleware factory that restricts a route to specific roles.
 * Must be used after the `authenticate` middleware.
 *
 * @example router.post('/', authenticate, requireRole(Role.PATIENT), handler)
 */
export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      sendError(res, 'Forbidden: insufficient permissions', 403);
      return;
    }
    next();
  };
}
