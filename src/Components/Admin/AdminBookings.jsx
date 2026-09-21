import { useEffect, useState } from "react";
import emailjs from "@emailjs/browser";
import { renderToStaticMarkup } from "react-dom/server";
import { useAuth } from "../../Context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import { ConfirmationEmail, DenialEmail } from "./EmailTemplates";
import {
  collection,
  getDocs,
  runTransaction,
  doc,
  query,
  orderBy,
} from "firebase/firestore";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { createCancellationToken, cancellationDetails } from "../../bookingAccess";
import { db } from "../../firebase";

import {
  Container,
  Paper,
  Stack,
  Text,
  Title,
  Table,
  Badge,
  Button,
  Group,
  Loader,
  Alert,
  Modal,
  ScrollArea,
  SimpleGrid,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

/**
 * AdminBookings Component
 * Allows viewing and managing booking requests.
 * Requires Firebase Authentication for access based on firestore.rules.
 */
function AdminBookings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [opened, { open, close }] = useDisclosure(false);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(db, "bookings"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setBookings(data);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setError(
        "Failed to load bookings. Ensure you are logged in as an administrator.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user === null) {
      navigate("/admin");
    } else if (user !== undefined) {
      fetchBookings();
    }
  }, [user, navigate]);

  const handleStatusUpdate = async (booking, newStatus) => {
    if (busyId) return;
    setBusyId(booking.id);
    let emailBooking;
    try {
      emailBooking = await runTransaction(db, async (transaction) => {
        const ref = doc(db, "bookings", booking.id);
        const snapshot = await transaction.get(ref);
        if (!snapshot.exists()) throw new Error("This booking no longer exists.");
        const current = { id: snapshot.id, ...snapshot.data() };
        if (current.createdAt?.toMillis() !== booking.createdAt?.toMillis()) {
          throw new Error("This slot now belongs to a newer booking. Refresh the list.");
        }
        if (current.status !== "pending" && current.status !== newStatus) {
          throw new Error("This booking has changed. Refresh and try again.");
        }
        const token = current.cancellationToken || createCancellationToken();
        if (newStatus === "confirmed") {
          transaction.set(doc(db, "bookingCancellations", token), cancellationDetails(current));
          transaction.update(ref, { status: newStatus, cancellationToken: token });
        } else {
          if (current.status !== "denied") transaction.set(doc(collection(db, "bookingHistory")), { ...current, status: "denied" });
          transaction.update(ref, { status: newStatus });
          transaction.delete(doc(db, "availability", current.slotKey));
          if (current.cancellationToken) transaction.delete(doc(db, "bookingCancellations", current.cancellationToken));
        }
        return { ...current, cancellationToken: token };
      });
    } catch (err) {
      notifications.show({ title: "Update Failed", message: err.message, color: "red" });
      setBusyId(null);
      return;
    }

    // Save succeeded. Email failure must offer a resend, not repeat the mutation.
    try {
      const emailHtml = newStatus === "confirmed"
        ? renderToStaticMarkup(<ConfirmationEmail {...emailBooking} />)
        : renderToStaticMarkup(<DenialEmail {...emailBooking} />);
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        {
          client_name: `${emailBooking.firstName} ${emailBooking.lastName}`,
          client_email: emailBooking.email,
          status: newStatus.toUpperCase(),
          date: emailBooking.bookingDate,
          time: emailBooking.bookingTime,
          message_html: emailHtml,
        },
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
      );
      notifications.show({ message: "Booking updated and email sent.", color: "green" });
    } catch {
      notifications.show({ title: "Booking Saved", message: "The email could not be sent. Use Resend Email to retry.", color: "yellow" });
    } finally {
      await fetchBookings();
      if (selectedBooking?.id === booking.id) close();
      setBusyId(null);
    }
  };

  const handleDeleteBooking = (booking) => {
    const bookingId = booking.id;
    modals.openConfirmModal({
      title: "Confirm Cancellation",
      centered: true,
      radius: 0,
      children: (
        <Text size="sm">
          Are you sure you want to delete this booking? This will permanently
          remove the client record and immediately free up the time slot for
          others. This action cannot be undone.
        </Text>
      ),
      labels: { confirm: "Yes, Cancel & Delete", cancel: "No, Keep Record" },
      confirmProps: { color: "red", radius: 0 },
      cancelProps: { radius: 0 },
      onConfirm: async () => {
        try {
          await runTransaction(db, async (transaction) => {
            const ref = doc(db, "bookings", bookingId);
            const snapshot = await transaction.get(ref);
            if (!snapshot.exists()) return;
            const current = snapshot.data();
            if (current.createdAt?.toMillis() !== booking.createdAt?.toMillis()) {
              throw new Error("This slot now belongs to a newer booking. Refresh the list.");
            }
            transaction.delete(ref);
            // A denied record has already released its slot.
            if (current.status !== "denied") transaction.delete(doc(db, "availability", current.slotKey));
            if (current.cancellationToken) transaction.delete(doc(db, "bookingCancellations", current.cancellationToken));
          });
          await fetchBookings();
          if (selectedBooking?.id === bookingId) close();
          notifications.show({
            message: "Booking record successfully removed.",
            color: "gray",
          });
        } catch (err) {
          console.error("Error deleting booking:", err);
          notifications.show({
            title: "Delete Failed",
            message: "Could not remove the booking record.",
            color: "red",
          });
        }
      },
    });
  };

  const viewDetails = (booking) => {
    setSelectedBooking(booking);
    open();
  };

  if (loading || user === undefined) {
    return (
      <Container py="xl" style={{ display: "flex", justifyContent: "center" }}>
        <Loader size="xl" variant="dots" />
      </Container>
    );
  }

  return (
    
    <section
      style={{
        padding: "4rem 0",
        minHeight: "100vh",
      }}
    >
      <Container size="xl">
        <Stack gap="xl">
          <Group justify="space-between">
            <Title order={2}>Booking Management</Title>
            <Button variant="outline" onClick={fetchBookings} radius={0}>
              Refresh List
            </Button>
          </Group>

          {error && (
            <Alert color="red" title="Access Error">
              {error}
            </Alert>
          )}

          <Paper 
            withBorder 
            radius={0} 
            shadow="xs" 
            style={{ backgroundColor: "rgba(255, 255, 255, 0.9)" }}
          >
            <ScrollArea>
              <Table verticalSpacing="md" minWidth={800} highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Session Date</Table.Th>
                    <Table.Th>Client Information</Table.Th>
                    <Table.Th>Occasion</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {bookings.map((booking) => (
                    <Table.Tr key={booking.id}>
                      <Table.Td>
                        <Text size="sm" fw={600}>
                          {booking.bookingDate}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {booking.bookingTime}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" fw={500}>
                          {booking.firstName} {booking.lastName}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {booking.email}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{booking.occasion || "—"}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          color={
                            booking.status === "confirmed"
                              ? "teal"
                              : booking.status === "denied"
                                ? "red"
                                : "yellow"
                          }
                          variant="light"
                        >
                          {booking.status}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Button
                            size="compact-xs"
                            disabled={busyId !== null}
                            variant="subtle"
                            onClick={() => viewDetails(booking)}
                          >
                            Details
                          </Button>
                          {booking.status !== "pending" && (
                            <Button size="compact-xs" disabled={busyId !== null}
                              onClick={() => handleStatusUpdate(booking, booking.status)}>
                              Resend Email
                            </Button>
                          )}
                          {booking.status === "pending" && (
                            <>
                              <Button
                                size="compact-xs"
                            disabled={busyId !== null}
                                color="teal"
                                onClick={() =>
                                  handleStatusUpdate(booking, "confirmed")
                                }
                              >
                                Confirm
                              </Button>
                              <Button
                                size="compact-xs"
                            disabled={busyId !== null}
                                color="red"
                                variant="subtle"
                                onClick={() =>
                                  handleStatusUpdate(booking, "denied")
                                }
                              >
                                Deny
                              </Button>
                            </>
                          )}
                          <Button
                            size="compact-xs"
                            disabled={busyId !== null}
                            color="gray"
                            variant="subtle"
                            onClick={() => handleDeleteBooking(booking)}
                          >
                            Delete
                          </Button>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                  {bookings.length === 0 && (
                    <Table.Tr>
                      <Table.Td colSpan={5}>
                        <Text align="center" py="xl" c="dimmed">
                          No booking requests found.
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          </Paper>
        </Stack>

        {/* Detailed Visualization Modal */}
        <Modal
          opened={opened}
          onClose={close}
          title="Full Booking Details"
          size="lg"
          radius={0}
          zIndex={2000}
        >
          {selectedBooking && (
            <Stack gap="md">
              <SimpleGrid cols={2}>
                <div>
                  <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                    Client
                  </Text>
                  <Text fw={500}>
                    {selectedBooking.firstName} {selectedBooking.lastName}
                  </Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                    Contact
                  </Text>
                  <Text size="sm">{selectedBooking.email}</Text>
                  <Text size="sm">{selectedBooking.phone}</Text>
                </div>
              </SimpleGrid>

              <Paper withBorder p="sm" bg="gray.0">
                <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                  Session Request
                </Text>
                <Text fw={500}>
                  {selectedBooking.bookingDate} at {selectedBooking.bookingTime}
                </Text>
                <Text size="sm" mt="xs">
                  <b>Occasion:</b> {selectedBooking.occasion || "Not specified"}
                </Text>
              </Paper>

              <div>
                <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                  Client Notes
                </Text>
                <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                  {selectedBooking.notes || "No extra notes provided."}
                </Text>
              </div>

              <Group justify="flex-end" mt="xl">
                {selectedBooking.status === "pending" && (
                  <>
                    <Button
                      color="red"
                      variant="light"
                      disabled={busyId !== null}
                      onClick={() =>
                        handleStatusUpdate(selectedBooking, "denied")
                      }
                    >
                      Deny & Free Slot
                    </Button>
                    <Button
                      color="teal"
                      disabled={busyId !== null}
                      onClick={() =>
                        handleStatusUpdate(selectedBooking, "confirmed")
                      }
                    >
                      Confirm Booking
                    </Button>
                  </>
                )}
                <Button
                  color="red"
                  variant="subtle"
                  onClick={() => handleDeleteBooking(selectedBooking)}
                >
                  Delete Record
                </Button>
                <Button variant="default" onClick={close}>
                  Close
                </Button>
              </Group>
            </Stack>
          )}
        </Modal>
      </Container>
    </section>
  );
}

export default AdminBookings;
