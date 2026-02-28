import { Role } from '@prisma/client';
import { prisma } from '../../config/prisma';

/** Find a user by email, including the hashed password (for auth comparisons). */
export function findByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

/** Find a user by ID, returning only public-safe fields. */
export function findById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, role: true },
  });
}

/** Find a user by ID only if they have the DOCTOR role. */
export function findDoctorById(id: string) {
  return prisma.user.findFirst({
    where: { id, role: Role.DOCTOR },
    select: { id: true, email: true, name: true, role: true },
  });
}
