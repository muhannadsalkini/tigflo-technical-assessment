/**
 * Returns the start (00:00:00 UTC) and end (next day 00:00:00 UTC)
 * of a given YYYY-MM-DD date string, for use in Prisma date-range filters.
 */
export function getDayRange(dateStr: string): { gte: Date; lt: Date } {
  const start = new Date(`${dateStr}T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { gte: start, lt: end };
}

/**
 * Computes the end time of an appointment given its start and duration (minutes).
 */
export function getAppointmentEnd(start: Date, durationMinutes: number): Date {
  return new Date(start.getTime() + durationMinutes * 60_000);
}
