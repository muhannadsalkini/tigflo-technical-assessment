import { Request, Response, NextFunction } from 'express';
import * as service from './appointment.service';
import { sendSuccess } from '../../utils/apiResponse';
import { AppointmentQuery } from './appointment.types';

export async function listHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const appointments = await service.list(req.user!, req.query as AppointmentQuery);
    sendSuccess(res, appointments);
  } catch (err) {
    next(err);
  }
}

export async function getByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const appointment = await service.getById(req.params.id as string, req.user!);
    sendSuccess(res, appointment);
  } catch (err) {
    next(err);
  }
}

export async function createHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const appointment = await service.create(req.user!.id, req.body);
    sendSuccess(res, appointment, 201);
  } catch (err) {
    next(err);
  }
}

export async function cancelHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const appointment = await service.cancel(req.params.id as string, req.user!);
    sendSuccess(res, appointment);
  } catch (err) {
    next(err);
  }
}
