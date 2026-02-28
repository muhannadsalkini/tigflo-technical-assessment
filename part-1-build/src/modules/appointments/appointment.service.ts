import { AppointmentStatus, Role } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { getDayRange, getAppointmentEnd } from '../../utils/date';
import { findDoctorById } from '../users/user.service';
import { CreateAppointmentBody, AppointmentQuery } from './appointment.types';

/** Fields selected for any appointment response that includes patient/doctor info. */
const APPOINTMENT_WITH_USERS_SELECT = {
  id: true,
  patientId: true,
  doctorId: true,
  dateTime: true,
  duration: true,
  status: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  patient: { select: { id: true, name: true, email: true } },
  doctor: { select: { id: true, name: true, email: true } },
} as const;

export async function list(user: { id: string; role: Role }, query: AppointmentQuery) {
  const where: Record<string, unknown> = {};

  if (user.role === Role.PATIENT) where.patientId = user.id;
  if (user.role === Role.DOCTOR) where.doctorId = user.id;
  if (query.status) where.status = query.status;
  if (query.date) where.dateTime = getDayRange(query.date);

  return prisma.appointment.findMany({
    where,
    select: APPOINTMENT_WITH_USERS_SELECT,
    orderBy: { dateTime: 'asc' },
  });
}

export async function getById(id: string, user: { id: string; role: Role }) {
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    select: APPOINTMENT_WITH_USERS_SELECT,
  });

  if (!appointment) throw new AppError('Appointment not found', 404);

  if (user.role !== Role.ADMIN) {
    const isOwner =
      (user.role === Role.PATIENT && appointment.patientId === user.id) ||
      (user.role === Role.DOCTOR && appointment.doctorId === user.id);

    if (!isOwner) throw new AppError('Forbidden', 403);
  }

  return appointment;
}

export async function create(patientId: string, body: CreateAppointmentBody) {
  const doctor = await findDoctorById(body.doctorId);
  if (!doctor) throw new AppError('Doctor not found', 404);

  const newStart = new Date(body.dateTime);
  const newDuration = body.duration ?? 30;
  const newEnd = getAppointmentEnd(newStart, newDuration);

  /**
   * Overlap detection via raw SQL for correctness and performance.
   * Two time slots [A_start, A_end) and [B_start, B_end) overlap when:
   *   A_start < B_end  AND  A_end > B_start
   */
  // Using Prisma Client instead of raw SQL to avoid parameter casting issues
  // Get all scheduled appointments for the doctor on the target day
  const targetDateOnly = new Date(newStart);
  targetDateOnly.setUTCHours(0, 0, 0, 0);
  const nextDateOnly = new Date(targetDateOnly);
  nextDateOnly.setUTCDate(nextDateOnly.getUTCDate() + 1);

  const existingAppointments = await prisma.appointment.findMany({
    where: {
      doctorId: body.doctorId,
      status: AppointmentStatus.SCHEDULED,
      dateTime: {
        gte: targetDateOnly,
        lt: nextDateOnly,
      },
    },
    select: {
      id: true,
      dateTime: true,
      duration: true,
    },
  });

  // Overlap means: existing.start < new.end AND existing.end > new.start
  const hasConflict = existingAppointments.some((appt) => {
    const existingStart = appt.dateTime.getTime();
    const existingEnd = existingStart + appt.duration * 60000; // ms
    return existingStart < newEnd.getTime() && existingEnd > newStart.getTime();
  });

  if (hasConflict) {
    throw new AppError("This time slot conflicts with the doctor's existing appointment", 409);
  }

  return prisma.appointment.create({
    data: {
      patientId,
      doctorId: body.doctorId,
      dateTime: newStart,
      duration: newDuration,
      notes: body.notes,
    },
    select: {
      id: true,
      patientId: true,
      doctorId: true,
      dateTime: true,
      duration: true,
      status: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function cancel(id: string, user: { id: string; role: Role }) {
  const appointment = await prisma.appointment.findUnique({ where: { id } });

  if (!appointment) throw new AppError('Appointment not found', 404);

  if (user.role !== Role.ADMIN) {
    const isOwner =
      (user.role === Role.PATIENT && appointment.patientId === user.id) ||
      (user.role === Role.DOCTOR && appointment.doctorId === user.id);

    if (!isOwner) throw new AppError('Forbidden', 403);
  }

  if (appointment.status === AppointmentStatus.CANCELLED) {
    throw new AppError('Appointment is already cancelled', 400);
  }

  return prisma.appointment.update({
    where: { id },
    data: { status: AppointmentStatus.CANCELLED },
    select: APPOINTMENT_WITH_USERS_SELECT,
  });
}
