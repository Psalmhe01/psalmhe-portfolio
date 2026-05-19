// src/pages/AdminLogin.jsx
import { useState } from "react";
import { useAuth } from "../../Context/AuthContext.jsx";
import {
  Center,
  Paper,
  Title,
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Text,
  Alert,
} from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";

export default function AdminLogin() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Center h="100vh" bg="gray.1" p="md">
      <Paper withBorder shadow="sm" p="xl" radius={0} w="100%" maw={380}>
        <Stack align="center" gap="xs" mb="lg">
          <Text size="2rem">📷</Text>
          <Title order={2} fw={600} size="h3">
            Admin Login
          </Title>
        </Stack>

        <Stack gap="sm">
          <TextInput
            label="Email"
            placeholder="you@example.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            required
          />
          <PasswordInput
            label="Password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            required
          />

          {error && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              color="red"
              variant="light"
              p="xs"
            >
              {error}
            </Alert>
          )}

          <Button
            fullWidth
            onClick={handleSubmit}
            loading={loading}
            mt="xs"
            radius={0}
          >
            Sign In
          </Button>
        </Stack>
      </Paper>
    </Center>
  );
}
