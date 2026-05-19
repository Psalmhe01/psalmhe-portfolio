import "../../Style/Body.css";
import { heroPics } from "../../Files/HomeImage.jsx";
import { Link } from "react-router-dom";
import {
  Container,
  Title,
  Text,
  Button,
  Image,
  SimpleGrid,
  Stack,
  Box,
} from "@mantine/core";

function Welcome() {
  return (
    <Box component="section" className="hero" id="welcome" py={100}>
      <Container size="xl">
        <Stack align="center" ta="center" gap="xl">
          <Title
            order={1}
            size="h1"
            style={{ fontSize: "3.5rem", lineHeight: 1.2 }}
          >
            Welcome to Psalmhe Photography
          </Title>
          <Text size="xl" maw={600} opacity={0.8}>
            Some artists hold paintbrushes, others hold lenses...
          </Text>
          <Button component={Link} to="/portfolio" size="xl" className="btn">
            View Gallery
          </Button>
          <SimpleGrid
            cols={{ base: 1, sm: 2, md: 4 }}
            spacing="xl"
            mt={50}
            w="100%"
            className="hero-images"
          >
            {heroPics &&
              heroPics.map((pic, index) => (
                <Image
                  key={index}
                  src={pic}
                  radius="xs"
                  h={500}
                  fit="cover"
                  alt={`hero-${index}`}
                  fallbackSrc="https://placehold.co/600x400?text=Image+Not+Found"
                />
              ))}
          </SimpleGrid>
        </Stack>
      </Container>
    </Box>
  );
}

export default Welcome;
