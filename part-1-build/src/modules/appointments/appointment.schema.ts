import { z } from 'zod';
import { AppointmentStatus } from '@prisma/client';

export const createAppointmentSchema = z.object({
  doctorId: z.string().uuid('doctorId must be a valid UUID'),
  dateTime: z
    .string()
    .datetime({ message: 'dateTime must be a valid ISO 8601 datetime string' })
    .refine((val) => new Date(val) > new Date(), {
      message: 'dateTime must be a future date and time',
    }),
  duration: z
    .number()
    .int('Duration must be a whole number')
    .positive('Duration must be a positive integer')
    .default(30),
  notes: z.string().optional(),
});

export const querySchema = z.object({
  status: z.nativeEnum(AppointmentStatus).optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be in YYYY-MM-DD format')
    .optional(),
});
