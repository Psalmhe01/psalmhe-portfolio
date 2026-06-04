// src/Components/Admin/AdminDashboard.jsx

import { useNavigate } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext.jsx";
import {
  AppShell,
  Group,
  Text,
  Button,
  Title,
  Stack,
  Paper,
  SimpleGrid,
  UnstyledButton,
  Container,
  Box,
  ThemeIcon,
} from "@mantine/core";
import { IconPhoto, IconCalendar, IconChevronRight } from "@tabler/icons-react";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const options = [
    {
      title: "Client Galleries",
      description: "Manage photos, design settings and client passwords",
      icon: IconPhoto,
      color: "blue",
      path: "/admin/galleries",
    },
    {
      title: "Booking Requests",
      description: "View, confirm or deny incoming photography sessions",
      icon: IconCalendar,
      color: "teal",
      path: "/admin/bookings",
    },
  ];

  return (
    <AppShell header={{ height: 56 }} padding="md" bg="gray.0">
      <AppShell.Header
        px="md"
        my={100}
        style={{
          backgroundColor: "rgba(196, 196, 196, 0.75)",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
          backdropFilter: "blur(8px)",
          borderStyle: "hidden",
        }}
      >
        <Group h="100%" justify="space-between">
          <Group gap="xs">
            <Text>📸</Text>
            <Text fw={600} size="sm">
              Admin Portal
            </Text>
          </Group>
          <Group gap="sm">
            <Text size="xs" c="dimmed">
              {user?.email}
            </Text>
            <Button variant="subtle" size="xs" color="gray" onClick={logout} radius={0}>
              Sign out
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main
        style={{
          position: "relative",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
        }}
      >
        {/* Background Layer with Blur and Dimming */}
        <Box
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage:
              "url('https://res.cloudinary.com/dwzx3jib2/image/upload/v1779189503/galleries/psalmhe-images/ej1d4kgglcvtermouajq.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(6px) brightness(40%)",
            transform: "scale(1.1)",
            zIndex: 0,
          }}
        />

        <Container
          size="md"
          fluid
          style={{ position: "relative", zIndex: 1, width: "100%" }}
        >
          <Stack gap="xl">
            <Title order={1} ta="center" fw={700} c="white">
              Welcome, Boss. What would you like to manage?
            </Title>

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
              {options.map((opt) => (
                <Paper
                  key={opt.title}
                  withBorder
                  p="xl"
                  radius={0}
                  component={UnstyledButton}
                  onClick={() => navigate(opt.path)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    transition: "transform 200ms ease, box-shadow 200ms ease",
                    backgroundColor: "rgba(255, 255, 255, 0.8)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <ThemeIcon
                    size={60}
                    radius={0}
                    color={opt.color}
                    variant="light"
                  >
                    <opt.icon size={36} stroke={1.5} />
                  </ThemeIcon>

                  <Text fw={700} size="lg" mt="md">
                    {opt.title}
                  </Text>
                  <Text size="sm" c="dimmed" ta="center" mt="xs">
                    {opt.description}
                  </Text>

                  <Group gap={4} mt="xl" c={opt.color}>
                    <Text size="xs" fw={700} tt="uppercase">
                      Open Manager
                    </Text>
                    <IconChevronRight size={14} />
                  </Group>
                </Paper>
              ))}
            </SimpleGrid>
          </Stack>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
