import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendar } from "@fortawesome/free-solid-svg-icons";
import { Container, Title, Text, Button, Center, Stack } from "@mantine/core";

function Book() {
  return (
    <section style={{ padding: "4rem 0", backgroundColor: "var(--light)" }}>
      <Center>
        <Stack gap="lg" ta="center" p="xl">
          <Title order={1}>Book Your Photoshoot</Title>
          <Text size="lg" maw={500}>
            Ready to capture your moment? Click the button below to select your
            preferred appointment time and date. Choose a time that works best
            for you, and let's create something beautiful together.
          </Text>
          <Button
            component="a"
            href="https://psalmhe-portfolio.dayschedule.com"
            target="_blank"
            rel="noopener noreferrer"
            size="lg"
            leftSection={<FontAwesomeIcon icon={faCalendar} />}
          >
            Book an Appointment
          </Button>
        </Stack>
      </Center>
    </section>
  );
}

export default Book;
