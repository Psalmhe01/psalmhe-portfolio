import { doc, runTransaction, Timestamp } from "firebase/firestore";
import { sessionDate, TIME_SLOTS } from "./bookingSchedule.js";

export async function blockBookingSlots(db, date, times) {
  const uniqueTimes = [...new Set(times)];
  if (uniqueTimes.length === 0 || uniqueTimes.length > TIME_SLOTS.length) throw new Error("Select at least one available time.");
  const slots = uniqueTimes.map((time) => {
    const startsAt = sessionDate(date, time);
    if (startsAt.getTime() <= Date.now() || startsAt.getTime() > Date.now() + 365 * 86400000) {
      throw new Error("Choose future times within one year.");
    }
    return { date, time, startsAt: Timestamp.fromDate(startsAt), ref: doc(db, "availability", date + " " + time), bookingRef: doc(db, "bookings", date + " " + time) };
  });

  return runTransaction(db, async (transaction) => {
    // Read all records before writing so the whole selection is atomic.
    const records = await Promise.all(slots.map(async (slot) => ({
      ...slot, availability: await transaction.get(slot.ref), booking: await transaction.get(slot.bookingRef),
    })));
    for (const slot of records) {
      if ((slot.availability.exists() && slot.availability.data().blocked !== true) ||
          (slot.booking.exists() && slot.booking.data().status !== "denied")) {
        throw new Error(`${slot.time} is already booked. No selected times were blocked.`);
      }
    }
    let blockedCount = 0;
    for (const slot of records) {
      if (!slot.availability.exists()) {
        transaction.set(slot.ref, { blocked: true, date: slot.date, time: slot.time, startsAt: slot.startsAt });
        blockedCount++;
      }
    }
    return blockedCount;
  });
}

export async function unblockBookingSlot(db, date, time) {
  sessionDate(date, time);
  return runTransaction(db, async (transaction) => {
    const ref = doc(db, "availability", date + " " + time);
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) return;
    if (snapshot.data().blocked !== true) throw new Error("This time belongs to a booking and cannot be unblocked.");
    transaction.delete(ref);
  });
}
