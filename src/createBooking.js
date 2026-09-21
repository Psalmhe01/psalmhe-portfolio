import { db } from "./firebase";
import { reserveBooking } from "./bookingReservations";
export const createBooking = input => reserveBooking(db, input);
