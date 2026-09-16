import { doc, getDoc, runTransaction } from "firebase/firestore";
import { db } from "./firebase";

// A bearer capability: never put this token in public availability records.
export function createCancellationToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export const isCancellationToken = (token) => /^[a-f0-9]{64}$/.test(token || "");

export function cancellationDetails(booking) {
  return {
    slotKey: booking.slotKey,
    bookingDate: booking.bookingDate,
    bookingTime: booking.bookingTime,
    ...(booking.timeZone ? { timeZone: booking.timeZone } : {}),
    firstName: booking.firstName,
    lastName: booking.lastName,
    email: booking.email,
    occasion: booking.occasion || "",
  };
}

export async function getCancellation(token) {
  if (!isCancellationToken(token)) {
    throw new Error("This older cancellation link needs to be replaced. Please contact the photographer for a new confirmation email.");
  }
  const snapshot = await getDoc(doc(db, "bookingCancellations", token));
  if (!snapshot.exists()) throw new Error("This link has expired or the appointment has already been cancelled.");
  return snapshot.data();
}

export async function cancelWithToken(token) {
  if (!isCancellationToken(token)) throw new Error("Invalid cancellation link.");
  return runTransaction(db, async (transaction) => {
    const accessRef = doc(db, "bookingCancellations", token);
    const snapshot = await transaction.get(accessRef);
    if (!snapshot.exists()) return; // A repeated cancellation is harmless.
    const { slotKey } = snapshot.data();
    transaction.delete(doc(db, "bookings", slotKey));
    transaction.delete(doc(db, "availability", slotKey));
    transaction.delete(accessRef);
    return snapshot.data();
  });
}
