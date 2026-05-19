import "../../Style/Body.css";
import "../../Style/Portfolio.css";
import Images from "../../Files/SliderImages.jsx";
import { Link } from "react-router-dom";
import {
  Box,
  Container,
  SimpleGrid,
  Title,
  Text,
  Image,
  Stack,
  Card,
  AspectRatio,
} from "@mantine/core";

function PortfolioPage() {
  return (
    <Box
      component="section"
      id="port"
      py={100}
      bg="gray.0"
      style={{ minHeight: "100vh" }}
    >
      <Container>
        <Stack align="center" ta="center" mb={60} gap="xs">
          <Title
            order={2}
            size="h1"
            style={{ fontSize: "3.5rem", letterSpacing: "-1px" }}
          >
            My Portfolio
          </Title>
          <Text size="xl" c="dimmed" maw={600}>
            A curated display of my artistic journey and greatest works through
            the lens.
          </Text>
        </Stack>

        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xl" style={{justifyItems: "center"}}>
          {Images.map((item, i) => (
            <Card
              key={i}
              component={Link}
              to={`/portfolio/${item.title}`}
              padding={0}
              radius={0}
              className="portfolio-item"
            >
                <Image src={item.image} alt={item.title} fit="cover" className="portfolio-image"/>
              
              <Box p="md" bg="none">
                <Title order={3} size="h4" mb={5} className="portfolio-title">
                  {item.title}
                </Title>
                <Text
                  size="sm"
                  c="dimmed"
                  fw={600}
                  style={{ textTransform: "uppercase", letterSpacing: "1px" }}
                  className="portfolio-subtitle"
                >
                  View Project
                </Text>
              </Box>
            </Card>
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  );
}

export default PortfolioPage;
