import "../../Style/Body.css";
import { logoAbt } from "../../Files/HomeImage.jsx";
import {
  Box,
  Container,
  Title,
  Text,
  Button,
  Image,
  SimpleGrid,
  Stack,
} from "@mantine/core";

function About() {
  return (
    <Box component="section" className="about" id="about">
      <Container size="xl" className="about-container">
        <Box
          className="about-grid-wrapper"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "40px",
            alignItems: "center",
          }}
        >
          <Stack className="section-title">
            <Title order={2}>About the Artist</Title>
            <Box className="name-about">
              <Title order={6}>Samuel Omosowone</Title>
              <Text alignItems="left">
                I am a freelance photographer who is passionate about creating
                magic with my lens. I have an eye for detail and I am willing to
                explore different themes, presets, moods to create an artistic
                effect. I have no professional photography or editing training
                but I have significantly gotten better between when I first
                began in 2021 and now. Not Hawkeye, but will never miss a shot!
              </Text>
            </Box>
            <Button
              component="a"
              variant="outline"
              href="#contact"
              className="btn"
              my="sm"
            >
              Learn More
            </Button>
          </Stack>
          <Box className="about-img" id="about-img-box">
            <Box component="img" src={logoAbt[2]} alt="about img" id="about" />
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

export default About;
