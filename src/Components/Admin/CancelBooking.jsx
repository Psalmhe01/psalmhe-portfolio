import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import emailjs from "@emailjs/browser";
import { renderToStaticMarkup } from "react-dom/server";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { CancellationConfirmationEmail, AdminCancellationNoticeEmail } from "./EmailTemplates";
import {
  Container,
  Paper,
  Title,
  Text,
  Button,
  Stack,
  Loader,
  Center,
  Alert,
  Box,
} from "@mantine/core";

export default function CancelBooking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    async function fetchBooking() {
      if (!id) return;
      try {
        const bookingRef = doc(db, "bookings", id);
        const snap = await getDoc(bookingRef);
        if (snap.exists()) {
          setBooking(snap.data());
        } else {
          setError(
            "This booking request could not be found. It may have already been cancelled or processed.",
          );
        }
      } catch (err) {
        console.error("Error fetching booking:", err);
        setError("An error occurred while fetching the booking details.");
      } finally {
        setLoading(false);
      }
    }
    fetchBooking();
  }, [id]);

  const handleCancel = async () => {
    if (!id) return;
    setCancelling(true);
    try {
      // Notify photographer via email before deletion while we still have data
      if (booking) {
        const adminEmailHtml = renderToStaticMarkup(
          <AdminCancellationNoticeEmail {...booking} />
        );

        const clientEmailHtml = renderToStaticMarkup(
          <CancellationConfirmationEmail {...booking} />
        );

        // Send notification to Admin
        await emailjs.send(
          import.meta.env.VITE_EMAILJS_SERVICE_ID,
          import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
          {
            client_name: `${booking.firstName} ${booking.lastName}`,
            client_email: 'psalmhe@gmail.com',
            message_html: adminEmailHtml,
          },
          import.meta.env.VITE_EMAILJS_PUBLIC_KEY
        );

        // Send confirmation to Client
        await emailjs.send(
          import.meta.env.VITE_EMAILJS_SERVICE_ID,
          import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
          {
            client_name: booking.firstName,
            client_email: booking.email,
            message_html: clientEmailHtml,
          },
          import.meta.env.VITE_EMAILJS_PUBLIC_KEY
        );
      }

      // Delete from both collections to free up the slot
      await deleteDoc(doc(db, "availability", id));
      await deleteDoc(doc(db, "bookings", id));
      setCancelled(true);
    } catch (err) {
      console.error("Cancellation Error:", err);
      alert("Failed to cancel the appointment. Please try again later.");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <Center h="calc(100vh - 180px)">
        <Loader size="xl" />
      </Center>
    );
  }

  return (
    <Container size="sm" py={100}>
      <Paper withBorder p="xl" radius={0} shadow="sm">
        {cancelled ? (
          <Stack align="center" ta="center" gap="lg">
            <Title order={2}>Appointment Cancelled</Title>
            <Text>
              Your photography session request has been successfully removed.
              The date and time slot is now available for other clients.
            </Text>
            <Button variant="default" onClick={() => navigate("/")} radius={0}>
              Return to Homepage
            </Button>
          </Stack>
        ) : error ? (
          <Stack align="center" ta="center" gap="lg">
            <Alert color="red" title="Booking Not Found" radius={0} w="100%">
              {error}
            </Alert>
            <Button variant="default" onClick={() => navigate("/")} radius={0}>
              Return to Homepage
            </Button>
          </Stack>
        ) : (
          <Stack gap="xl">
            <Box>
              <Title order={2}>Cancel Your Appointment</Title>
              <Text c="dimmed" size="sm" mt="xs">
                Are you sure you want to cancel your session? This action will
                immediately free up the slot for other clients and cannot be
                undone.
              </Text>
            </Box>

            <Paper withBorder p="md" bg="gray.0" radius={0}>
              <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                Session Details
              </Text>
              <Text fw={600} size="lg" mt="xs">
                {booking.bookingDate} at {booking.bookingTime}
              </Text>
              <Text size="sm">
                Client: {booking.firstName} {booking.lastName}
              </Text>
              {booking.occasion && (
                <Text size="sm">Occasion: {booking.occasion}</Text>
              )}
            </Paper>

            <Stack gap="sm">
              <Button
                color="red"
                size="lg"
                onClick={handleCancel}
                loading={cancelling}
                radius={0}
              >
                Yes, Cancel Appointment
              </Button>
              <Button
                variant="subtle"
                color="gray"
                onClick={() => navigate("/")}
                radius={0}
              >
                No, Keep My Appointment
              </Button>
            </Stack>
          </Stack>
        )}
      </Paper>
    </Container>
  );
}
