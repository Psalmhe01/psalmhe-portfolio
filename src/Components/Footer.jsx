import "../Style/Footer.css";
import "../App.css";
import BackToTopButton from "./TopButton.jsx";
import psalmhe2 from "../Assets/Others/psalmhe2.png";
import React, { useState } from "react";
import { useForm, ValidationError } from "@formspree/react";
import {
  Box,
  Container,
  SimpleGrid,
  Stack,
  Group,
  Text,
  Title,
  Image,
  Anchor,
  TextInput,
  Textarea,
  Button,
  Divider,
} from "@mantine/core";

function Footer() {
  const [state, handleSubmit] = useForm("xkgqzeey");
  const [filled, setFilled] = useState(false);

  return (
    <Box component="footer" pt={80} pb={40} bg="brand.7" c="white">
      <Container>
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing={50} mb={60}>
          {/* Section 1: Branding & Info */}
          <Stack gap="xl">
            <Image src={psalmhe2} alt="Psalmhe footer logo" w={150} />
            <Stack gap="sm">
              <Group gap="sm" wrap="nowrap" align="flex-start">
                <Box component="i" className="fas fa-map-marker-alt" mt={5} />
                <Text size="sm">801 Pecan Street, Hammond LA 70402</Text>
              </Group>
              <Group gap="sm" wrap="nowrap" align="center">
                <Box component="i" className="fas fa-phone" />
                <Text size="sm">(203) 994-1895</Text>
              </Group>
              <Group gap="sm" wrap="nowrap" align="center">
                <Box component="i" className="fas fa-envelope" />
                <Text size="sm">psalmhe@gmail.com</Text>
              </Group>
            </Stack>
          </Stack>

          {/* Section 2: Social Links */}
          <Stack gap="xl">
            <Box>
              <Title
                order={4}
                mb="md"
                c="white"
                style={{ letterSpacing: "1px", textTransform: "uppercase" }}
              >
                Connect Via Social Media
              </Title>
              <Text size="sm" opacity={0.7} mb="lg">
                Follow us on social media for updates and inspiration.
              </Text>
              <Group gap="md">
                <Anchor
                  href="https://www.facebook.com/share/16yzrQv8zf/"
                  target="_blank"
                  rel="noopener noreferrer"
                  c="white"
                >
                  <Box
                    component="i"
                    className="fab fa-facebook-f"
                    style={{ fontSize: "1.2rem" }}
                  />
                </Anchor>
                <Anchor
                  href="https://www.instagram.com/psalmhe01?igsh=MTR5YTZrNGduMHM5aA=="
                  target="_blank"
                  rel="noopener noreferrer"
                  c="white"
                >
                  <Box
                    component="i"
                    className="fab fa-instagram"
                    style={{ fontSize: "1.2rem" }}
                  />
                </Anchor>
                <Anchor
                  href="https://x.com/Darasola24?t=eo9Tnigl5qcSiIER00w3kA&s=09"
                  target="_blank"
                  rel="noopener noreferrer"
                  c="white"
                >
                  <Box
                    component="i"
                    className="fab fa-twitter"
                    style={{ fontSize: "1.2rem" }}
                  />
                </Anchor>
              </Group>
            </Box>
          </Stack>

          {/* Section 3: Quick Contact */}
          <Stack gap="xl">
            <Box>
              <Title
                order={4}
                mb="md"
                c="white"
                style={{ letterSpacing: "1px", textTransform: "uppercase" }}
              >
                Connect Via Email
              </Title>
              <form
                onSubmit={(e) => {
                  setFilled(true);
                  handleSubmit(e);
                }}
              >
                {filled ? (
                  <Text c="teal.3" fw={600}>
                    Thank you for reaching out!
                  </Text>
                ) : (
                  <Stack gap="md">
                    <TextInput
                      id="email"
                      type="email"
                      name="Email"
                      placeholder="Enter your email"
                      required
                      variant="filled"
                      styles={{
                        input: {
                          backgroundColor: "rgba(255,255,255,0.05)",
                          color: "white",
                          borderColor: "rgba(255,255,255,0.1)",
                          borderRadius: "0px",
                        },
                      }}
                    />
                    <ValidationError
                      prefix="Email"
                      field="email"
                      errors={state.errors}
                    />
                    <Textarea
                      id="message"
                      name="Message"
                      placeholder="Enter your message"
                      required
                      minRows={3}
                      variant="filled"
                      styles={{
                        input: {
                          backgroundColor: "rgba(255,255,255,0.05)",
                          color: "white",
                          borderColor: "rgba(255,255,255,0.1)",
                          borderRadius: "0px",
                        },
                      }}
                    />
                    <ValidationError
                      prefix="Message"
                      field="message"
                      errors={state.errors}
                    />
                    <Button
                      type="submit"
                      disabled={state.submitting}
                      variant="white"
                      c="dark"
                      fullWidth
                    >
                      Submit
                    </Button>
                  </Stack>
                )}
              </form>
            </Box>
          </Stack>
        </SimpleGrid>

        <Divider my="xl" opacity={0.1} />

        <Group justify="space-between" align="center" wrap="wrap">
          <Text size="xs" opacity={0.5}>
            &copy; 2025 Samuel Omosowone. All rights reserved.
          </Text>
          <BackToTopButton />
        </Group>
      </Container>
    </Box>
  );
}

export default Footer;
