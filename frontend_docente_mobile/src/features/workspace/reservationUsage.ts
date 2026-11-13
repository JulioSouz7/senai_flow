export interface ReservationUsageRecord {
  status?: string;
  reserva_horario?: Array<{ dt_reserva?: string }>;
}

const SLOT_MINUTES = 50;
export const WEEKLY_LIMIT = 10 * 60;
const COUNTED_STATUSES = new Set(['PENDENTE', 'CONFIRMADA', 'ENCERRADA']);

function localDate(value: string): Date | null {
  const [year, month, day] = value.split('T')[0].split('-').map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

function mondayOf(date: Date): Date {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return monday;
}

export function calculateWeeklyUsage(
  reservations: ReservationUsageRecord[],
  referenceDate: Date | string = new Date(),
): number {
  const date = typeof referenceDate === 'string'
    ? localDate(referenceDate)
    : referenceDate;
  if (!date) return 0;
  const weekStart = mondayOf(date);
  const nextWeek = new Date(weekStart);
  nextWeek.setDate(nextWeek.getDate() + 7);

  return reservations.reduce((total, reservation) => {
    if (!COUNTED_STATUSES.has(String(reservation.status ?? '').toUpperCase())) return total;
    const slots = (reservation.reserva_horario ?? []).filter((slot) => {
      if (!slot.dt_reserva) return false;
      const date = localDate(slot.dt_reserva);
      return date !== null && date >= weekStart && date < nextWeek;
    });
    return total + slots.length * SLOT_MINUTES;
  }, 0);
}

export function formatUsage(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes === 0 ? `${hours}h` : `${hours}h ${remainingMinutes}min`;
}
