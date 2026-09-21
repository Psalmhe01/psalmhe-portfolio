import { doc, getDoc, runTransaction } from "firebase/firestore";
import { db } from "./firebase";

import { isCancellationToken } from "./bookingTokens";
export { createCancellationToken, isCancellationToken, cancellationDetails } from "./bookingTokens";

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
