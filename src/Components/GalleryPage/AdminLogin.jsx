import { useState } from "react";
import { useAuth } from "../../Context/AuthContext.jsx";
import { ADMIN_EMAIL } from "../../adminAccess";
import { Center, Paper, Title, TextInput, PasswordInput, Button, Stack, Text, Alert } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";

function errorMessage(error) {
  if (["auth/invalid-credential", "auth/wrong-password", "auth/user-not-found", "auth/invalid-email"].includes(error.code))
    return "Invalid email or password.";
  if (error.code === "auth/too-many-requests") return "Too many attempts. Please wait a few minutes before trying again.";
  if (error.code === "auth/network-request-failed") return "Unable to connect. Check your connection and try again.";
  return error.code ? "Unable to complete sign-in. Please try again." : error.message;
}
export default function AdminLogin() {
  const { user, login, logout, sendVerification, refreshVerification } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  const needsVerification = user?.email === ADMIN_EMAIL && !user.emailVerified;
  const run = async (action, task) => {
    if (busy) return;
    setBusy(action); setError(""); setNotice("");
    try { await task(); }
    catch (err) { setError(errorMessage(err)); }
    finally { setBusy(""); }
  };
  const handleSubmit = event => {
    event.preventDefault();
    void run("login", async () => { await login(email, password); setPassword(""); });
  };
  return (
    <Center h="100vh" bg="gray.1" p="md">
      <Paper withBorder shadow="sm" p="xl" radius={0} w="100%" maw={400}>
        <Stack align="center" gap="xs" mb="lg">
          <Text size="2rem">📷</Text>
          <Title order={2} fw={600} size="h3">Admin Login</Title>
        </Stack>
        {needsVerification ? (
          <Stack gap="sm">
            <Text size="sm">Verify {user.email} to open your admin dashboard.</Text>
            <Text size="sm" c="dimmed">Send a verification email, open its link, then return here.</Text>
            <Button disabled={Boolean(busy)} loading={busy === "send"} onClick={() => run("send", async () => {
              await sendVerification();
              setNotice("Verification email sent. Check your inbox and spam folder.");
            })}>Send Verification Email</Button>
            <Button variant="outline" disabled={Boolean(busy)} loading={busy === "verify"}
              onClick={() => run("verify", refreshVerification)}>I've Verified My Email</Button>
            <Button variant="subtle" disabled={Boolean(busy)} onClick={() => run("logout", async () => {
              await logout(); setPassword("");
            })}>Use a Different Account</Button>
          </Stack>
        ) : (
          <form onSubmit={handleSubmit}>
            <Stack gap="sm">
              <TextInput label="Email" placeholder="you@example.com" type="email" autoComplete="username"
                value={email} onChange={event => setEmail(event.target.value)} required />
              <PasswordInput label="Password" placeholder="Your password" autoComplete="current-password"
                value={password} onChange={event => setPassword(event.target.value)} required />
              <Button fullWidth type="submit" loading={busy === "login"} disabled={Boolean(busy)} mt="xs" radius={0}>Sign In</Button>
            </Stack>
          </form>
        )}
        {error && <Alert mt="sm" role="alert" icon={<IconAlertCircle size={16} />} color="red" variant="light" p="xs">{error}</Alert>}
        {notice && <Alert mt="sm" role="status" color="teal" variant="light" p="xs">{notice}</Alert>}
      </Paper>
    </Center>
  );
}
