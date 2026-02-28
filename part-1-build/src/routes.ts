import { Router } from 'express';
import authRouter from './modules/auth/auth.routes';
import appointmentRouter from './modules/appointments/appointment.routes';

const router = Router();

router.use('/auth', authRouter);
router.use('/appointments', appointmentRouter);

export default router;
