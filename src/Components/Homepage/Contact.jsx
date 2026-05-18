import "../../Style/Body.css";
import React from "react";
import { useForm, ValidationError } from "@formspree/react";
import ContactBox from "../ContactBox.jsx";
import {
  Box,
  Paper,
  Container,
  SimpleGrid,
  TextInput,
  Textarea,
  Button,
  Title,
  Text,
  Stack,
} from "@mantine/core";

function Contact() {
  const [state, handleSubmit] = useForm("xkgqzeey");

  return (
    <Box component="section" id="contact" py={100} bg="gray.0">
      <Container>
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing={80}>
          <ContactBox />
          <Paper p="xl" radius={0} withBorder>
            <Title order={3} mb="xl">
              Connect Via Email
            </Title>
            {state.succeeded ? (
              <Text c="teal" fw={700} size="lg">
                Thanks for reaching out! I'll get back to you soon.
              </Text>
            ) : (
              <form onSubmit={handleSubmit} className="forms">
                <Stack gap="md">
                  <TextInput
                    label="First Name"
                    placeholder="Enter your first name"
                    name="First Name"
                    required
                    id="firstName"
                    size="md"
                    classNames={{ root: "form-field" }}
                  />
                  <TextInput
                    label="Last Name"
                    placeholder="Enter your last name"
                    name="Last Name"
                    required
                    id="lastName"
                    size="md"
                    classNames={{ root: "form-field" }}
                  />
                  <TextInput
                    label="Email Address"
                    placeholder="Enter your email"
                    name="Email"
                    required
                    id="email"
                    size="md"
                    classNames={{ root: "form-field" }}
                  />
                  <ValidationError
                    prefix="Email"
                    field="email"
                    errors={state.errors}
                  />
                  <Textarea
                    label="Message"
                    placeholder="Enter your message"
                    name="Message"
                    required
                    minRows={5}
                    id="message"
                    size="md"
                    classNames={{ root: "form-field" }}
                  />
                  <ValidationError
                    prefix="Message"
                    field="message"
                    errors={state.errors}
                  />
                  <Button
                    type="submit"
                    loading={state.submitting}
                    size="lg"
                    fullWidth
                    className="form-btn"
                  >
                    Submit
                  </Button>
                </Stack>
              </form>
            )}
          </Paper>
        </SimpleGrid>
      </Container>
    </Box>
  );
}
export default Contact;
