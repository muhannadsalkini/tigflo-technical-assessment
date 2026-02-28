import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createAppointmentSchema, querySchema } from './appointment.schema';
import {
  listHandler,
  getByIdHandler,
  createHandler,
  cancelHandler,
} from './appointment.controller';

const router = Router();

// All appointment routes require authentication
router.use(authenticate);

router.get('/', validate(querySchema, 'query'), listHandler);
router.post('/', requireRole(Role.PATIENT), validate(createAppointmentSchema), createHandler);
router.get('/:id', getByIdHandler);
router.patch('/:id/cancel', cancelHandler);

export default router;
