import { useEffect, useState } from "react";
import emailjs from "@emailjs/browser";
import { renderToStaticMarkup } from "react-dom/server";
import { useAuth } from "../../Context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import { ConfirmationEmail, DenialEmail } from "./EmailTemplates";
import {
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";
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
    const bookingRef = doc(db, "bookings", booking.id);
    const availabilityRef = doc(db, "availability", booking.id);

    try {
      // 1. Update status in Firestore
      await updateDoc(bookingRef, { status: newStatus });

      // 2. If denied, delete the availability document to free the slot for others
      if (newStatus === "denied") {
        await deleteDoc(availabilityRef);
      }

      // 3. Trigger Email via EmailJS
      const emailHtml =
        newStatus === "confirmed"
          ? renderToStaticMarkup(<ConfirmationEmail {...booking} />)
          : renderToStaticMarkup(<DenialEmail {...booking} />);

      const templateParams = {
        client_name: `${booking.firstName} ${booking.lastName}`,
        client_email: booking.email,
        status: newStatus.toUpperCase(),
        date: booking.bookingDate,
        time: booking.bookingTime,
        // This 'message_html' variable must be used in your EmailJS template as {{{message_html}}}
        message_html: emailHtml,
      };

      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        templateParams,
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
      );

      // Refresh the local data
      await fetchBookings();
      if (selectedBooking?.id === booking.id) close();
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Error processing request. Check permissions or console.");
    }
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
                            variant="subtle"
                            onClick={() => viewDetails(booking)}
                          >
                            Details
                          </Button>
                          {booking.status === "pending" && (
                            <>
                              <Button
                                size="compact-xs"
                                color="teal"
                                onClick={() =>
                                  handleStatusUpdate(booking, "confirmed")
                                }
                              >
                                Confirm
                              </Button>
                              <Button
                                size="compact-xs"
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
                      onClick={() =>
                        handleStatusUpdate(selectedBooking, "denied")
                      }
                    >
                      Deny & Free Slot
                    </Button>
                    <Button
                      color="teal"
                      onClick={() =>
                        handleStatusUpdate(selectedBooking, "confirmed")
                      }
                    >
                      Confirm Booking
                    </Button>
                  </>
                )}
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
