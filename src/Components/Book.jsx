import { useEffect, useMemo, useState, useRef } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { sendCancellationEmails } from "./Admin/sendCancellationEmails";
import { createCancellationToken, cancelWithToken } from "../bookingAccess";
import { createBooking } from "../createBooking";
import { BOOKING_TIME_ZONE, bookingLocalTime } from "../bookingTime";
import { db } from "../firebase.js";
import {
  Box,
  Button,
  Container,
  Group,
  Modal,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Select,
  Textarea,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import "../Style/Book.css";

const TIME_SLOTS = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
];

function Book() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  const localNow = bookingLocalTime(now);
  const today = localNow.slice(0, 10);
  const attempt = useRef(null);

  const [bookingDate, setBookingDate] = useState(today);
  const [bookingTime, setBookingTime] = useState("");
  const [bookedSlots, setBookedSlots] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [submittedBooking, setSubmittedBooking] = useState(null);
  const [successOpened, { open: openSuccess, close: closeSuccess }] =
    useDisclosure(false);
  const [cancelOpened, { open: openCancel, close: closeCancel }] =
    useDisclosure(false);
  const [cancelSuccessOpened, { open: openCancelSuccess, close: closeCancelSuccess }] =
    useDisclosure(false);

  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [availabilityError, setAvailabilityError] = useState(false);

  useEffect(() => {
    setBookedSlots([]);
    setAvailabilityLoading(true);
    setAvailabilityError(false);
    if (!bookingDate) return;
    return onSnapshot(
      query(collection(db, "availability"), where("date", "==", bookingDate)),
      (snapshot) => {
        setBookedSlots(snapshot.docs.map((entry) => entry.id.split(" ")[1]));
        setAvailabilityLoading(false);
      },
      () => {
        setAvailabilityError(true);
        setAvailabilityLoading(false);
      },
    );
  }, [bookingDate]);

  const availableTimeSlots = useMemo(() => {
    return TIME_SLOTS.filter((slot) => !bookedSlots.includes(slot) && `${bookingDate} ${slot}` > localNow);
  }, [bookingDate, bookedSlots, localNow]);

  useEffect(() => {
    if (isSubmitting || attempt.current) return;
    if (
      availableTimeSlots.length > 0 &&
      !availableTimeSlots.includes(bookingTime)
    ) {
      setBookingTime(availableTimeSlots[0]);
    } else if (availableTimeSlots.length === 0) {
      setBookingTime("");
    }
  }, [availableTimeSlots, bookingTime, isSubmitting]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting || availabilityLoading || availabilityError) return;
    const form = event.currentTarget;
    setStatusMessage("");

    const formData = new FormData(event.currentTarget);
    const firstName = String(formData.get("firstName") || "").trim();
    const lastName = String(formData.get("lastName") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const occasion = String(formData.get("occasion") || "").trim();
    const notes = String(formData.get("notes") || "").trim();

    if (
      !firstName ||
      !lastName ||
      !email ||
      !phone ||
      !bookingDate ||
      !bookingTime
    ) {
      setStatusMessage(
        "Please complete all required fields before submitting.",
      );
      return;
    }

    const payload = { firstName, lastName, email, phone, occasion, notes, bookingDate, bookingTime };
    const fingerprint = JSON.stringify(payload);
    const retrying = attempt.current?.fingerprint === fingerprint;
    if (!retrying && (!availableTimeSlots.includes(bookingTime) || `${bookingDate} ${bookingTime}` <= bookingLocalTime())) {
      setStatusMessage("Please choose a future, available time.");
      return;
    }
    if (!retrying) {
      attempt.current = { fingerprint, requestId: createCancellationToken() };
    }

    setIsSubmitting(true);

    try {
      const result = await createBooking({ ...payload, requestId: attempt.current.requestId });

      // Notification delivery must never turn a saved booking into an apparent failure.
      fetch("https://formspree.io/f/xkgqzeey", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          occasion,
          bookingDate,
          bookingTime,
          notes,
          subject: "New photography booking request",
          message: `New booking request for ${bookingDate} at ${bookingTime} (${BOOKING_TIME_ZONE}).\nClient: ${firstName} ${lastName}\nEmail: ${email}\nPhone: ${phone}\nOccasion: ${occasion || "N/A"}\nNotes: ${notes || "N/A"}`,
        }),
      }).then((response) => {
        if (!response.ok) throw new Error("Notification delivery failed");
      }).catch(() => console.warn("Booking saved; photographer notification could not be delivered."));

      const finalData = result;
      attempt.current = null;

      setSubmittedBooking(finalData);
      setStatusMessage("Your booking request has been received.");
      form.reset();
      setBookingDate(today);
      openSuccess();
    } catch (error) {
      console.error("Booking Error:", error);
      if (!["internal", "unavailable", "deadline-exceeded", "unknown"].includes(error?.code)) attempt.current = null;
      if (error?.code === "already-exists") {
        setStatusMessage(
          "That date and time is already booked. Please choose another slot.",
        );
      } else if (["invalid-argument", "resource-exhausted", "failed-precondition"].includes(error?.code)) {
        setStatusMessage(error.message);
      } else if (["permission-denied", "unauthenticated", "permission-denied"].includes(error?.code)) {
        setStatusMessage(
          "We could not reserve that time. Please refresh and try again, or contact the photographer.",
        );
      } else {
        setStatusMessage(
          "We could not confirm the response. Retry with the same details to check your request.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!submittedBooking) return;
    setIsSubmitting(true);
    try {
      const cancelledBooking = await cancelWithToken(submittedBooking.cancellationToken);
      void sendCancellationEmails(cancelledBooking);

      closeCancel();
      closeSuccess();
      setSubmittedBooking(null);
      openCancelSuccess();
    } catch (error) {
      console.error("Cancellation Error:", error);
      alert("Failed to cancel the appointment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="booking-container">
      <Container size="lg">
        <Paper
          p={{ base: "xl", md: "2rem" }}
          radius="md"
          shadow="sm"
          withBorder
          style={{ maxWidth: 980, margin: "0 auto" }}
        >
          <Stack gap="lg">
            <Title order={1}>Book Your Photography Session</Title>
            <Text size="lg" c="dimmed" maw={700}>
              Reserve a date and time directly on the site. Your request is
              checked against existing appointments before it is saved, so
              duplicate bookings are prevented.
            </Text>

            <form
              onSubmit={handleSubmit}
              style={{ display: "grid", gap: "1rem" }}
            >
              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                <TextInput
                  label="First Name"
                  name="firstName"
                  maxLength={99}
                  placeholder="Enter your first name"
                  required
                />
                <TextInput
                  label="Last Name"
                  name="lastName"
                  maxLength={99}
                  placeholder="Enter your last name"
                  required
                />
                <TextInput
                  label="Email Address"
                  name="email"
                  maxLength={254}
                  type="email"
                  placeholder="name@example.com"
                  required
                />
                <TextInput
                  label="Phone Number"
                  name="phone"
                  minLength={6}
                  maxLength={24}
                  placeholder="(555) 123-4567"
                  required
                />
              </SimpleGrid>

              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                <TextInput
                  label="Preferred Date"
                  type="date"
                  name="bookingDate"
                  value={bookingDate}
                  min={today}
                  onChange={(event) =>
                    setBookingDate(event.currentTarget.value)
                  }
                  required
                />
                <Select
                  label={`Preferred Time (${BOOKING_TIME_ZONE})`}
                  name="bookingTime"
                  placeholder="Pick a time"
                  data={attempt.current && bookingTime && !availableTimeSlots.includes(bookingTime) ? [bookingTime, ...availableTimeSlots] : availableTimeSlots}
                  value={bookingTime}
                  disabled={availabilityLoading || availabilityError || (availableTimeSlots.length === 0 && !attempt.current)}
                  onChange={setBookingTime}
                  required
                />
              </SimpleGrid>

              <TextInput
                label="Occasion"
                name="occasion"
                  maxLength={199}
                placeholder="Portraits, maternity, family session, event, etc."
              />
              <Textarea
                label="Notes"
                name="notes"
                  maxLength={999}
                minRows={4}
                placeholder="Tell me about your session, location, or any special requests."
              />

              <Text
                size="sm"
                c={availableTimeSlots.length === 0 ? "red" : "teal"}
                fw={600}
              >
                {availabilityLoading ? "Checking availability..." : availabilityError ? "Unable to load availability. Please refresh and try again." : availableTimeSlots.length === 0
                  ? "No slots available for this date. Please pick another day."
                  : "Please choose an available time slot above."}
              </Text>

              {statusMessage ? (
                <Text c={statusMessage.includes("received") ? "teal" : "red"}>
                  {statusMessage}
                </Text>
              ) : null}

              <Button
                type="submit"
                size="lg"
                loading={isSubmitting}
                disabled={!bookingTime || availabilityLoading || availabilityError}
              >
                Submit Booking Request
              </Button>
            </form>
          </Stack>
        </Paper>
      </Container>

      {/* Confirmation Modal */}
      <Modal
        opened={successOpened}
        onClose={closeSuccess}
        title="Booking Request Received"
        centered
        radius="md"
        size="lg"
      >
        {submittedBooking && (
          <Stack gap="md">
            <Box>
              <Text fw={700} size="lg" c="teal">
                Thank you, {submittedBooking.firstName}!
              </Text>
              <Text size="sm" c="dimmed">
                Your request for {submittedBooking.bookingDate} at{" "}
                {submittedBooking.bookingTime} has been sent.
              </Text>
            </Box>

            <Paper withBorder p="sm" bg="gray.0">
              <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                Details
              </Text>
              <SimpleGrid cols={2} mt="xs">
                <Box>
                  <Text size="xs" c="dimmed">
                    Client
                  </Text>
                  <Text size="sm" fw={500}>
                    {submittedBooking.firstName} {submittedBooking.lastName}
                  </Text>
                </Box>
                <Box>
                  <Text size="xs" c="dimmed">
                    Contact
                  </Text>
                  <Text size="sm">{submittedBooking.email}</Text>
                  <Text size="sm">{submittedBooking.phone}</Text>
                </Box>
              </SimpleGrid>
              <Box mt="sm">
                <Text size="xs" c="dimmed">
                  Occasion
                </Text>
                <Text size="sm">
                  {submittedBooking.occasion || "Not specified"}
                </Text>
              </Box>
              {submittedBooking.notes && (
                <Box mt="sm">
                  <Text size="xs" c="dimmed">
                    Notes
                  </Text>
                  <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                    {submittedBooking.notes}
                  </Text>
                </Box>
              )}
            </Paper>

            <Group justify="flex-end" mt="xl">
              <Button variant="subtle" color="red" onClick={openCancel}>
                Cancel Appointment
              </Button>
              <Button onClick={closeSuccess}>Close</Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* Cancellation Confirmation Modal */}
      <Modal
        opened={cancelOpened}
        onClose={closeCancel}
        title="Confirm Cancellation"
        centered
        radius="md"
        size="sm"
        zIndex={3000}
      >
        <Stack gap="md">
          <Text size="sm">
            Are you sure you want to cancel this appointment request? This
            action cannot be undone.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={closeCancel}>
              No, Keep it
            </Button>
            <Button
              color="red"
              onClick={handleCancelBooking}
              loading={isSubmitting}
            >
              Yes, Cancel
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Cancellation Success Feedback Modal */}
      <Modal
        opened={cancelSuccessOpened}
        onClose={closeCancelSuccess}
        title="Request Cancelled"
        centered
        radius="md"
        size="sm"
      >
        <Stack gap="md" py="md">
          <Text size="sm">
            Your appointment request has been successfully cancelled. The date
            and time slot is now available for other clients.
          </Text>
          <Group justify="flex-end">
            <Button onClick={closeCancelSuccess}>Close</Button>
          </Group>
        </Stack>
      </Modal>
    </section>
  );
}

export default Book;
