import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { sendCancellationEmails } from "./sendCancellationEmails";
import { getCancellation, cancelWithToken } from "../../bookingAccess";
import { notifications } from "@mantine/notifications";
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
    let active = true;
    setLoading(true);
    setError(null);
    getCancellation(id)
      .then((details) => { if (active) setBooking(details); })
      .catch((err) => { if (active) setError(err.code ? "Unable to load this cancellation link. Please try again or contact the photographer." : err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const handleCancel = async () => {
    if (cancelling) return;
    setCancelling(true);
    try {
      const cancelledBooking = await cancelWithToken(id);
      void sendCancellationEmails(cancelledBooking);
      setCancelled(true);
    } catch {
      notifications.show({
        title: "Cancellation Failed",
        message: "We couldn't cancel your appointment. Please try again or contact the photographer.",
        color: "red",
      });
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
            <Alert color="red" title="Cancellation Link Unavailable" radius={0} w="100%">
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
