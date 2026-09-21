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

