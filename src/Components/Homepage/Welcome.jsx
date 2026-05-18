import "../../Style/Body.css";
import { heroPics } from "../../Files/HomeImage.jsx";
import { Link } from "react-router-dom";
import {
  Box,
  Container,
  Group,
  Title,
  Text,
  Button,
  Image,
  SimpleGrid,
  Stack,
} from "@mantine/core";

function Welcome() {
  return (
    <Container
      component="section"
      className="hero"
      id="welcome"
      py={100}
      
      fluid
    >
      <Container fluid>
        <Stack align="center" ta="center" gap="xl">
          <Title order={2} size="h1" style={{ fontSize: "3.5rem" }}>
            Welcome to Psalmhe Photography
          </Title>
          <Text size="xl" maw={600} opacity={0.8}>
            Some artists hold paintbrushes, others hold lenses...
          </Text>
          <Button
            component={Link}
            to="/portfolio"
            size="xl"
            className="btn"
          >
            View Gallery
          </Button>
          <SimpleGrid
            cols={{ base: 1, md: 4 }}
            spacing="xl"
            mt={50}
            w="90%"
            className="hero-images"
          >
            {heroPics.map((pic, index) => (
              <Image
                key={index}
                src={pic}
                radius="xs"
                h={500}
                fit="cover"
                alt={`hero-${index}`}
              />
            ))}
          </SimpleGrid>
        </Stack>
      </Container>
    </Container>
  );
}

export default Welcome;
