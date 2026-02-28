import { AppointmentStatus } from '@prisma/client';

export interface CreateAppointmentBody {
  doctorId: string;
  dateTime: string;
  duration: number;
  notes?: string;
}

export interface AppointmentQuery {
  status?: AppointmentStatus;
  date?: string;
}

export interface AppointmentWithUsers {
  id: string;
  patientId: string;
  doctorId: string;
  dateTime: Date;
  duration: number;
  status: AppointmentStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  patient: { id: string; name: string; email: string };
  doctor: { id: string; name: string; email: string };
}
