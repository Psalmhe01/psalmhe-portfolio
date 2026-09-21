export const BOOKING_TIME_ZONE = "America/Chicago";
export function sessionDate(date, time) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^(09|1[0-8]):00$/.test(time)) throw Error("Choose a valid date and time.");
  const base = new Date(date + "T00:00:00Z");
  if (!Number.isFinite(base.getTime()) || base.toISOString().slice(0, 10) !== date) throw Error("Choose a valid calendar date.");
  const year = base.getUTCFullYear();
  const march = new Date(Date.UTC(year, 2, 1));
  const november = new Date(Date.UTC(year, 10, 1));
  const start = Date.UTC(year, 2, 8 + (7 - march.getUTCDay()) % 7);
  const end = Date.UTC(year, 10, 1 + (7 - november.getUTCDay()) % 7);
  // All supported appointments are after 09:00, after DST transitions.
  const offset = base.getTime() >= start && base.getTime() < end ? 5 : 6;
  return new Date(base.getTime() + (Number(time.slice(0, 2)) + offset) * 3600000);
}
