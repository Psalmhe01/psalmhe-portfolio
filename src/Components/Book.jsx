import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  deleteDoc,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from "firebase/firestore";
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
  const today = useMemo(() => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const localDate = new Date(now.getTime() - offset * 60 * 1000);
    return localDate.toISOString().split("T")[0];
  }, []);

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

  useEffect(() => {
    let isMounted = true;

    async function fetchAvailability() {
      if (!bookingDate) return;

      try {
        const q = query(
          collection(db, "availability"),
          where("date", "==", bookingDate),
        );
        const querySnapshot = await getDocs(q);
        const booked = [];
        querySnapshot.forEach((doc) => {
          const time = doc.id.split(" ")[1];
          if (time) booked.push(time);
        });
        if (isMounted) setBookedSlots(booked);
      } catch (err) {
        console.error("Error fetching availability:", err);
      }
    }

    fetchAvailability();

    return () => {
      isMounted = false;
    };
  }, [bookingDate]);

  const availableTimeSlots = useMemo(() => {
    const isToday = bookingDate === today;
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    return TIME_SLOTS.filter((slot) => {
      if (bookedSlots.includes(slot)) return false;

      if (isToday) {
        const [hour, minute] = slot.split(":").map(Number);
        if (hour < currentHour) return false;
        if (hour === currentHour && minute <= currentMinute) return false;
      }

      return true;
    });
  }, [bookingDate, bookedSlots, today]);

  useEffect(() => {
    if (
      availableTimeSlots.length > 0 &&
      !availableTimeSlots.includes(bookingTime)
    ) {
      setBookingTime(availableTimeSlots[0]);
    } else if (availableTimeSlots.length === 0) {
      setBookingTime("");
    }
  }, [availableTimeSlots, bookingTime]);

  const handleSubmit = async (event) => {
    event.preventDefault();
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

    const slotKey = `${bookingDate} ${bookingTime}`;

    setIsSubmitting(true);

    try {
      const availabilityRef = doc(db, "availability", slotKey);
      const bookingRef = doc(db, "bookings", slotKey);

      await runTransaction(db, async (transaction) => {
        // We get both documents to ensure the transaction treats the subsequent
        // sets as 'create' operations with an 'exists: false' precondition.
        const availSnap = await transaction.get(availabilityRef); // only read this one

        if (availSnap.exists()) {
          throw new Error("SLOT_TAKEN");
        }

        // Mark the slot as taken in the public availability collection.
        // We store 'date' so we can query all booked slots for a given day.
        transaction.set(availabilityRef, { booked: true, date: bookingDate });

        // Save the private booking details in the protected bookings collection
        transaction.set(bookingRef, {
          firstName,
          lastName,
          email,
          phone,
          occasion,
          notes,
          bookingDate,
          bookingTime,
          slotKey,
          status: "pending",
          createdAt: serverTimestamp(),
        });
      });

      await fetch("https://formspree.io/f/xkgqzeey", {
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
          message: `New booking request for ${bookingDate} at ${bookingTime}.\nClient: ${firstName} ${lastName}\nEmail: ${email}\nPhone: ${phone}\nOccasion: ${occasion || "N/A"}\nNotes: ${notes || "N/A"}`,
        }),
      });

      const finalData = {
        firstName,
        lastName,
        email,
        phone,
        occasion,
        notes,
        bookingDate,
        bookingTime,
        slotKey,
      };

      setSubmittedBooking(finalData);
      setStatusMessage("Your booking request has been received.");
      form.reset();
      setBookingDate(today);
      openSuccess();
    } catch (error) {
      console.error("Booking Error:", error);
      if (error?.message === "SLOT_TAKEN") {
        setStatusMessage(
          "That date and time is already booked. Please choose another slot.",
        );
      } else if (error?.code === "permission-denied") {
        setStatusMessage(
          "Access denied. Please ensure your Firestore Security Rules allow writes to 'availability' and 'bookings'.",
        );
      } else {
        setStatusMessage(
          "We could not save your request right now. Please try again in a moment.",
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
      const slotKey = submittedBooking.slotKey;
      await deleteDoc(doc(db, "availability", slotKey));
      await deleteDoc(doc(db, "bookings", slotKey));

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
                  placeholder="Enter your first name"
                  required
                />
                <TextInput
                  label="Last Name"
                  name="lastName"
                  placeholder="Enter your last name"
                  required
                />
                <TextInput
                  label="Email Address"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                />
                <TextInput
                  label="Phone Number"
                  name="phone"
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
                  label="Preferred Time"
                  name="bookingTime"
                  placeholder="Pick a time"
                  data={availableTimeSlots}
                  value={bookingTime}
                  disabled={availableTimeSlots.length === 0}
                  onChange={setBookingTime}
                  required
                />
              </SimpleGrid>

              <TextInput
                label="Occasion"
                name="occasion"
                placeholder="Portraits, maternity, family session, event, etc."
              />
              <Textarea
                label="Notes"
                name="notes"
                minRows={4}
                placeholder="Tell me about your session, location, or any special requests."
              />

              <Text
                size="sm"
                c={availableTimeSlots.length === 0 ? "red" : "teal"}
                fw={600}
              >
                {availableTimeSlots.length === 0
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
                disabled={!bookingTime}
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
        title="Booking Request Confirmed"
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
