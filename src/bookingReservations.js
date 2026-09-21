import { doc, runTransaction, serverTimestamp, Timestamp } from "firebase/firestore";
import { cancellationDetails, isCancellationToken } from "./bookingTokens.js";
import { BOOKING_TIME_ZONE, sessionDate } from "./bookingSchedule.js";
function fail(code, message) { return Object.assign(new Error(message), { code }); }
export async function reserveBooking(db, input) {
  const { requestId, ...payload } = input;
  if (!isCancellationToken(requestId)) throw fail("invalid-argument", "Invalid booking request.");
  const startsAt = sessionDate(payload.bookingDate, payload.bookingTime);
  const digest = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(payload)))),
    byte => byte.toString(16).padStart(2, "0")).join("");
  const slotKey = payload.bookingDate + " " + payload.bookingTime;
  const result = { ...payload, slotKey, timeZone: BOOKING_TIME_ZONE, cancellationToken: requestId };
  return runTransaction(db, async tx => {
    const receiptRef = doc(db, "bookingReceipts", requestId);
    const receipt = await tx.get(receiptRef);
    if (receipt.exists()) {
      if (receipt.data().digest !== digest || receipt.data().slotKey !== slotKey) throw fail("invalid-argument", "This request has changed.");
      const capability = await tx.get(doc(db, "bookingCancellations", requestId));
      if (!capability.exists()) throw fail("failed-precondition", "This request was cancelled or declined. Start a new request.");
      return result;
    }
    if (startsAt.getTime() <= Date.now() || startsAt.getTime() > Date.now() + 365 * 86400000) {
      throw fail("invalid-argument", "Choose a future appointment within one year.");
    }
    const availabilityRef = doc(db, "availability", slotKey);
    if ((await tx.get(availabilityRef)).exists()) throw fail("already-exists", "That time is already booked.");
    tx.set(doc(db, "bookings", slotKey), { ...result, startsAt: Timestamp.fromDate(startsAt), status: "pending", createdAt: serverTimestamp() });
    tx.set(availabilityRef, { booked: true, date: payload.bookingDate });
    tx.set(doc(db, "bookingCancellations", requestId), cancellationDetails(result));
    tx.set(receiptRef, { slotKey, digest, createdAt: serverTimestamp() });
    return result;
  });
}
