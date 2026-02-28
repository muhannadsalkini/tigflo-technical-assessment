import { Request, Response, NextFunction } from 'express';
import { register, login } from './auth.service';
import { sendSuccess } from '../../utils/apiResponse';

export async function registerHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await register(req.body);
    sendSuccess(res, user, 201);
  } catch (err) {
    next(err);
  }
}

export async function loginHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await login(req.body);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}
